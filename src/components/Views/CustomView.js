import React, { useState, useEffect, useRef } from "react";
import DataGrid, {
  Column,
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
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import {
  Button as MaterialButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  Grid,
  FormControlLabel,
  IconButton,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
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
  getJob,
  updateDataWithJSON,
  parseJSON,
  updateJSONWithData,
  sortByDateField,
} from "@/lib/helper-functions";

import { Workbook } from "exceljs";
import { saveAs } from "file-saver";
import { exportDataGrid } from "devextreme/excel_exporter";

const filterOperations = [
  "contains",
  "notcontains",
  "startswith",
  "endswith",
  "=",
];

export default function CustomView(props) {
  const {
    data,
    tabColumns,
    defaultSortField,
    colorOptions,
    showSecondRow,
    categoryKey,
    handleUpdate,
    handleAdd,
    handleDelete,
    canEdit,
  } = props;

  const [customData, setCustomData] = useState([]);
  const [expanded, setExpanded] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedCell, setSelectedCell] = useState({});
  const [formData, setFormData] = useState({});
  const [searchValue, setSearchValue] = useState(null);
  const [sortField, setSortField] = useState(defaultSortField);
  const [focusedRowKey, setFocusedRowKey] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [focusedColumnIndex, setFocusedColumnIndex] = useState(null);
  const [customSecondRow, setCustomSecondRow] = useState(false);

  const settingsDataGridRef = useRef();

  useEffect(() => {
    let col = null;
    const visibleIndex = sortField[0];

    for (let column of tabColumns) {
      if (column.columns) {
        for (let subCol of column.columns) {
          if (subCol.visibleIndex === visibleIndex) {
            col = subCol;
          }
        }
      } else if (column.visibleIndex === visibleIndex) {
        col = column;
      }
    }

    if (col) {
      const value = sortField[1];
      const dataField = col.dataField;

      const sortedData = JSON.parse(JSON.stringify(data));

      if (col.dataType === "date") {
        sortedData.sort((a, b) => {
          const dateA = new Date(a[dataField].value);
          const dateB = new Date(b[dataField].value);
          return dateA - dateB;
        });
      } else {
        // For non-date columns, use a simple comparison
        sortedData.sort((a, b) => {
          const valueA = a[dataField].value;
          const valueB = b[dataField].value;

          if (valueA < valueB) {
            return value === "asc" ? -1 : 1;
          } else if (valueA > valueB) {
            return value === "asc" ? 1 : -1;
          } else {
            return 0;
          }
        });
      }
      setCustomData(sortedData);
    }
  }, [data, sortField, tabColumns]);

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

  //this function modified to handle both a regular cell and a cell with a weeksToGoBack function
  //weeks to go back allows you to modify the number of weeks before field start rather than just
  //directly modifying the date

  const handleCellClick = (cell) => {
    const column = tabColumns.find(
      (c) => c.dataField === cell.column.dataField
    );
    //check to see if we passed "weeksToGoBack" function into this column from tabColumns
    if (column && column.weeksToGoBack) {
      column.weeksToGoBack(cell.column.dataField, cell.data);
      //if there is data in the panel-matrix section of jobs, let's proceed.
      if (
        cell.data.JSON[categoryKey] &&
        Object.keys(cell.data.JSON[categoryKey]).length !== 0
      ) {
        let link = cell.data.JSON[categoryKey].linkToField.value;
        if (link) {
          const cellData = cell.data.JSON[categoryKey][cell.column.dataField];
          const newFormData = {
            value: cellData.value,
            status: cellData.status,
            value2: cellData.value2, //use value 2 to store the number of weeks to go back
          };
          setCustomSecondRow(true);
          setSelectedCell(cell);
          setFormData(newFormData);
          setDialogVisible(true);
          setFocusedRowKey(cell.data.ID);
          return;
        }
      }
    }
    const cellData = cell.data[cell.column.dataField];
    const newFormData = { value: cellData.value, status: cellData.status };
    if (showSecondRow) {
      newFormData.value2 = cellData.value2;
    }
    setCustomSecondRow(false);
    setSelectedCell(cell);
    setFormData(newFormData);
    setDialogVisible(true);
    setFocusedRowKey(cell.data.ID);
  };

  const handleDialogClose = () => {
    setFormData({});
    setDialogVisible(false);
  };

  //this function modified to handle both a regular cell and a cell with a weeksToGoBack function
  //we calculate the new date using the weeks stored in value2 and store that in value
  //we are keying off the customSecondRow state variable which gets set when weeksToGoBack is passed
  //into this customView

  const handleDialogSave = async () => {
    const jobData = data.find((job) => job.ID === selectedCell.data.ID);
    let date = null;
    if (customSecondRow) {
      date = addDays(
        selectedCell.data.JSON[categoryKey].fieldStart.value,
        0 - selectedCell.data.JSON[categoryKey].panelFabs.value2 * 7
      ).toLocaleDateString();
    }
    const newFormData = {
      ...jobData,
      ...selectedCell.data,
      category: categoryKey,
      [selectedCell.column.dataField]: {
        value: customSecondRow ? date.toString() : formData.value,
        value2: formData.value2,
        status: formData.status,
      },
    };
    await handleUpdate(newFormData, "job");

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
      if (canEdit) {
        cell.cellElement.addEventListener("click", () => handleCellClick(cell));
      }

      const bgColor = getColorFromStatus(cellData ? cellData?.status : "None");
      cell.cellElement.style.backgroundColor = bgColor;
      cell.cellElement.style.whiteSpace = "pre-wrap";
    }
    if (cell.column.headerColor) {
      cell.cellElement.style.backgroundColor = cell.column.headerColor;
      cell.cellElement.style.color = "white";
    }
  };

  const getColorFromStatus = (status) => {
    const foundStatusObject = colorOptions.find(
      (option) => option.value === status
    );
    return foundStatusObject ? foundStatusObject.color : "white";
  };

  const onColorCodingRowInit = (row) => {
    row.data = {
      value: "",
      color: "white",
      category: categoryKey,
    };
  };

  const renderCheckBox = (row) => {
    const value = row.value ? row.value : false;
    return <Checkbox checked={value} size="small" />;
  };

  const handleOptionChanged = (e) => {
    if (e.fullName.includes("sortOrder")) {
      // Handle sorting changes
      const parts = e.fullName.split(/\[|\]/);
      const columnIndex = parseInt(parts[1]);
      setSortField([columnIndex, e.value]);
    } else if (e.fullName === "paging.pageIndex") {
      setPageIndex(e.value);
      setFocusedRowKey(null);
    } else if (e.name === "searchPanel") {
      setSearchValue(e.value);
    }
  };

  const contentReady = (e) => {
    if (e && e.component) {
      e.component.navigateToRow(focusedRowKey);
      e.component.columnOption(sortField[0], "sortOrder", sortField[1]);
    }
  };

  return (
    <div>
      {canEdit && (
        <Accordion style={{ marginBottom: "20px" }}>
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
          </AccordionDetails>
        </Accordion>
      )}

      {!dialogVisible && (
        <DataGrid
          dataSource={customData}
          keyExpr="ID"
          showRowLines
          columnAutoWidth
          repaintChangesOnly
          wordWrapEnabled
          showColumnLines
          onCellPrepared={cellPrepared}
          onExporting={onExporting}
          height="75vh"
          cacheEnabled
          onOptionChanged={handleOptionChanged}
          onContentReady={contentReady}
        >
          {/* <GroupPanel visible /> */}
          {/* <FilterRow visible={true} applyFilter="auto" /> */}
          <SearchPanel
            visible
            highlightCaseSensitive={false}
            defaultText={searchValue}
          />
          <Grouping autoExpandAll={expanded} />
          <Sorting mode="single" />
          {/* <Scrolling mode="virtual" /> */}
          <Paging defaultPageIndex={pageIndex} />
          <Export enabled={true} allowExportSelectedData={true} />
          <LoadPanel enabled showIndicator />
          <Editing mode="cell" allowUpdating />

          <Toolbar>
            <Item name="searchPanel" />
          </Toolbar>

          {tabColumns.map((column, colIndex) => {
            if (column.dataType === "boolean") {
              column = {
                ...column,
                cellRender: (row) => renderCheckBox(row),
              };
            }

            return column.columns ? (
              <Column
                key={column.dataField}
                caption={column.caption}
                alignment="center"
              >
                {column.columns.map((subCol, subColIndex) => (
                  <Column
                    key={subCol.dataField}
                    {...subCol}
                    allowEditing={false}
                    alignment={subCol.alignment ? subCol.alignment : "center"}
                    // sortOrder={sortField.columnIndex === colIndex ? sortField.value : null}
                    calculateCellValue={(cell) => {
                      const cellData = cell[subCol.dataField];
                      return cellData ? cellData.value : "";
                    }}
                    calculateDisplayValue={(cell) => {
                      const cellData = cell[subCol.dataField];
                      if (cellData) {
                        const cellString = `
                                                        ${
                                                          cellData &&
                                                          cellData.value
                                                            ? cellData.value
                                                            : ""
                                                        }
                                                        ${
                                                          cellData &&
                                                          cellData.value2
                                                            ? cellData.value2
                                                            : ""
                                                        }
                                                    `;
                        return cellString;
                      }
                    }}
                  />
                ))}
              </Column>
            ) : (
              <Column
                key={column.dataField}
                {...column}
                allowEditing={false}
                alignment={column.alignment ? column.alignment : "center"}
                // sortOrder={sortField.columnIndex === colIndex ? sortField.value : null}
                calculateCellValue={(cell) => {
                  const cellData = cell[column.dataField];
                  return cellData ? cellData.value : "";
                }}
                calculateDisplayValue={(cell) => {
                  const cellData = cell[column.dataField];
                  if (cellData) {
                    const cellString1 = `${
                      cellData && cellData.value ? cellData.value : ""
                    }`;
                    const cellString2 = `${
                      cellData && cellData.value2 ? cellData.value2 : ""
                    }`;
                    return cellString1 + "\n" + cellString2;
                  }
                }}
              />
            );
          })}
        </DataGrid>
      )}

      <Dialog open={dialogVisible} onClose={handleDialogClose}>
        <DialogContent>
          <Typography variant="h5" sx={{ marginBottom: "10px" }}>
            {selectedCell && selectedCell?.data?.jobName.value}
          </Typography>
          {selectedCell?.column &&
            selectedCell.column.dataType === "string" &&
            selectedCell.column.canEdit && (
              <TextField
                value={formData.value ? formData.value : null}
                type={selectedCell.column ? selectedCell.column.dataType : ""}
                onChange={(e) => handleInputChange("value", e.target.value)}
                fullWidth
                label={selectedCell.column ? selectedCell.column.caption : ""}
                disabled={customSecondRow}
              />
            )}

          {selectedCell?.column &&
            selectedCell.column.dataType === "number" &&
            selectedCell.column.canEdit && (
              <TextField
                value={formData.value ? formData.value : null}
                type={selectedCell.column ? selectedCell.column.dataType : ""}
                onChange={(e) => handleInputChange("value", e.target.value)}
                fullWidth
                label={selectedCell.column ? selectedCell.column.caption : ""}
                disabled={customSecondRow}
              />
            )}

          {selectedCell?.column &&
            selectedCell.column.dataType === "date" &&
            selectedCell.column.canEdit && (
              <DateBox
                value={formData.value ? formData.value : null}
                type={selectedCell.column ? selectedCell.column.dataType : ""}
                onValueChanged={(e) => handleInputChange("value", e.value)}
                fullWidth
                style={{ padding: "10px" }}
                label={selectedCell.column ? selectedCell.column.caption : ""}
                disabled={customSecondRow}
              />
            )}

          {selectedCell?.column &&
            selectedCell.column.dataType === "boolean" &&
            selectedCell.column.canEdit && (
              <FormControlLabel
                control={
                  <Checkbox
                    value={formData.value ? formData.value : false}
                    onChange={(e) =>
                      handleInputChange("value", e.target.checked)
                    }
                    fullWidth
                  />
                }
                label={selectedCell.column ? selectedCell.column.caption : ""}
              />
            )}

          {selectedCell?.column &&
            selectedCell.column.canEdit &&
            (showSecondRow || customSecondRow) && (
              <TextField
                value={formData.value2 ? formData.value2 : null}
                onChange={(e) => handleInputChange("value2", e.target.value)}
                fullWidth
                style={{ marginTop: "10px" }}
                label={customSecondRow ? "Weeks to go back" : ""}
              />
            )}

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
    </div>
  );
}
