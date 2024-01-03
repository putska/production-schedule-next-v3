import React, { useState, useEffect, useRef } from "react";
import DataGrid, {
  Column,
  ColumnFixing,
  Grouping,
  GroupPanel,
  LoadPanel,
  SearchPanel,
  Summary,
  TotalItem,
  GroupItem,
  Sorting,
  SortByGroupSummaryInfo,
  Pager,
  Export,
  Paging,
  Editing,
  Form,
  RequiredRule,
  Popup,
  Lookup,
  Toolbar,
  Item,
  Scrolling,
  Button,
  FilterRow,
} from "devextreme-react/data-grid";
import { TagBox, ColorBox, DateBox } from "devextreme-react";

import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Grid,
  Button as MaterialButton,
  ButtonGroup,
  IconButton,
  FormControlLabel,
  Checkbox,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  typographyClasses,
  Dialog,
  DialogActions,
  DialogContent,
  TextField,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  CategoryRounded,
} from "@mui/icons-material";

import {
  month,
  convertToDate,
  convertDates,
  toOffset,
  toMondayDate,
  addDays,
  toWeeks,
  getMondays,
  getEmployees,
  lightOrDark,
} from "@/lib/helper-functions";

import { Workbook } from "exceljs";
import { saveAs } from "file-saver";
import { exportDataGrid } from "devextreme/excel_exporter";
import JobForm from "@/src/components/Views/PS_JobForm";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

const ENGINEERING_COLOR = "salmon";
const BOOKED_COLOR = "cyan";
const RESERVED_COLOR = "red";
const SHOPSTART_COLOR = "green";
const FIELDSTART_COLOR = "red";

const officialStartDate = "1/1/2022";

const filterOperations = [
  "contains",
  "notcontains",
  "startswith",
  "endswith",
  "=",
];

const locations = [
  { ID: 0, value: "Fremont", shops: ["Shop A", "Shop B", "Shop A Stick"] },
  { ID: 1, value: "LA", shops: ["La Verne", "Wright Avenue"] },
  { ID: 2, value: "Las Vegas", shops: ["Las Vegas"] },
];

export default function GanttView(props) {
  const {
    jobs,
    shopSettings,
    columns,
    columnsX,
    startDate,
    endDate,
    handleDateChange,

    categoryKey,
    customColumns,
    showEditButtons,
    showShopButtons,
    showLocationButtons,
    sortByFieldStart,
    sortByShopStart,

    saveByFieldStart,
    saveByShopStart,

    handleAdd,
    handleDelete,
    handleUpdate,
    canEdit,
  } = props;

  const [expanded, setExpanded] = useState(true);
  const [formData, setFormData] = useState({});
  const [formVisible, setFormVisible] = useState(false);
  const [showGanttSection, setShowGanttSection] = useState(true);
  const [ganttData, setGanttData] = useState([]);

  const [shop, setShop] = useState(null);
  const [shopID, setShopID] = useState(null);
  const [locationID, setLocationID] = useState(null);

  const [cellFormVisible, setCellFormVisible] = useState(false);
  const [selectedCell, setSelectedCell] = useState({});
  const [cellFormData, setCellFormData] = useState({});

  const dataGridRef = useRef();
  const settingsDataGridRef = useRef();
  const [isMobileView, setIsMobileView] = useState(false);
  const [focusedRowKey, setFocusedRowKey] = useState(null);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [selectedPageIndex, setSelectedPageIndex] = useState(1);
  const [searchValue, setSearchValue] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (showShopButtons && window.localStorage) {
        const storedValue = localStorage.getItem(`${categoryKey}_ganttShopID`);
        if (
          storedValue &&
          storedValue != "null" &&
          shopSettings.some((setting) => setting.ID === storedValue)
        ) {
          setShopID(storedValue);
        } else if (shopSettings.length > 0) {
          setShopID(shopSettings[0].ID);
        }
      }
      if (showLocationButtons && window.localStorage) {
        const storedValue = localStorage.getItem(
          `${categoryKey}_ganttLocationID`
        );
        if (
          storedValue &&
          storedValue != "null" &&
          locations.some((setting) => setting.ID === storedValue)
        ) {
          setLocationID(storedValue);
        } else if (locations.length > 0) {
          setLocationID(locations[0].ID);
        }
      }
      setIsMobileView(window.innerWidth <= 767);
    }
  }, [shopSettings]);

  useEffect(() => {
    if (showShopButtons) {
      const s = shopSettings.find((shop) => shop.ID === shopID);
      const selectedShop = s ? s : shopSettings[0];
      setShop(selectedShop);
      console.log("Jobs: ", jobs); //Checking
      setGanttData(
        jobs.filter((job) => {
          console.log(job.shopID); // This will print the shopID for each job
          // return job.shopID === parseInt(shopID);
          return job.shopID === shopID;
        })
      );
      localStorage.setItem(`${categoryKey}_ganttShopID`, shopID);
    }
    if (showLocationButtons) {
      const newGanttData = jobs.filter((job) => {
        const shop = shopSettings.find(
          // (setting) => setting.ID === parseInt(job.shopID)
          (setting) => setting.ID === job.shopID
        );
        if (shop) {
          for (let l of locations) {
            if (l.shops.some((s) => s === shop.value) && l.ID == locationID) {
              return true;
            }
          }
        }
        return false;
      });
      setGanttData(newGanttData);
      localStorage.setItem(`${categoryKey}_ganttLocationID`, locationID);
    }
  }, [shopID, locationID, jobs, shopSettings]);

  const showPopup = (cell) => {
    setFormData(cell.data);
    setFormVisible(true);
    setFocusedRowKey(cell.data.ID);
  };

  const hidePopup = () => {
    setFormData({});
    setFormVisible(false);
  };

  const jobWallCell = (row) => {
    return (
      <div>
        <span>{row.data.jobName}</span>
        <br></br>
        <span style={{ color: "#5a87d1" }}>{row.data.wallType}</span>
      </div>
    );
  };

  const handleCellClick = (cell) => {
    if (dataGridRef.current?.instance && cell.column.headerFullDate) {
      setSelectedCell(cell);
      setCellFormData(cell.value);
      setCellFormVisible(true);
      setFocusedRowKey(cell.data.ID);
      setSelectedColumn(cell.column.dataField);
    }
  };

  const cellPrepared = (cell) => {
    if (canEdit) {
      cell.cellElement.addEventListener("click", (e) => handleCellClick(cell));
    }

    if (cell.value && cell.rowType === "data") {
      if (cell.value.cellColor && cell.column.headerFullDate) {
        cell.cellElement.style.backgroundColor = cell.value.cellColor;
      }
    }
    if (cell.rowType === "data") {
      if (
        cell.column.headerFullDate ===
        toMondayDate(cell.data.fieldStart).toLocaleDateString()
      ) {
        cell.cellElement.style.borderLeft = `solid ${FIELDSTART_COLOR} 5px`;
      }
      if (
        cell.column.headerFullDate ===
        toMondayDate(cell.data.shopStart).toLocaleDateString()
      ) {
        cell.cellElement.style.borderLeft = `solid ${SHOPSTART_COLOR} 5px`;
      }

      if (
        cell.data.booked &&
        cell.data.engineering &&
        (cell.column.dataField === "jobName" ||
          cell.column.dataField === "jobNumber")
      ) {
        cell.cellElement.style.backgroundColor = ENGINEERING_COLOR;
      }
      if (!cell.data.booked && cell.column.dataField === "jobNumber") {
        cell.cellElement.style.backgroundColor = BOOKED_COLOR;
      }
    }

    // Setting today's header color and styling
    const today = toMondayDate(new Date());
    if (cell.column.headerFullDate === today.toLocaleDateString()) {
      if (cell.rowType === "header") {
        cell.cellElement.style.backgroundColor = "#c2eafc";
      }
    }
  };

  const onExporting = (e) => {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("Main sheet");

    exportDataGrid({
      component: e.component,
      worksheet,
      autoFilterEnabled: true,
    }).then(() => {
      workbook.xlsx.writeBuffer().then((buffer) => {
        saveAs(
          new Blob([buffer], { type: "application/octet-stream" }),
          "DataGrid.xlsx"
        );
      });
    });
    e.cancel = true;
  };

  const addJobHandler = () => {
    const newJobData = {
      wallType: "Unitized CW Custom",
      emps: 12,
      booked: false,
      engineering: false,
      stickwall: false,
      reserved: false,
      unitsPerWeek: 0,
      units: 0,
      weeks: 0,
      weeksToGoBack: 0,
      JSON: {},
    };

    setFormData(newJobData);
    setFormVisible(true);
  };

  const onColorCodingRowInit = (row) => {
    row.data = {
      category: "shops",
      value: "",
      color: "white",
      // locationID: locations[0].ID,
      JSON: {},
    };
  };

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
      const confirmed = window.confirm("Are you sure you want to delete?");
      if (confirmed) {
        e.component.beginCustomLoading();
        await handleDelete(e.data, type);
        e.component.endCustomLoading();
      }
    } catch (error) {
      console.error(error);
      e.component.endCustomLoading();
    }
  };

  const calculateUnitTotals = (options) => {
    columns.map((col, i) => {
      if (options.name === `UnitSummary_${col.offset}`) {
        if (options.summaryProcess === "start") {
          options.totalValue = 0;
        } else if (options.summaryProcess === "calculate") {
          if (options.value[col.offset.toString()]?.planned) {
            options.totalValue += parseInt(
              options.value[col.offset.toString()].planned
            );
          } else if (options.value[col.offset.toString()]?.actual) {
            options.totalValue += options.value[col.offset.toString()].actual;
          }
        }
      }
    });
  };

  const handleRowUpdated = (cell) => {
    const newJobData = { ...cell.data, JSON: { ...cell.data.JSON } };

    for (const key in newJobData) {
      if (!isNaN(parseInt(key)) && typeof newJobData[key].actual === "number") {
        if (cellFormData.linkToFieldStart) {
          const fieldStartOffset = toWeeks(
            officialStartDate,
            cell.data.fieldStart
          );
          newJobData[key].fieldStartOffset = parseInt(key) - fieldStartOffset;
        } else if (cellFormData.linkToShopStart) {
          const shopStartOffset = toWeeks(
            officialStartDate,
            cell.data.shopStart
          );
          newJobData[key].shopStartOffset = parseInt(key) - shopStartOffset;
        }
      }
    }

    handleUpdate(newJobData, "job");
  };

  const handleDialogClose = () => {
    setSelectedCell({});
    setCellFormVisible(false);
  };

  const navigateToFocusedRow = (e) => {
    // if (e && e.component) {
    //     const pageIndex = e.component.pageIndex();
    //     if (selectedPageIndex != pageIndex) {
    //         setSelectedPageIndex(pageIndex)
    //         setFocusedRowKey(null)
    //         return;
    //     } else {
    //         e.component.navigateToRow(focusedRowKey)
    //     }
    // }
  };

  const handleDialogSave = () => {
    const newJobData = JSON.parse(JSON.stringify(selectedCell.data));
    const key = selectedCell.column.dataField;

    newJobData[key] = { ...cellFormData };

    if (cellFormData.linkToFieldStart) {
      const fieldStartOffset = toWeeks(
        officialStartDate,
        selectedCell.data.fieldStart
      );
      newJobData[key].fieldStartOffset = parseInt(key) - fieldStartOffset;
    } else if (cellFormData.linkToShopStart) {
      const shopStartOffset = toWeeks(
        officialStartDate,
        selectedCell.data.shopStart
      );
      newJobData[key].shopStartOffset = parseInt(key) - shopStartOffset;
    }

    newJobData.JSON[categoryKey][key] = newJobData[key];

    handleUpdate(newJobData, "job");
    setCellFormVisible(false);
  };

  const handleChange = (cell, key, value) => {
    console.log("Cell handleChange starting "); //Checking
    const newCellData = {
      ...cellFormData,
      [key]: value,
    };
    console.log("New Cell Data: ", newCellData); //Checking
    if (saveByShopStart && key === "linkToShopStart") {
      newCellData.linkToFieldStart = !newCellData.linkToShopStart;
    }
    if (saveByFieldStart && key === "linkToFieldStart") {
      newCellData.linkToShopStart = !newCellData.linkToFieldStart;
    }

    setCellFormData(newCellData);
    console.log("Cell handleChange ending"); //Checking
  };

  const handleOptionChanged = (e) => {
    if (e.fullName.includes("sortOrder")) {
      setSortField();
    } else if (e.name === "focusedRowKey") {
      setFocusedRowKey(e.value);
    } else if (e.name === "paging") {
      setFocusedRowKey(null);
    } else if (e.name === "searchPanel") {
      setSearchValue(e.value);
    }
  };

  const inputRef = useRef(null);

  return (
    <div>
      {canEdit && showShopButtons && (
        <Accordion style={{ marginBottom: "20px" }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            <Typography>Adjust Shop Settings</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <DataGrid
              ref={settingsDataGridRef}
              dataSource={shopSettings}
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

              <Column dataField="value" caption="Shop" alignment="center" />

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
          </AccordionDetails>
        </Accordion>
      )}
      {!formVisible && !cellFormVisible && (
        <div>
          <DataGrid
            dataSource={
              showShopButtons || showLocationButtons ? ganttData : jobs
            }
            ref={dataGridRef}
            keyExpr="ID"
            showRowLines
            showColumnLines={false}
            columnAutoWidth
            autoExpandAll
            highlightChanges={expanded}
            repaintChangesOnly
            wordWrapEnabled
            onCellPrepared={cellPrepared}
            onExporting={onExporting}
            height="70vh"
            onRowUpdated={handleRowUpdated}
            onOptionChanged={handleOptionChanged}
            focusedRowKey={focusedRowKey}
            focusedRowEnabled
            autoNavigateToFocusedRow
            // onContentReady={navigateToFocusedRow}
          >
            {/* <FilterRow visible={true} applyFilter="auto" /> */}
            <Scrolling columnRenderingMode="virtual" />
            <SearchPanel
              visible
              highlightCaseSensitive={false}
              defaultText={searchValue}
            />
            <Sorting mode="multiple" />
            <Export enabled={true} allowExportSelectedData={true} />
            <LoadPanel enabled showIndicator />
            <Editing mode="cell" allowEditing />

            <Toolbar>
              {showEditButtons && (
                <Item location="before">
                  <Grid container spacing={1}>
                    <Grid item>
                      <IconButton
                        color="primary"
                        variant="contained"
                        onClick={addJobHandler}
                      >
                        <AddIcon />
                        <Typography>Add Job</Typography>
                      </IconButton>
                    </Grid>
                  </Grid>
                </Item>
              )}
              <Item location="before" locateInMenu="never">
                {showShopButtons && (
                  <FormControl fullWidth>
                    <Select
                      labelId="demo-simple-select-label"
                      id="demo-simple-select"
                      value={shopID}
                      label="Shop"
                      variant="standard"
                      onChange={(e) => setShopID(e.target.value)}
                    >
                      {shopSettings.map((s) => {
                        return (
                          <MenuItem key={s.ID} value={s.ID}>
                            {s.value}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                )}

                {showLocationButtons && (
                  <FormControl fullWidth>
                    <Select
                      labelId="demo-simple-select-label"
                      id="demo-simple-select"
                      value={locationID}
                      label="Location"
                      variant="standard"
                      onChange={(e) => setLocationID(e.target.value)}
                    >
                      {locations.map((s) => {
                        return (
                          <MenuItem key={s.ID} value={s.ID}>
                            {s.value}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                )}
              </Item>

              <Item location="after" name="searchPanel" locateInMenu="auto" />
              <Item location="after" locateInMenu="auto">
                <Grid container direction="row" spacing={1}>
                  <Grid item>
                    <DateBox
                      label="Start"
                      defaultValue={startDate}
                      style={{ position: "relative", bottom: "5px" }}
                      onValueChanged={(e) =>
                        handleDateChange("startDate", e.value)
                      }
                    />
                  </Grid>
                  <Grid item>
                    <DateBox
                      label="End"
                      defaultValue={endDate}
                      min={startDate}
                      style={{ position: "relative", bottom: "5px" }}
                      onValueChanged={(e) =>
                        handleDateChange("endDate", e.value)
                      }
                    />
                  </Grid>
                </Grid>
              </Item>

              <Item name="exportButton" locateInMenu="always" />
              <Item location="after">
                <IconButton
                  color="primary"
                  aria-label="add"
                  onClick={(e) => setShowGanttSection(!showGanttSection)}
                >
                  {showGanttSection ? (
                    <VisibilityOffIcon />
                  ) : (
                    <VisibilityIcon />
                  )}
                </IconButton>
              </Item>
            </Toolbar>

            {showEditButtons && (
              <Column
                fixed
                fixedPosition="left"
                type="buttons"
                cellRender={(cell) => {
                  return (
                    cell.rowType == "data" && (
                      <div>
                        <IconButton
                          aria-label="edit"
                          onClick={(e) => showPopup(cell)}
                        >
                          <EditIcon
                            color="primary"
                            style={{ fontSize: "18px" }}
                          />
                        </IconButton>

                        <IconButton
                          aria-label="delete"
                          onClick={(e) => deleteHandler(cell, "job")}
                        >
                          <DeleteIcon
                            color="secondary"
                            style={{ fontSize: "18px" }}
                          />
                        </IconButton>
                      </div>
                    )
                  );
                }}
              ></Column>
            )}

            <Column
              fixed={!isMobileView}
              dataField="jobNumber"
              dataType="string"
              caption="Job Number"
              alignment="center"
              allowSorting
              calculateDisplayValue={(row) =>
                !row.booked ? "Book in 90 Days" : row.jobNumber
              }
              allowEditing={false}
              cellHintEnabled
              // hidingPriority={3}
            ></Column>

            <Column
              fixed
              dataField="jobName"
              caption="Job Name & Wall Type"
              minWidth={"10vw"}
              cellRender={jobWallCell}
              allowEditing={false}
              // filterOperations={filterOperations}
              // filterValue={(searchValue && searchValue[0] === column.dataField) ? searchValue[2] : null}
            />

            <Column
              fixed={!isMobileView}
              dataField="shopStart"
              caption="Shop Start Date"
              alignment="center"
              sortOrder={sortByShopStart && "asc"}
              allowSorting
              dataType="date"
              allowEditing={false}
              // hidingPriority={1}
            />
            <Column
              fixed={!isMobileView}
              dataField="fieldStart"
              caption="Field Start"
              dataType="date"
              alignment="center"
              sortOrder={sortByFieldStart && "asc"}
              allowEditing={false}
              // hidingPriority={0}
            />
            {customColumns &&
              customColumns.map((col, i) => {
                return (
                  <Column
                    fixed={!isMobileView}
                    key={col.dataField}
                    dataField={col.dataField}
                    caption={col.caption}
                    alignment={col.alignment}
                    dataType={col.dataType}
                    allowEditing={false}
                    calculateCellValue={(cell) =>
                      col.calculateCellValue && col.calculateCellValue(cell)
                    }
                    // hidingPriority={4}
                  />
                );
              })}

            {columnsX
              .filter((col, i) => showGanttSection)
              .map((col, i) => {
                return (
                  <Column caption={col.month} alignment="center" key={i}>
                    {col.innerColsX.map((innerCol, k) => {
                      return (
                        <Column
                          key={k}
                          dataField={innerCol.offset.toString()}
                          caption={new Date(innerCol.date).getDate()}
                          visible={true}
                          alignment="center"
                          dataType="number"
                          allowEditing={false}
                          headerFullDate={innerCol.date}
                          cellRender={(cell) => {
                            const cellData = cell.data[cell.column.dataField];
                            return (
                              cellData && (
                                <Grid container spacing={1} direction="column">
                                  <Grid
                                    item
                                    sx={{
                                      fontWeight: "bold",
                                      minHeight: "25px",
                                    }}
                                  >
                                    {cellData.planned != 0
                                      ? cellData.planned
                                      : ""}
                                  </Grid>
                                  <Grid
                                    item
                                    sx={{
                                      minHeight: "25px",
                                      color: `${
                                        categoryKey === "metal" &&
                                        cell.data.reserved
                                          ? "red"
                                          : "black"
                                      }`,
                                    }}
                                  >
                                    {cellData.actual != 0
                                      ? cellData.actual
                                      : ""}
                                  </Grid>
                                </Grid>
                              )
                            );
                          }}
                        />
                      );
                    })}
                  </Column>
                );
              })}

            <Summary
              calculateCustomSummary={calculateUnitTotals}
              recalculateWhileEditing
            >
              {customColumns.map(
                (col, i) =>
                  col.dataType === "number" && (
                    <TotalItem
                      key={i.toString()}
                      column={col.dataField}
                      summaryType="sum"
                      customizeText={(val) => val.value}
                    />
                  )
              )}

              {columns.map((col, i) => (
                <TotalItem
                  key={i.toString()}
                  name={`UnitSummary_${col.offset}`}
                  summaryType="custom"
                  displayFormat="{0}"
                  showInColumn={col.offset.toString()}
                />
              ))}
            </Summary>
          </DataGrid>
        </div>
      )}
      {showEditButtons && (
        <JobForm
          navigateToFocusedRow={navigateToFocusedRow}
          categoryKey={categoryKey}
          formVisible={formVisible}
          setFormVisible={setFormVisible}
          formData={formData}
          setFormData={setFormData}
          hidePopup={hidePopup}
          jobs={jobs}
          shopSettings={shopSettings}
          handleAdd={handleAdd}
          handleDelete={handleDelete}
          handleUpdate={handleUpdate}
        />
      )}

      <Dialog open={cellFormVisible} onClose={handleDialogClose}>
        <DialogContent>
          <Grid container spacing={1} direction="column">
            <Grid item>
              <Typography variant="h5">
                {selectedCell?.column && selectedCell.column.headerFullDate}
              </Typography>
            </Grid>
            {categoryKey === "packaging" && (
              <Grid item>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="linkToFieldStart"
                      checked={cellFormData && cellFormData.linkToFieldStart}
                      onChange={(e) => {
                        handleChange(
                          selectedCell,
                          "linkToFieldStart",
                          e.target.checked
                        );
                      }}
                    />
                  }
                  label="Link to Field Start?"
                />
              </Grid>
            )}
            {categoryKey === "packaging" && (
              <Grid item>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="linkToShopStart"
                      checked={cellFormData && cellFormData.linkToShopStart}
                      onChange={(e) => {
                        handleChange(
                          selectedCell,
                          "linkToShopStart",
                          e.target.checked
                        );
                      }}
                    />
                  }
                  label="Link to Shop Start?"
                />
              </Grid>
            )}
            {categoryKey === "metal" && (
              <Grid item>
                <TextField
                  inputRef={inputRef}
                  autoFocus
                  value={cellFormData.planned ? cellFormData.planned : ""}
                  onChange={(e) =>
                    handleChange(
                      selectedCell,
                      "planned",
                      parseInt(e.target.value)
                    )
                  }
                  type="number"
                  // min={0}
                  label="Actual Value"
                  InputProps={{ onFocus: (event) => event.target.select() }}
                />
              </Grid>
            )}
            <Grid item>
              <TextField
                inputRef={inputRef}
                autoFocus
                value={cellFormData.actual ? cellFormData.actual : ""}
                onChange={(e) =>
                  handleChange(selectedCell, "actual", parseInt(e.target.value))
                }
                type="number"
                // min={0}
                label="Value"
                InputProps={{ onFocus: (event) => event.target.select() }}
                onKeyUp={(e) => e.key === "Enter" && handleDialogSave()}
              />
            </Grid>
          </Grid>
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
    </div>
  );
}
