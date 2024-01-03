import React, { useState, useEffect } from "react";
import DataGrid, {
    Column,
    SearchPanel,
    Scrolling,
    MasterDetail,
    Export,
    Editing
} from "devextreme-react/data-grid";
import DateBox from 'devextreme-react/date-box';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { exportDataGrid } from 'devextreme/excel_exporter';
import Typography from "@mui/material/Typography";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import Box from '@mui/material/Box';
import { SelectBox } from 'devextreme-react/select-box';
import Snackbar from '@mui/material/Snackbar';
import {
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    TextareaAutosize,
    Button as MaterialButton,
    Checkbox,
    Grid,
    FormControlLabel,
    FormGroup,
    Paper
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';

import {
    toMondayDate,
    toDays,
    toWeeks,
    addDays,
    createCalendarData,

    getJobName,
    getJobColor,
    getTask,
    updateJSONWithData
} from "@/lib/helper-functions";

const formOptions = [

    { dataField: 'booked', label: "Booked", editorType: "bool", readOnly: false },
    { dataField: 'engineering', label: "Engineering", editorType: "bool", readOnly: false },
    { dataField: 'stickwall', label: "Stickwall", editorType: "bool", readOnly: false },
    { dataField: 'reserved', label: "Reserved", editorType: "bool", readOnly: false },

    { dataField: 'jobNumber', label: "Job Number", editorType: "text", readOnly: false },
    { dataField: 'jobName', label: "Job Name", editorType: "text", readOnly: false },
    { dataField: 'customer', label: "Customer", editorType: "text", readOnly: false },
    { dataField: 'wallType', label: "Wall Type", editorType: "text", readOnly: false },
    { dataField: 'unitsPerWeek', label: "Units Per Week", editorType: "text", type: "number", readOnly: false },
    { dataField: 'units', label: "Units", editorType: "text", type: "number", readOnly: false },
    { dataField: 'fieldStart', label: "Field Start Date", editorType: "date", readOnly: false },
    { dataField: 'weeksToGoBack', label: "Weeks to Go Back", editorType: "text", type: "number", readOnly: false },
    { dataField: 'emps', label: "Employees", editorType: "text", type: "number", readOnly: false },

    { dataField: 'weeks', label: "Weeks", editorType: "text", type: "number", readOnly: false },

    { dataField: 'shopStart', label: "Shop Start Date", editorType: "date", readOnly: false },

    { dataField: 'metalTakeoff', label: "Metal Takeoff Date", editorType: "date", readOnly: true },
    { dataField: 'end', label: "End Date", editorType: "date", readOnly: true },
]


const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const JobForm = (props) => {
    const {
        categoryKey,
        formData,
        setFormData,
        formVisible,
        setFormVisible,
        hidePopup,
        jobs,
        shopSettings,
        handleUpdate,
        handleAdd,
    } = props;

    const [height, setHeight] = useState(100);
    const [fieldStartFocused, setFieldStartFocused] = useState(false);
    const [open, setOpen] = useState(false);

    const handleClose = () => {
        setOpen(false);
    }

    const savePopupForm = async () => {
        if (formData.ID) {
            await handleUpdate(formData, "job");
        } else {
            await handleAdd(formData, "job");
        }
        setFormVisible(false);
    }

    const overlapping = (newMetalTakeoff) => {
        let foundOverlappingDate = jobs.find(job => {
            return toMondayDate(job.metalTakeoff).toLocaleDateString() === newMetalTakeoff.toLocaleDateString()
        })

        return foundOverlappingDate != undefined;
    }

    const calculateMetalTakeoffDate = (startDate, weeksToGoBack) => {
        let newWeeksToGoBack = weeksToGoBack;
        let daysToAdd = newWeeksToGoBack * 7 * -1;
        let newMetalTakeoff = toMondayDate(addDays(new Date(startDate), daysToAdd));

        let foundOverlappingDate = overlapping(newMetalTakeoff);

        if (foundOverlappingDate) {
            setOpen(true);
        }

        while (foundOverlappingDate) {
            newWeeksToGoBack++;
            daysToAdd = newWeeksToGoBack * 7 * -1;
            newMetalTakeoff = toMondayDate(addDays(new Date(startDate), daysToAdd));
            foundOverlappingDate = overlapping(newMetalTakeoff);
        }

        return { newMetalTakeoff: newMetalTakeoff, newWeeksToGoBack: newWeeksToGoBack }
    }

    const handleInputChange = (option, value) => {

        if (value != undefined) {
            let updatedValue = value;

            if (option.editorType === "date") {
                const parsedDate = Date.parse(value);
                updatedValue = isNaN(parsedDate) ? new Date() : new Date(parsedDate);
            } else if (option.editorType === "text" && option.editorType === "number") {
                updatedValue = parseInt(value);
            }

            const newFormData = {
                ...formData,
                [option.dataField]: updatedValue,
            }

            // EDIT NECESSARY FIELDS

            // unitsPerWeek
            if (newFormData.shopID && newFormData.unitsPerWeek == 0) {
                const shop = shopSettings.find(shop => shop.ID === newFormData.shopID)
                newFormData.unitsPerWeek = (shop && shop.value === "La Verne") ? 125 : 150;
            }

            // weeks
            if (!newFormData.stickwall && newFormData.unitsPerWeek > 0) {
                newFormData.weeks = Math.ceil(newFormData.units / newFormData.unitsPerWeek);
            } else if (newFormData.stickwall) {
                newFormData.unitsPerWeek = 0;
                newFormData.units = 0;
            }

            // shop start
            if (newFormData.shopStart == null && newFormData.fieldStart != null && newFormData.weeks > 0 && !fieldStartFocused) {
                const daysToAdd = newFormData.weeks * 7 * -1; // multiply by -1 bc start is before field start
                newFormData.shopStart = addDays(newFormData.fieldStart, daysToAdd);
                newFormData.shopStart = toMondayDate(newFormData.shopStart);
            }

            // metal takeoff 
            if ( newFormData.shopStart != null && (option.dataField === "weeksToGoBack" || newFormData.metalTakeoff == null)) {
                const {
                    newMetalTakeoff,
                    newWeeksToGoBack
                } = calculateMetalTakeoffDate(newFormData.shopStart, newFormData.weeksToGoBack);
                newFormData.metalTakeoff = newMetalTakeoff;
                newFormData.weeksToGoBack = newWeeksToGoBack;
            }

            // weeks to go back
            if (option.dataField === "shopStart" && newFormData.shopStart != null && newFormData.metalTakeoff != null) {
                newFormData.weeksToGoBack = toWeeks(newFormData.shopStart, newFormData.metalTakeoff)
            }

            // end date
            if (newFormData.weeks > 0 && newFormData.shopStart != null) {
                newFormData.end = addDays(newFormData.shopStart, newFormData.weeks * 7);
            }


            // check if date has been changed
            const dateFields = ["shopStart", "metalTakeoff", "end"]
            const dateChanged = dateFields.some(field => {
                const newDate = new Date(newFormData[field])
                const oldDate = new Date(formData[field])
                if (newDate !== null && oldDate !== null) {
                    return newDate.toLocaleDateString() === oldDate.toLocaleDateString();
                }
                return false;
            })

            newFormData.jobDatesUpdated = dateChanged ? new Date() : null;
            setFormData(newFormData);
        }
    };

    return (
        <Dialog open={formVisible} onClose={hidePopup} scroll="paper" fullWidth >
            <DialogTitle>{formData.jobName}</DialogTitle>
            <DialogContent height={`${height}`} width={`auto`}>
                <Grid container spacing={2} direction="row">
                    <Grid item xs={100}>
                        <SelectBox
                            dataSource={shopSettings}
                            value={formData.shopID}
                            valueExpr="ID"
                            displayExpr="value"
                            style={{ padding: "10px", fontSize: "18px" }}
                            onValueChanged={(e) => handleInputChange({ dataField: "shopID" }, e.value)}
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={formData.booked}
                                    style={{ float: "left" }}
                                    onChange={(e) => handleInputChange({ dataField: "booked" }, e.target.checked)}
                                />
                            }
                            label="Booked"
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={formData.engineering}
                                    style={{ float: "left" }}
                                    onChange={(e) => handleInputChange({ dataField: "engineering" }, e.target.checked)}
                                />
                            }
                            label="Engineering"
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={formData.stickwall}
                                    style={{ float: "left" }}
                                    onChange={(e) => handleInputChange({ dataField: "stickwall" }, e.target.checked)}
                                />
                            }
                            label="Stickwall"
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={formData.reserved}
                                    style={{ float: "left" }}
                                    onChange={(e) => handleInputChange({ dataField: "reserved" }, e.target.checked)}
                                />
                            }
                            label="Reserved"
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <TextField
                            label="Job Number"
                            variant="outlined"
                            fullWidth
                            value={formData.jobNumber}
                            onChange={(e) => handleInputChange({ dataField: "jobNumber" }, e.target.value)}
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <TextField
                            label="Job Name"
                            variant="outlined"
                            fullWidth
                            value={formData.jobName}
                            onChange={(e) => handleInputChange({ dataField: "jobName" }, e.target.value)}
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <TextField
                            label="Customer"
                            variant="outlined"
                            fullWidth
                            value={formData.customer}
                            onChange={(e) => handleInputChange({ dataField: "customer" }, e.target.value)}
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <TextField
                            label="Wall Type"
                            variant="outlined"
                            fullWidth
                            value={formData.wallType}
                            onChange={(e) => handleInputChange({ dataField: "wallType" }, e.target.value)}
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <TextField
                            label="Units Per Week"
                            variant="outlined"
                            fullWidth
                            type="number"
                            min={0}
                            value={formData.unitsPerWeek}
                            onChange={(e) => handleInputChange({ dataField: "unitsPerWeek" }, e.target.value)}
                            disabled={formData.stickwall}
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <TextField
                            label="Units"
                            variant="outlined"
                            fullWidth
                            type="number"
                            min={0}
                            value={formData.units}
                            onChange={(e) => handleInputChange({ dataField: "units" }, e.target.value)}
                            disabled={formData.stickwall}
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <TextField
                            label="Weeks"
                            variant="outlined"
                            fullWidth
                            type="number"
                            min={0}
                            value={formData.weeks}
                            onChange={(e) => handleInputChange({ dataField: "weeks" }, e.target.value)}
                            InputProps={{ readOnly: !formData.stickwall}}
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <TextField
                            label="Weeks To Go Back"
                            variant="outlined"
                            fullWidth
                            type="number"
                            min={0}
                            value={formData.weeksToGoBack}
                            onChange={(e) => handleInputChange({ dataField: "weeksToGoBack" }, e.target.value)}
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <DateBox
                            value={formData.fieldStart}
                            label="Field Start"
                            style={{ padding: "12px", margin: "0" }}
                            onValueChanged={(e) => handleInputChange({ dataField: "fieldStart", editorType: "date" }, e.value)}
                            type="date"
                            onFocusIn={() => setFieldStartFocused(true)}
                            onFocusOut={() => {
                                const newFormData = { ...formData }
                                if (newFormData.shopStart == null && newFormData.fieldStart != null && newFormData.weeks > 0) {
                                    const daysToAdd = newFormData.weeks * 7 * -1; // multiply by -1 bc start is before field start
                                    newFormData.shopStart = addDays(newFormData.fieldStart, daysToAdd);
                                    newFormData.shopStart = toMondayDate(newFormData.shopStart);
                                }
                                setFormData(newFormData)
                                setFieldStartFocused(false);
                            }}
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <DateBox
                            value={formData.shopStart}
                            label="Shop Start Date"
                            style={{ padding: "12px", margin: "0" }}
                            onValueChanged={(e) => handleInputChange({ dataField: "shopStart", editorType: "date" }, e.value)}
                            type="date"
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <DateBox
                            value={formData.metalTakeoff}
                            label="Metal Takeoff Date"
                            style={{ padding: "12px", margin: "0" }}
                            type="date"
                            readOnly
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <DateBox
                            value={formData.end}
                            label="End Date"
                            style={{ padding: "12px", margin: "0" }}
                            type="date"
                            readOnly
                        />
                    </Grid>

                    <Snackbar
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                        open={open}
                        onClose={handleClose}
                        autoHideDuration={3000}
                    >
                        <Alert severity="info">
                            Weeks to go back automatically updated to avoid overlapping metal takeoff dates!
                        </Alert>
                    </Snackbar>
                </Grid>
            </DialogContent>

            <DialogActions>
                <MaterialButton onClick={savePopupForm} variant="outlined" >Save</MaterialButton>
                <MaterialButton onClick={hidePopup}>Cancel</MaterialButton>
            </DialogActions>
        </Dialog>
    );
};

export default JobForm;
