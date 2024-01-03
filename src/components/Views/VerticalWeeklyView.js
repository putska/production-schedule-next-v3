import React, { useRef, useState } from "react";
import DataGrid, {
  Scrolling,
  Column,
  Grouping,
  GroupPanel,
  SearchPanel,
  Editing,
  Button,
  Toolbar,
  Item,
} from "devextreme-react/data-grid";
import { ColorBox } from "devextreme-react";

import {
  Box,
  Button as MaterialButton,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { addDataToJSON } from "@/lib/helper-functions";

export default function VerticalWeeklyView(props) {
  const {
    categoryKey,
    categoryColumnKey,
    cellSettingsID,
    takeoffData,
    jobs,
    takeoffMatrixs,

    colorOptions,

    handleUpdate,
    handleDelete,
    handleAdd,
    highlightJobs,
    canEdit,
  } = props;

  const settingsDataGridRef = useRef();
  const columnsDataGridRef = useRef();

  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedCell, setSelectedCell] = useState({});
  const [formData, setFormData] = useState({});

  const updateHandler = async (e, type) => {
    try {
      e.component.beginCustomLoading();
      await handleUpdate(e.data, type);
      e.component.endCustomLoading();
    } catch (error) {
      console.error(error);
      e.component.endCustomLoading();
    }
  };

  const addHandler = async (e, type) => {
    try {
      e.component.beginCustomLoading();
      await handleAdd(e.data, type);
      e.component.endCustomLoading();
    } catch (error) {
      console.error(error);
      e.component.endCustomLoading();
    }
  };

  const deleteHandler = async (e, type) => {
    try {
      e.component.beginCustomLoading();
      await handleDelete(e.data, type);
      e.component.endCustomLoading();
    } catch (error) {
      console.error(error);
      e.component.endCustomLoading();
    }
  };

  const rowPrepared = (row) => {
    row.rowElement.style.backgroundColor =
      row.dataIndex % 2 ? "#f3f4f6" : "white";
  };

  const onColorCodingRowInit = (row) => {
    row.data = {
      value: "",
      color: "white",
      category: categoryKey,
    };
  };

  const onColumnRowInit = (row) => {
    row.data = {
      header: "",
      dataField: "",
      offset: 0,
      category: categoryColumnKey,
    };
  };

  const renderGridCell = (row) => {
    const value = row.data[row.column.dataField]
      ? row.data[row.column.dataField].value
      : "";
    const isHighlight = highlightJobs.find(
      (jobs) => jobs.jobName === row.data[data.column.dataField]
    );

    return (
      <span
        style={{
          backgroundColor: `${isHighlight ? "yellow" : "none"}`,
          padding: "5px",
          float: "left",
        }}
      >
        {value}
      </span>
    );
  };

  const handleCellClick = (cell) => {
    const cellData = cell.data[cell.column.dataField];

    setSelectedCell(cell);
    setFormData({ value: cellData.value, status: cellData.status });
    setDialogVisible(true);
  };

  const handleDialogClose = () => {
    setFormData({});
    setDialogVisible(false);
  };

  const handleDialogSave = async () => {
    const newFormData = {
      ...selectedCell.data,
      [selectedCell.column.dataField]: {
        value: formData.value,
        status: formData.status,
      },
    };

    const newTakeoffData = JSON.parse(JSON.stringify(takeoffData));
    const index = newTakeoffData.findIndex(
      (row) => row.date === newFormData.date
    );

    if (index != -1) {
      newTakeoffData[index] = newFormData;
    }

    handleUpdate(newTakeoffData, "cell status");
    setDialogVisible(false);
  };

  const handleInputChange = (key, value) => {
    const newFormData = {
      ...formData,
      [key]: value,
    };
    setFormData(newFormData);
  };

  const cellPrepared = (cell) => {
    if (cell.data && cell.rowType === "data") {
      const cellData = cell.data[cell.column.dataField];
      if (cellData) {
        if (canEdit) {
          cell.cellElement.addEventListener("click", () =>
            handleCellClick(cell)
          );
        }
        if (cellData.status) {
          const bgColor = getColorFromStatus(
            cellData ? cellData.status : "none"
          );
          cell.cellElement.style.backgroundColor = bgColor;
        }
      }
    }
  };

  const getColorFromStatus = (status) => {
    const foundStatusObject = colorOptions.find(
      (option) => option.value === status
    );
    return foundStatusObject ? foundStatusObject.color : "white";
  };

  return (
    <Box m={3}>
      {canEdit && (
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            <Typography>Adjust Settings</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <DataGrid
              ref={settingsDataGridRef}
              dataSource={colorOptions}
              showRowLines
              showBorders
              allowColumnResizing
              columnAutoWidth
              highlightChanges
              repaintChangesOnly
              columnResizingMode="widget"
              wordWrapEnabled
              autoExpandAll
              cellHintEnabled
              onInitNewRow={onColorCodingRowInit}
              onRowUpdated={(e) => updateHandler(e, "setting")}
              onRowInserted={(e) => addHandler(e, "setting")}
              onRowRemoved={(e) => deleteHandler(e, "setting")}
            >
              <Editing
                mode="popup"
                allowUpdating={canEdit}
                allowAdding={canEdit}
                allowDeleting={canEdit}
                useIcons
              ></Editing>

              <Toolbar>
                <Item location="before" name="addRowButton">
                  <Grid container spacing={1}>
                    <Grid item>
                      <IconButton
                        color="primary"
                        variant="contained"
                        onClick={() => {
                          settingsDataGridRef.current.instance.addRow();
                        }}
                      >
                        <AddIcon />
                        <Typography>Add Setting</Typography>
                      </IconButton>
                    </Grid>
                  </Grid>
                </Item>
              </Toolbar>

              <Column type="buttons" width={75}>
                <Button name="edit">
                  <EditIcon color="primary" style={{ fontSize: "18px" }} />
                </Button>
                <Button name="delete">
                  <DeleteIcon color="secondary" style={{ fontSize: "18px" }} />
                </Button>
              </Column>

              <Column dataField="value" caption="Option" alignment="center" />

              <Column
                dataField="color"
                caption="Color"
                alignment="center"
                cellRender={(cell) => {
                  return (
                    <ColorBox
                      applyValueMode="instantly"
                      defaultValue={cell.data.color}
                      readOnly={true}
                    />
                  );
                }}
                editCellRender={(cell) => {
                  return (
                    <ColorBox
                      defaultValue={cell.data.color}
                      onValueChange={(color) => cell.setValue(color)}
                    />
                  );
                }}
              />
            </DataGrid>

            <DataGrid
              ref={columnsDataGridRef}
              dataSource={takeoffMatrixs}
              showRowLines
              showBorders
              allowColumnResizing
              columnAutoWidth
              highlightChanges
              repaintChangesOnly
              columnResizingMode="nextColumn"
              wordWrapEnabled
              autoExpandAll
              onInitNewRow={onColumnRowInit}
              onRowUpdated={(e) => updateHandler(e, "column")}
              onRowInserted={(e) => addHandler(e, "column")}
              onRowRemoved={(e) => deleteHandler(e, "column")}
            >
              <Editing
                mode="popup"
                allowUpdating={canEdit}
                allowAdding={canEdit}
                allowDeleting={canEdit}
                useIcons
              />

              <Toolbar>
                <Item location="before" name="addRowButton">
                  <Grid container spacing={1}>
                    <Grid item>
                      <IconButton
                        color="primary"
                        variant="contained"
                        onClick={() => {
                          columnsDataGridRef.current.instance.addRow();
                        }}
                      >
                        <AddIcon />
                        <Typography>Add Column</Typography>
                      </IconButton>
                    </Grid>
                  </Grid>
                </Item>
              </Toolbar>

              <Column type="buttons" width={75}>
                <Button name="edit">
                  <EditIcon color="primary" style={{ fontSize: "18px" }} />
                </Button>
                <Button name="delete">
                  <DeleteIcon color="secondary" style={{ fontSize: "18px" }} />
                </Button>
              </Column>

              <Column
                dataField="header"
                caption="Header"
                dataType="string"
                alignment="left"
              />
              <Column
                dataField="dataField"
                caption="Data Field"
                dataType="string"
                alignment="left"
              />
              <Column
                dataField="offset"
                caption="Offset Amount"
                dataType="number"
                alignment="left"
              />
            </DataGrid>
          </AccordionDetails>
        </Accordion>
      )}

      <DataGrid
        height="75vh"
        dataSource={takeoffData}
        showBorders
        allowColumnResizing
        columnAutoWidth
        highlightChanges
        repaintChangesOnly
        columnResizingMode="widget"
        wordWrapEnabled
        autoExpandAll
        showRowLines={false}
        onRowPrepared={rowPrepared}
        onCellPrepared={cellPrepared}
      >
        <Scrolling mode="standard" />
        <GroupPanel visible={false} autoExpandAll />
        <SearchPanel visible highlightCaseSensitive={false} />
        <Grouping autoExpandAll />
        <Editing mode="row" useIcons allowSorting={false} />

        <Column
          dataField="date"
          caption="Date"
          alignment="left"
          width={100}
          allowEditing={false}
        />

        {takeoffMatrixs.map((header, i) => (
          <Column
            key={header.ID}
            dataField={header.dataField}
            caption={header.header}
            cellRender={renderGridCell}
            alignment="center"
            minWidth="10vw"
            calculateCellValue={(cell) => {
              const cellData = cell[header.dataField];
              return cellData ? cellData.value : "";
            }}
          />
        ))}
      </DataGrid>

      <Dialog open={dialogVisible} onClose={handleDialogClose}>
        <DialogContent>
          <FormControl fullWidth variant="outlined" style={{ marginTop: 10 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.status}
              onChange={(e) => handleInputChange("status", e.target.value)}
              label="Status"
            >
              {colorOptions.map((option) => (
                <MenuItem
                  key={option.value}
                  value={option.value}
                  style={{
                    color: `${
                      option.color != "white" ? option.color : "black"
                    }`,
                  }}
                >
                  {option.value}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>

        <DialogActions>
          <MaterialButton onClick={handleDialogClose} color="primary">
            Cancel
          </MaterialButton>
          <MaterialButton onClick={handleDialogSave} color="primary">
            Save
          </MaterialButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
