import React, { useState, useEffect, useRef } from "react";
import DataGrid, {
  Column,
  LoadPanel,
  SearchPanel,
  Editing,
  Toolbar,
  Item
} from "devextreme-react/data-grid";
import { DateBox } from "devextreme-react";
import {
  Grid,
  Box,
  Typography,
  Button,
  LinearProgress,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  TextField
} from '@mui/material';

import {
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

import {
  month,
  convertToDate,
  toOffset,
  toMondayDate,
  getMondays,
  loadData,

  convertDates,
  addDays,
  toWeeks,
  toDays,
  isDateInRange,

  getEmployeeName,
  getJobName,
  getJobColor,
  calculateForOffSetsNew
} from "@/lib/helper-functions";

// styles --- coloring
const PLANNED_DATE = "blue";
const ACTUAL_DATE = "#33ab9f";
const PROGRESS_DATE = "#00695f";

const COMPLETED_STATUS = "Done";

const officialStartDate = "1/1/2021"

const MyMetrics = (props) => {
  const { categoryKey, jobs, tasks, settings, aiMetrics, handleUpdate, canEdit } = props;

  const datagridRef = useRef(null);
  const [columns, setColumns] = useState([]);
  const [columnsX, setColumnsX] = useState([]);
  const [today, setToday] = useState(new Date());
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [width, setWidth] = useState(950);
  const [cellSize, setCellSize] = useState(20);
  const [showDetails, setShowDetails] = useState(true);
  const [jobTotalDuration, setJobTotalDuration] = useState(0);
  const [formData, setFormData] = useState({});
  const [formVisible, setFormVisible] = useState(false);
  const [selectedRow, setSelectedRow] = useState({})

  const [startDate, setStartDate] = useState(toMondayDate(new Date()));
  let newEndDate = toMondayDate(addDays(new Date(), 365));
  const [endDate, setEndDate] = useState(newEndDate);

  // useEffect(() => {
  //   const newDatagridWidth = window.innerWidth - 100;
  //   const newWidth = showDetails ? 800 : 300;
  //   setCellSize((newDatagridWidth - newWidth) / jobTotalDuration);
  // }, [window.innerWidth, showDetails, jobTotalDuration]);

  useEffect(() => {
    setWidth(showDetails ? 950 : 350)
  }, [showDetails])

  useEffect(() => {
    const jobsToInclude = tasks
      .filter(task => task.includeOnMetrics)
      .map(task => task.jobNumber)

    if (jobsToInclude.length > 0) {
      let counter = 0;
      const updatedJobs = jobs
        .filter((job) => jobsToInclude.indexOf(job.jobNumber) != -1)
        .map((job, i) => {
          const { progress, progressChange, start, end, totalDuration } = calculateProgress(job);
          counter++;

          return ({
            ID: job.ID,
            jobName: job.jobName,
            jobNumber: job.jobNumber,
            sheets: (job.JSON && job.JSON[categoryKey])
              ? job.JSON[categoryKey].sheets
              : 0,
            notes: (job.JSON && job.JSON[categoryKey])
              ? job.JSON[categoryKey].notes
              : "",

            start: new Date(start),
            end: new Date(end),
            plannedStart: job.plannedStart
              ? new Date(job.plannedStart)
              : new Date(job.startDate),
            plannedEnd: job.plannedEnd
              ? new Date(job.plannedEnd)
              : new Date(job.endDate),

            progress: progress,
            progressChange: progressChange,
            totalDuration: totalDuration
          });
        });

      let colStart = new Date(); // Set colStart to a default date
      let colEnd = new Date(); // Set colEnd to a default date

      if (updatedJobs.length > 0) {
        colStart = updatedJobs.reduce((prevStart, job) => {
          const earliestStart = new Date(Math.min(job.start, job.plannedStart));
          return earliestStart < prevStart ? earliestStart : prevStart;
        }, new Date());

        colEnd = updatedJobs.reduce((prevEnd, job) => {
          const latestEnd = new Date(Math.max(job.end, job.plannedEnd));
          return latestEnd > prevEnd ? latestEnd : prevEnd;
        }, new Date());
      }

      updatedJobs.sort((a, b) => {
        const startA = new Date(a.start).getTime();
        const startB = new Date(b.start).getTime();
        return startA - startB;
      })

      setSelectedJobs(updatedJobs);

      const totalDuration = toWeeks(colStart, colEnd);
      setJobTotalDuration(totalDuration);

      const {
        newCols,
        newColsX
      } = calculateForOffSetsNew(officialStartDate, startDate, endDate);

      setColumnsX(newColsX);
      setColumns(newCols);
    }

  }, [jobs, tasks, startDate, endDate])

  const calculateProgress = (job) => {
    let totalDuration = 0;
    let completedDuration = 0;
    let completedProgressDuration = 0;

    // filter shop drawings data so that it only holds tasks related to current job
    const filteredTasks = tasks.filter(task => task.includeOnMetrics && task.jobNumber === job.jobNumber);

    // Sort the tasks by the start date
    filteredTasks.sort((task1, task2) => new Date(task1.startDate).getTime() - new Date(task2.startDate).getTime());

    // go through each filtered task and add # days for task to completed duration
    filteredTasks.forEach(task => {
      let taskDuration = toDays(task.startDate, task.endDate);

      // add to totalDuration for each assigned task
      totalDuration += taskDuration;

      // add to completedDuration if completed
      if (task.status === COMPLETED_STATUS) {
        completedDuration += taskDuration;
      }

      // if a job task was completed in the previous week, 
      // meaning it's end date is in the previous week and it's status is completed, 
      // then add that number of days to completedProgressDuration
      const prevWeekMon = addDays(toMondayDate(today), -7);
      if (task.status === "Completed" && isDateInRange(new Date(task.endDate), prevWeekMon, toMondayDate(today))) {
        completedProgressDuration += taskDuration;
      }
    })

    // Check if the start date is before the current date
    const progress = totalDuration > 0
      ? (completedDuration / totalDuration)
      : 0;

    const progressChange = completedDuration > 0
      ? ((completedProgressDuration / completedDuration) * 100)
      : 0;

    const start = filteredTasks[0].startDate;
    const end = filteredTasks[filteredTasks.length - 1].endDate;

    return { progress: progress, progressChange: progressChange, start: start, end: end, totalDuration: totalDuration };
  }

  const rowPrepared = (row) => {
    let totalWeeks = toWeeks(row.data.start, row.data.end);
    let totalPlannedWeeks = toWeeks(row.data.plannedStart, row.data.plannedEnd);
    let totalProgressWeeks = totalWeeks * row.data.progress

    let offset = width + toWeeks(startDate, row.data.start) * cellSize;
    let plannedOffset = width + toWeeks(startDate, row.data.plannedStart) * cellSize;

    let showActual = true;
    let showPlanned = true;

    if (startDate.getTime() > row.data.start.getTime()) {
      offset = width;
      totalWeeks = toWeeks(startDate, row.data.end);
      totalProgressWeeks = Math.floor(totalWeeks * row.data.progress)
    }

    if (startDate.getTime() > row.data.plannedStart.getTime()) {
      plannedOffset = width;
      totalPlannedWeeks = toWeeks(startDate, row.data.plannedEnd);
    }

    if (startDate.getTime() > row.data.end.getTime() || endDate.getTime() < row.data.start.getTime()) {
      showActual = false;
    }
    if (startDate.getTime() > row.data.plannedEnd.getTime() || endDate.getTime() < row.data.plannedStart.getTime()) {
      showPlanned = false;
    }

    if (endDate.getTime() < row.data.end.getTime()) {
      totalWeeks = toWeeks(row.data.start, endDate);
    }
    if (endDate.getTime() < row.data.plannedEnd.getTime()) {
      totalPlannedWeeks = toWeeks(row.data.plannedStart, endDate);
    }

    const timelineWidth = Math.max(totalWeeks * cellSize, 0);
    const plannedTimelineWidth = Math.max(totalPlannedWeeks * cellSize, 0);
    const progressWidth = Math.max(row.data.progress * timelineWidth, 0);

    const days = toDays(row.data.start, row.data.end);
    const sheetsPerDay = row.data.sheets ? Math.ceil(row.data.sheets / days) : 0;

    return (
      <Grid container sx={{ position: "relative", width: `${width}px`, height: '50px', marginBottom: "20px" }}>
        <Grid item sx={{ width: "50px" }}>
          {canEdit &&
            <IconButton aria-label="edit" onClick={(e) => showPopup(row)}>
              <EditIcon color="primary" style={{ fontSize: "18px" }} />
            </IconButton>
          }

        </Grid>

        <Grid item style={{ width: "200px", color: getJobColor(row.data.jobNumber, settings) }}>{row.data.jobName}</Grid>

        {showDetails && <Grid item style={{ width: "100px" }}>{new Date(row.data.start).toLocaleDateString()}</Grid>}
        {showDetails && <Grid item style={{ width: "100px" }}>{new Date(row.data.end).toLocaleDateString()}</Grid>}
        {showDetails && <Grid item style={{ width: "100px" }}>{new Date(row.data.plannedStart).toLocaleDateString()}</Grid>}
        {showDetails && <Grid item style={{ width: "100px" }}>{new Date(row.data.plannedEnd).toLocaleDateString()}</Grid>}

        {showDetails && <Grid item style={{ width: "100px" }}>{row.data.sheets}</Grid>}
        {showDetails && <Grid item style={{ width: "100px" }}>{sheetsPerDay}</Grid>}

        <Grid item style={{ width: "100px", height: "50px", overflow: "auto", whiteSpace: "pre-wrap" }}>{row.data.notes}</Grid>

        {showActual &&
          <Grid item style={{
            position: "absolute",
            top: 0,
            left: `${offset}px`,
            width: `${timelineWidth}px`,
            height: "100%",
            overflow: "visible",
            backgroundColor: ACTUAL_DATE
          }}>
          </Grid>
        }


        {showActual &&
          <Grid item style={{
            position: "absolute",
            top: 0,
            left: `${offset}px`,
            width: `${progressWidth}px`,
            height: "100%",
            overflow: "visible",
            backgroundColor: PROGRESS_DATE
          }}>
          </Grid>
        }


        {showPlanned &&
          <Grid item style={{
            position: "absolute",
            top: 0,
            left: `${plannedOffset}px`,
            width: `${plannedTimelineWidth}px`,
            height: "10%",
            overflow: "visible",
            backgroundColor: PLANNED_DATE
          }}>
          </Grid>
        }


        {showActual &&
          <Grid item style={{
            position: "absolute",
            top: "10px",
            left: `${offset + timelineWidth + 10}px`,
            height: "100%",
            overflow: "visible",
            color: PROGRESS_DATE,
            fontWeight: "bolder"
          }}>
            {Math.ceil(row.data.progress * 100)}%
          </Grid>
        }


        {showActual &&
          <Grid item style={{
            position: "absolute",
            top: "30px",
            left: `${offset + timelineWidth + 10}px`,
            height: "100%",
            overflow: "visible",
            color: "red",
          }}>
            +{Math.ceil(row.data.progressChange * 100)}%
          </Grid>
        }

      </Grid>
    )
  }

  const showPopup = (cell) => {
    setFormData(cell.data)
    setFormVisible(true);
    setSelectedRow(cell)
  }

  const hidePopup = () => {
    setFormData({});
    setFormVisible(false);
  }

  const handleDateChange = (key, value) => {
    if (key === "startDate") {
      setStartDate(value);
    } else if (key === "endDate") {
      setEndDate(value);
    }
  }

  const handleDialogSave = () => {
    const job = jobs.find(job => job.ID === selectedRow.data.ID)

    if (job) {
      const newFormData = {
        ...job,
        sheets: formData.sheets,
        notes: formData.notes
      }
      handleUpdate(newFormData, "metrics");
    }

    setFormVisible(false);
  }

  const handleChange = (cell, key, value) => {
    const newCellData = {
      ...formData,
      [key]: value
    }

    setFormData(newCellData);
  }

  return (
    <div>
      {!formVisible &&
        <div>
          <DataGrid
            dataSource={selectedJobs}
            ref={datagridRef}
            showColumnLines={false}
            height={500}
            highlightChanges
            repaintChangesOnly
            wordWrapEnabled
            dataRowRender={rowPrepared}
            width="100%"
          >
            <SearchPanel visible highlightCaseSensitive={false} />
            <LoadPanel enabled showIndicator />

            <Toolbar>
              <Item location="before">
                <Button
                  variant="outlined"
                  onClick={e => {
                    setShowDetails(!showDetails);
                  }}
                >
                  {showDetails ? "Hide details" : "Show Details"}
                </Button>
              </Item>
              <Item location="after" locateInMenu="auto">
                <Grid container direction="row" spacing={1} >
                  <Grid item>
                    <DateBox
                      label="Start"
                      defaultValue={startDate}
                      style={{ position: "relative", bottom: "5px" }}
                      onValueChanged={e => handleDateChange("startDate", e.value)}
                    />
                  </Grid>
                  <Grid item>
                    <DateBox
                      label="End"
                      defaultValue={endDate}
                      min={startDate}
                      style={{ position: "relative", bottom: "5px" }}
                      onValueChanged={e => handleDateChange("endDate", e.value)}
                    />
                  </Grid>
                </Grid>
              </Item>
            </Toolbar>

            <Editing
              // mode="cell"
              allowUpdating
            />

            <Column
              type="buttons"
              width="50px"
            />

            <Column
              dataField="jobName"
              caption="Job Name"
              width="200px"
              // alignment='center'
              cellRender={cell => {
                const color = getJobColor(cell.data.jobNumber, settings);
                return (
                  <div
                    style={{ color: `${color}` }} >
                    {cell.value}
                  </div>
                )
              }}
            />

            <Column
              dataField="start"
              caption="Start Date"
              visible={showDetails}
              width="100px"
              // alignment='center'
              calculateDisplayValue={cell => cell.start && cell.start.toLocaleDateString()}
            />
            <Column
              dataField="end"
              caption="End Date"
              visible={showDetails}
              width="100px"
              // alignment='center'
              calculateDisplayValue={cell => cell.end && cell.end.toLocaleDateString()}
            />

            <Column
              dataField="plannedStart"
              caption="Planned Start Date"
              visible={showDetails}
              width="100px"
              // alignment='center'
              calculateDisplayValue={cell => cell.plannedStart && cell.plannedStart.toLocaleDateString()}
            />
            <Column
              dataField="plannedEnd"
              caption="Planned End Date"
              visible={showDetails}
              width="100px"
              // alignment='center'
              calculateDisplayValue={cell => cell.plannedEnd && cell.plannedEnd.toLocaleDateString()}
            />

            <Column
              dataField="sheets"
              caption="Sheets"
              visible={showDetails}
              width="100px"
              alignment='left'
            />

            <Column
              dataField="sheetsPerDay"
              caption="Sheets/Day"
              visible={showDetails}
              width="100px"
            />
            <Column
              dataField="notes"
              caption="Notes"
              width="100px"
            // alignment='center'
            />

            {columnsX.map((col, i) => {
              return (
                <Column caption={col.month} alignment='center' key={i}>
                  {col.innerColsX.map((innerCol, k) => (
                    <Column
                      key={k}
                      dataField={innerCol.offset.toString()}
                      caption={cellSize >= 150 ? new Date(innerCol.date).getDate() : ""}
                      width={`${cellSize}px`}
                      alignment='center'
                      dataType='number'
                      allowEditing={false}
                      headerFullDate={innerCol.date}
                    />
                  ))}
                </Column>
              );
            })}

          </DataGrid>

          <Grid container direction="column" spacing={1} sx={{ marginTop: "20px" }}>
            <Grid item>
              <span style={{ display: "flex", flexDirection: "row" }}>
                <div style={{ width: "20px", height: "20px", backgroundColor: ACTUAL_DATE, marginRight: "10px" }}></div>
                <div>Actual Dates</div>
              </span>
            </Grid>
            <Grid item>
              <span style={{ display: "flex", flexDirection: "row" }}>
                <div style={{ width: "20px", height: "20px", backgroundColor: PLANNED_DATE, marginRight: "10px" }}></div>
                <div>Planned Dates</div>
              </span>
            </Grid>
            <Grid item>
              <span style={{ display: "flex", flexDirection: "row" }}>
                <div style={{ width: "20px", height: "20px", backgroundColor: PROGRESS_DATE, marginRight: "10px" }}></div>
                <div>Progress</div>
              </span>
            </Grid>
            <Grid item>
              <span style={{ display: "flex", flexDirection: "row" }}>
                <div style={{ width: "20px", height: "20px", backgroundColor: "red", marginRight: "10px" }}></div>
                <div>Progress Change</div>
              </span>
            </Grid>
          </Grid>

          <Box
            sx={{
              padding: "1rem",
              backgroundColor: "#f7f7f7",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              margin: "auto",
              marginTop: "2rem",
            }}
          >
            <Typography variant="h5" sx={{ marginBottom: "1rem" }}>
              What ChatGPT has to say about our progress:
            </Typography>
            <Typography sx={{ whiteSpace: "pre-line" }}>{aiMetrics}</Typography>
          </Box>
        </div>
      }

      <Dialog open={formVisible} onClose={hidePopup}>
        <DialogContent>
          <Grid container spacing={1} direction="column">
            <Grid item>
              <Typography variant="h5"></Typography>
            </Grid>

            <Grid item>
              <TextField
                value={formData.sheets ? formData.sheets : null}
                onChange={(e) => handleChange(selectedRow, "sheets", parseInt(e.target.value))}
                type="number"
                min={0}
                label="Sheets"
                fullWidth
              />
            </Grid>
            <Grid item>
              <TextField
                value={formData.notes ? formData.notes : ""}
                onChange={(e) => handleChange(selectedRow, "notes", e.target.value)}
                type="string"
                label="Notes"
                fullWidth
                multiline
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={hidePopup} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDialogSave} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default MyMetrics;
