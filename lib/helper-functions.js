import convert from "xml-js";
import axios from "axios";
import { db } from "@/firebase"; // replace with your Firebase config file
import { useList } from "react-firebase-hooks/database";
import { ref } from "firebase/database";

const baseURL = "http://wwweb/portal/desktopmodules/ww_Global/API/PSDev";
// const baseURL = "https://ww-production-schedule-2-default-rtdb.firebaseio.com";
const baseURL2 =
  "https://production-schedule-next-2-default-rtdb.firebaseio.com";
// axios.defaults.baseURL = http://wwweb/portal
// const bb =
//   "http://wwweb/portal/DesktopModules/ww_Global/API/PSDev/GetAllEmployees";

const month = [];
month[1] = "Jan";
month[2] = "Feb";
month[3] = "Mar";
month[4] = "Apr";
month[5] = "May";
month[6] = "Jun";
month[7] = "Jul";
month[8] = "Aug";
month[9] = "Sep";
month[10] = "Oct";
month[11] = "Nov";
month[12] = "Dec";

// API METHODS --- REMOVE .json LATER!!!
async function loadData(apiEndpoint) {
  try {
    //const res = await axios.get(baseURL + apiEndpoint);
    const res = await axios.get(baseURL2 + apiEndpoint + ".json");
    return res.data;
  } catch (error) {
    console.log(error);
  }
}

async function loadData2(apiEndpoint) {
  try {
    const res = await axios.get(baseURL + apiEndpoint);
    //const res = await axios.get(baseURL2 + apiEndpoint + ".json");
    return res.data;
  } catch (error) {
    console.log(error);
  }
}

async function putData(apiEndpoint, row) {
  try {
    // const res = await axios.put(baseURL + apiEndpoint, row);
    const res = await axios.put(
      baseURL2 + apiEndpoint + "/" + row.ID + ".json",
      row
    );
    // console.log("row: ", row);
    // console.log(res.data);
    // const revalidate_res = await fetch("/api/handler");
    return res.data;
  } catch (error) {
    console.log(error);
  }
}

async function postData(apiEndpoint, row) {
  try {
    const res = await axios.post(baseURL2 + apiEndpoint + ".json", row);
    //const res = await axios.post(baseURL + apiEndpoint, row);
    // const revalidate_res = await fetch("/api/handler");
    return { ...row, ID: res.data.name };
  } catch (error) {
    console.log(error);
  }
}

async function deleteData(apiEndpoint, row) {
  try {
    // const res = await axios.delete(baseURL + apiEndpoint + `?id=${row.ID}`, row);
    const res = await axios.delete(
      baseURL2 + apiEndpoint + "/" + row.ID + ".json",
      row
    );
    // const revalidate_res = await fetch("/api/handler");
    return res.data;
  } catch (error) {
    console.log(error);
  }
}

async function loadSettings() {
  const response = await axios
    .get
    // `http://wwweb/portal/DesktopModules/ww_Global/API/AppSettings/GetSettings?id=production_schedule`

    //"http://functions-ww-app.azurewebsites.net/api/function1?apiPath=AppSettings&functionPath=GetSettings&paramName=id&paramVal=production_schedule"
    ();
  let item = response.data;
  item.Data = JSON.parse(item.Data);

  return item;
}

// MISC HELPER FUNCTIONS

function lightOrDark(color) {
  // Check the format of the color, HEX or RGB?
  if (color.match(/^rgb/)) {
    // If HEX --> store the red, green, blue values in separate variables
    color = color.match(
      /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/
    );

    r = color[1];
    g = color[2];
    b = color[3];
  } else {
    // If RGB --> Convert it to HEX: http://gist.github.com/983661
    color = +("0x" + color.slice(1).replace(color.length < 5 && /./g, "$&$&"));

    r = color >> 16;
    g = (color >> 8) & 255;
    b = color & 255;
  }

  // HSP equation from http://alienryderflex.com/hsp.html
  hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));

  // Using the HSP value, determine whether the color is light or dark
  if (hsp > 127.5) {
    return "light";
  } else {
    return "dark";
  }
}

const getHighlight = (dtchanged) => {
  if (!dtchanged) {
    return false;
  }
  dtchanged = new Date(dtchanged);
  let today = new Date();
  let Difference_In_Time = today.getTime() - dtchanged.getTime();
  let Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);
  return Difference_In_Days < 13 ? true : false;
};

const toWeeks = (startDate, endDate) => {
  const oneDay = 24 * 60 * 60 * 1000; // Number of milliseconds in a day
  const start = toMondayDate(startDate);
  const end = toMondayDate(endDate);

  // Calculate the difference in days
  const diffInDays = Math.round(Math.abs((start - end) / oneDay));

  // Calculate the number of weeks
  const weeks = Math.floor(diffInDays / 7);

  return weeks;
};

const toDays = (startDate, endDate) => {
  const oneDay = 24 * 60 * 60 * 1000; // Number of milliseconds in a day

  // Convert the date strings to Date objects
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Calculate the difference in days
  const diffDays = Math.ceil(
    Math.abs((start.getTime() - end.getTime()) / oneDay)
  );

  return diffDays + 1;
};

const toMondayDate = (d) => {
  d = new Date(d);
  var day = d.getDay(),
    diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const mon = new Date(d.setDate(diff));
  return mon;
};

const addDays = (d, days) => {
  const date = new Date(d);
  date.setDate(date.getDate() + days);
  return date;
};

const createBasicRows = (start, calculatedWeeks) => {
  let rows = [];
  //moved back 6 weeks per steve
  let today = toMondayDate(start);

  for (let i = 0; i < calculatedWeeks; i++) {
    let date = addDays(today, i * 7).toLocaleDateString();
    let obj = { date: date };
    rows.push(obj);
  }
  return rows;
};

// const convertDates = (jobs) => {
//     let dateFields = [
//         "shopStart",
//         "fieldStart",
//         "metalTakeoff",
//         "orderWeekOf",
//         "panelFabs",
//         "panelRelease",
//         "glassTakeoff",
//         "shopUseBrakeShapesAndSteel",
//         "doorSchedule"
//     ];

//     let updatedJobs = JSON.parse(JSON.stringify(jobs));
//     updatedJobs.forEach((job) => {
//         dateFields.forEach((field) => {
//             job[field] = job[field] ? new Date(job[field]) : new Date();
//         });

//         if (!job.stickwall && job.unitsPerWeek > 0) {
//             job.weeks = Math.ceil(job.units / job.unitsPerWeek);
//         }

//         job.end = addDays(job.shopStart, job.weeks);
//     });

//     updatedJobs.sort(function (a, b) {
//         return a.shopStart.getTime() - b.shopStart.getTime();
//     });

//     updatedJobs.forEach((job) => {
//         job.offset = toWeeks(updatedJobs[0].shopStart, job.shopStart);
//     });

//     return updatedJobs;
// }

const calculateWeeks = (updatedJobs) => {
  if (updatedJobs.length > 0) {
    let calculatedWeeks = toWeeks(
      updatedJobs[0].shopStart,
      updatedJobs[updatedJobs.length - 1].shopStart
    );
    return calculatedWeeks;
  }
  return 52;
};

const createRows = (cols, dateRows, jobs, weeks, cellSettings) => {
  let newRows = JSON.parse(JSON.stringify(dateRows));
  let columns = cols.slice(0);

  jobs.forEach((job, jobIndex) => {
    columns.forEach((col) => {
      job[col.dataField] = addDays(job.metalTakeoff, col.offset * 7);
    });
  });

  for (let i = 0; i < weeks; i++) {
    jobs.forEach((job) => {
      columns.forEach((col) => {
        const jobDate = job[col.dataField];
        const dateKey = newRows[i].date;

        if (
          jobDate instanceof Date &&
          jobDate.toLocaleDateString() === dateKey
        ) {
          const cellData = cellSettings.find((row) => row.date === dateKey);

          newRows[i][col.dataField] = {
            value: job.jobName,
            status:
              cellData &&
              cellData[col.dataField] &&
              cellData[col.dataField].status
                ? cellData[col.dataField].status
                : "",
          };
        }
      });
    });
  }
  return newRows;
};

const convertToDate = (start, offset) => {
  const date = addDays(toMondayDate(start), offset * 7);
  return date.toLocaleDateString();
};

const toOffset = (jobs, date) => {
  return toWeeks(jobs[0].shopStart, date);
};

const getMondays = (d) => {
  let month = new Date(d).getMonth();
  let mondays = [];
  while (d.getMonth() === month) {
    mondays.push(new Date(d.getTime()));
    d.setDate(d.getDate() + 7);
  }
  return mondays;
};

const isDateInRange = (date, startDate, endDate) => {
  const dateValue = new Date(date).getTime();
  const startValue = new Date(startDate).getTime();
  const endValue = new Date(endDate).getTime();

  return dateValue >= startValue && dateValue <= endValue;
};

const calculateForOffSetsNew = (firstJobStart, startDate, endDate) => {
  startDate = toMondayDate(startDate);
  endDate = toMondayDate(endDate);

  const startOffset = firstJobStart
    ? toWeeks(toMondayDate(firstJobStart), startDate)
    : 0;
  const endOffset = firstJobStart
    ? toWeeks(toMondayDate(firstJobStart), endDate)
    : 52;

  let newCols = [];
  let newColsX = [];

  for (let i = startOffset; i <= endOffset; i++) {
    newCols.push({
      offset: i,
      date: convertToDate(startDate, i - startOffset),
    });
  }

  var i = startOffset;
  do {
    var d = convertToDate(startDate, i - startOffset);

    var mondays = getMondays(new Date(d));
    let innerColsX = [];
    var j = 0;
    do {
      innerColsX.push({
        offset: i,
        date: convertToDate(startDate, i - startOffset),
      });
      i++;
      j++;
    } while (j < mondays.length);
    let mnth =
      month[d.substring(0, d.indexOf("/"))] +
      " " +
      d.substring(d.length - 2, d.length);
    newColsX.push({
      month: mnth,
      innerColsX,
    });
  } while (i < endOffset);

  return { newCols: newCols, newColsX: newColsX };
};

// SHOP DRAWINGS METHODS
const getJobName = (jobNumber, jobs) => {
  const job = jobs.find((job) => job.jobNumber === jobNumber);
  return job ? job.jobName : "";
};

const getJob = (jobNumber, jobs) => {
  const job = jobs.find((job) => job.jobNumber === jobNumber);
  return job ? job : {};
};

const getEmployeeName = (ID, employees) => {
  const emp = employees.find((emp) => emp.ID === ID);
  return emp ? emp.name : "";
};

const getTask = (taskID, tasks) => {
  const task = tasks.find((task) => task.ID === taskID);
  return task ? task : {};
};

const getJobColor = (jobNumber, settings) => {
  const setting = settings.find((s) => s.jobNumber === jobNumber);
  return setting ? setting.color : "black";
};

const getEmployeeNamesFromIDs = (ids, employees) => {
  const namesArray =
    typeof ids === "object"
      ? ids.map((id) => {
          const name = getEmployeeName(id, employees) || "";
          return name;
        })
      : [];
  return namesArray.length > 0 ? namesArray.join(", ") : "";
};

const createShopDrawingDates = (shopDrawings, rows) => {
  let newDates = JSON.parse(JSON.stringify(rows));

  shopDrawings.forEach((assignedTask) => {
    let numWeeksForProject =
      assignedTask.startDate && assignedTask.endDate
        ? toWeeks(assignedTask.startDate, assignedTask.endDate)
        : 0;

    let taskDates = [];
    let start = toMondayDate(assignedTask.startDate);

    for (let i = 0; i <= numWeeksForProject; i++) {
      let date = addDays(start, i * 7);
      taskDates.push(date);
    }

    const newDatesStartIndex = newDates.findIndex(
      (date) => date.date === start.toLocaleDateString()
    );

    if (newDatesStartIndex != -1) {
      for (
        let i = newDatesStartIndex;
        i < newDatesStartIndex + numWeeksForProject;
        i++
      ) {
        Object.keys(assignedTask.assignedPeople).forEach((person) => {
          if (newDates[i].hasOwnProperty(person)) {
            newDates[i][person].push(assignedTask.jobName);
          } else {
            newDates[i][person] = [assignedTask.jobName];
          }
        });
      }
    }
  });

  return newDates;
};

const createCalendarData = (employees, tasks, employeeNotes, categoryKey) => {
  const calendarData = {};

  employees.forEach((emp) => {
    const foundTasks = tasks.filter((task) =>
      task.assignedPeople.includes(emp.ID)
    );
    calendarData[emp.name] = [];

    foundTasks.forEach((task) => {
      const taskStartDate = new Date(task.startDate);
      const taskEndDate = new Date(task.endDate);
      const taskDays = toDays(taskStartDate, taskEndDate);
      const date = new Date(taskStartDate);

      for (let i = 1; i <= taskDays; i++) {
        const dayOfWeek = date.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          let taskData = {
            taskID: task.ID,
            empID: emp.ID,
            date: new Date(date),
            jobNumber: task.jobNumber,
            notes: "",
            status: task.status,
            problems: "",
            category: categoryKey,
            workFromHome: false,
            vacation: false,
            firstTask: i == 1 || dayOfWeek === 1,
          };

          const hasTaskData =
            employeeNotes &&
            employeeNotes.find((note) => {
              if (note) {
                const exists =
                  new Date(note.date).toLocaleDateString() ===
                    date.toLocaleDateString() &&
                  note.jobNumber === task.jobNumber &&
                  note.empID === emp.ID &&
                  note.taskID === task.ID;
                return exists;
              }
            });

          // Employee has already written notes
          if (hasTaskData) {
            taskData = {
              ...taskData,
              ID: hasTaskData.ID,
              notes: hasTaskData.notes,
              problems: hasTaskData.problems,
              workFromHome: hasTaskData.workFromHome,
              vacation: hasTaskData.vacation,
            };
          }

          calendarData[emp.name].push(taskData);
        }
        date.setDate(date.getDate() + 1);
      }
    });
  });
  return calendarData;
};

async function getDates() {
  try {
    // const response = await fetch(
    //     "http://wwweb/portal/WSPTSchedule.asmx/GetChartByID"
    //     //"http://functions-ww-app.azurewebsites.net/api/function1?apiPath=PS&functionPath&GetChartByID"
    // );
    // // let results = convert.xml2json(response.data, {
    // //     compact: true,
    // //     spaces: 4,
    // // });
    // results = JSON.parse(results);
    // results = JSON.parse(results.string._text);

    // console.dir(results)

    // return results;

    const resDates = await fetch(
      "http://wwweb/portal/WSPTSchedule.asmx/GetChartByID"
    );
    let returnedDates = await resDates.text();

    let dates = convert.xml2json(returnedDates, {
      compact: true,
      spaces: 4,
    });
    dates = JSON.parse(dates);
    dates = JSON.parse(dates.string._text);
    return dates;
  } catch (error) {
    console.error(error);
  }
}

const getDataByCategory = async (endpoint, category) => {
  const data = await loadData(endpoint);
  const newData = data ? data.filter((item) => item.category === category) : [];
  return newData.map((row) => addJSONData(row));
};

const getFirebaseDataByCategory = async (apiEndpoint, category) => {
  let data = await loadData(apiEndpoint);
  data = Object.entries(data).map((item) => {
    return {
      ...item[1],
      ID: item[0],
    };
  });
  const newData = data ? data.filter((item) => item.category === category) : [];
  return newData.map((row) => addJSONData(row));
};

const getData = async (apiEndpoint, category) => {
  const loadedData = await loadData(apiEndpoint);
  const filteredData = loadedData.filter((item) => item.category === category);
  return filteredData;
};

const addJSONData = (data) => {
  if (Array.isArray(data)) {
    if (data.length > 0) {
      return data.map((row) => {
        const hasJSON = row.JSON;
        const JSONisString = typeof row.JSON === "string";

        let newJSON = hasJSON ? row.JSON : {};
        if (JSONisString) {
          newJSON = JSON.parse(row.JSON);
        }

        const newRow = {
          ID: row.ID,
          category: row.category ? row.category : null,
          JSON: newJSON,
        };

        if (newRow.JSON) {
          for (let key of Object.keys(newRow.JSON)) {
            newRow[key] = newRow.JSON[key];
          }
        }
        return newRow;
      });
    }
  } else if (data) {
    const hasJSON = data.JSON;
    const JSONisString = typeof data.JSON === "string";

    let newJSON = hasJSON ? data.JSON : {};
    if (JSONisString) {
      newJSON = JSON.parse(data.JSON);
    }

    const newRow = {
      ID: data.ID,
      category: data.category ? data.category : null,
      JSON: newJSON,
    };

    if (newRow.JSON) {
      for (let key of Object.keys(newRow.JSON)) {
        newRow[key] = newRow.JSON[key];
      }
    }

    return newRow;
  }

  return data;
};

const addDataToJSON = (row) => {
  const newRow = {
    ID: row.ID ? row.ID : null,
    category: row.category ? row.category : null,
    JSON: {
      ...row.JSON,
    },
  };

  for (const key in row) {
    if (!(key in newRow)) {
      newRow.JSON[key] = row[key];
    }
  }

  newRow.JSON = JSON.stringify(newRow.JSON);
  return newRow;
};

const deconstructJobData = (jobs, categoryKey) => {
  let jobsKey = "production-schedule";
  let newJobs = JSON.parse(JSON.stringify(jobs));
  newJobs = newJobs
    .filter((job) => job.JSON)
    .map((job) => {
      const newJobData = { ...job };

      // parse JSON to object
      newJobData.JSON =
        typeof job.JSON === "string" ? JSON.parse(job.JSON) : job.JSON;

      if (newJobData.JSON[categoryKey] == undefined) {
        newJobData.JSON[categoryKey] = {};
      }

      // get job values I want
      const keys = [
        "jobNumber",
        "jobName",
        "shopID",
        "locationID",
        "wallType",
        "shopStart",
        "fieldStart",
        "engineering",
        "doorSchedule",
        "glassTakeoff",
        "panelFabs",
        "panelRelease",
        "reserved",
        "booked",
        "stickwall",
        "weeks",
        "unitsPerWeek",
        "units",
        "weeksToGoBack",
        "metalTakeoff",
        "end",
        "emps",
        "offset",
        "startDate",
        "endDate",
      ];

      // add key data to job
      for (let key of keys) {
        if (newJobData.JSON[jobsKey]) {
          newJobData[key] = newJobData.JSON[jobsKey][key];
          if (
            [
              "weeks",
              "unitsPerWeek",
              "units",
              "weeksToGoBack",
              "emps",
              "offset",
              // "shopID",
              //"locationID",
            ].some((k) => k === key)
          ) {
            newJobData[key] = parseInt(newJobData.JSON[jobsKey][key]);
          }
        }
      }

      return newJobData;
    })
    .filter((job) => job.shopStart);

  return newJobs;
};

const updateJSONWithData = (row, categoryKey) => {
  const newRow = {
    ID: row.ID ? row.ID : null,
    category: row.category ? row.category : null,
    JSON: row.JSON ? JSON.parse(JSON.stringify(row.JSON)) : {},
  };

  newRow.JSON[categoryKey] =
    row.JSON && row.JSON[categoryKey] ? row.JSON[categoryKey] : {};

  for (const key in row) {
    if (!(key in newRow)) {
      newRow.JSON[categoryKey][key] = row[key];
    }
  }

  newRow.JSON = JSON.stringify(newRow.JSON);
  return newRow;
};

const getUnit = (value, col) => {
  const isNumber = col.dataType === "number";
  const isDate = col.dataType === "date";

  let value1 = value;
  if (isNumber) {
    value1 = parseInt(value);
  } else if (isDate) {
    const parsedDate = new Date(value);
    if (!isNaN(parsedDate)) {
      value1 = new Date(value).toLocaleDateString();
    }
  }
  return value ? value1 : "";
};

const getDisplayUnits = (job, col, categoryKey, shops) => {
  const categoryData =
    job.JSON[categoryKey] && job.JSON[categoryKey][col.dataField];
  const jobData = job && job[col.dataField];

  let displayUnits = { value: "", value2: "", status: "" };

  if (categoryData) {
    displayUnits.value = getUnit(categoryData.value, col);
    displayUnits.value2 = getUnit(categoryData.value2, col);
    displayUnits.status = categoryData.status;
  }

  if (col.dataField === "shop") {
    const foundShop = shops.find((shop) => shop.ID === job.shopID);
    displayUnits.value = foundShop ? foundShop.value : "";
  }

  if (jobData) {
    displayUnits.value = getUnit(jobData, col);
  }
  return displayUnits;
};

const convertDates = (jobs, categoryKey) => {
  let dateFields = [
    "shopStart",
    "fieldStart",
    "metalTakeoff",
    "orderWeekOf",
    "panelFabs",
    "panelRelease",
    "glassTakeoff",
    "shopUseBrakeShapesAndSteel",
    "doorSchedule",
    "end",
  ];

  let updatedJobs = JSON.parse(JSON.stringify(jobs));

  updatedJobs.forEach((job) => {
    for (let key of dateFields) {
      const cJob = job.JSON[categoryKey];
      if (job[key]) {
        try {
          let newDate = new Date(job[key]);
          if (newDate.toString() !== "Invalid Date") {
            job[key] = newDate;
          }
        } catch (error) {
          console.log("error parsing date");
        }
      }
      if (cJob && cJob[key]) {
        try {
          let newDate = new Date(cJob[key].value);
          if (newDate.toString() !== "Invalid Date") {
            job.JSON[categoryKey][key].value = newDate;
          }
        } catch (error) {
          console.log("error parsing date");
        }
      }
    }
  });

  // updatedJobs.sort((a, b) => {
  //   const startA = new Date(a.shopStart).getTime();
  //   const startB = new Date(b.shopStart).getTime();
  //   return startA - startB
  // })

  //  console.log(updatedJobs);
  return updatedJobs;
};

const createCategoryData = (jobs, categoryKey, tabColumns, shops) => {
  let newJobs = convertDates(deconstructJobData(jobs, categoryKey));
  const newCategoryData = newJobs.map((job) => {
    let newJobData = { ID: job.ID, shopID: job.shopID, JSON: { ...job.JSON } };
    tabColumns.forEach((col) => {
      if (col.columns) {
        col.columns.forEach((subCol) => {
          newJobData[subCol.dataField] = getDisplayUnits(
            job,
            subCol,
            categoryKey,
            shops
          );
        });
      } else {
        newJobData[col.dataField] = getDisplayUnits(
          job,
          col,
          categoryKey,
          shops
        );
      }
    });
    return newJobData;
  });
  return newCategoryData;
};

const sortByDateField = (dateField, jobs, value) => {
  const updatedJobs = JSON.parse(JSON.stringify(jobs));
  updatedJobs.sort((a, b) => {
    const startA = new Date(a[dateField].value).getTime();
    const startB = new Date(b[dateField].value).getTime();

    return value === "asc" ? startA - startB : startB - startA;
  });
  return updatedJobs;
};

async function getFirebaseData(apiEndpoint) {
  let loadedJobs = await loadData(apiEndpoint);
  // let loadedSettings = await loadData("/GetSettings");

  //let loadedJobs = await loadData("/GetJobs");
  loadedJobs = Object.entries(loadedJobs).map((item) => {
    return {
      ...item[1],
      ID: item[0],
    };
  });
  // let loadedSettings = await loadData("/GetSettings");
  // // loadedSettings = Object.entries(loadedSettings).map((item: any) => {
  // //     return {
  // //         ...item[1],
  // //         ID: item[0]
  // //     }
  // // })

  // loadedSettings = loadedSettings
  //     .filter((setting: any) => setting.category === "shops")
  //     .map((setting: any) => addJSONData(setting))

  // // const loadedJobs:any = []
  // // const loadedSettings:any = []

  return loadedJobs;
}

function getIndexes(apiEndpoint) {
  let loadedJobs = apiEndpoint;
  loadedJobs = Object.entries(loadedJobs).map((item) => {
    return {
      ...item[1],
      ID: item[0],
    };
  });
  return loadedJobs;
}

const panelFabsRender = (row) => {
  if (
    row.JSON["panel-matrix"] &&
    Object.keys(row.JSON["panel-matrix"]).length !== 0 &&
    row.JSON["panel-matrix"].panelFabs &&
    row.JSON["panel-matrix"].panelFabs.value
  ) {
    const panelFabs = row.JSON["panel-matrix"].panelFabs.value
      ? new Date(row.JSON["panel-matrix"].panelFabs.value).toLocaleDateString()
      : "";
    let link = row.JSON["panel-matrix"].linkToField.value;
    if (!link) {
      row.JSON["panel-matrix"].panelFabs.value = toWeeks(
        row.JSON["panel-matrix"].fieldStart.value,
        row.JSON["panel-matrix"].panelFabs.value2
      );
      row.JSON["panel-matrix"].jobNumber.value = row.jobNumber.value;
    }

    return (
      <div>
        {panelFabs}
        <br />
        <p style={{ color: "#3f50b5" }}>
          {row.JSON["panel-matrix"].panelFabs.value2} weeks before field start
        </p>
      </div>
    );
  }
};

// const panelFabsEdit = (row) => {
//   let link = row.JSON["panel-matrix"].linkToField.value;
//   return (
//     <div>
//       {link ? (
//         <input
//           placeholder="weeks before field start"
//           onChange={(e) => {
//             let date = addDays(
//               row.JSON["panel-matrix"].fieldStart.value,
//               e.target.value * 7
//             ).toLocaleDateString();
//             row.setValue(date.toString());

//             row.JSON["panel-matrix"].panelFabs.value2 = e.target.value;
//             //console.log(row.data.panelFabsOffset);
//           }}
//         />
//       ) : (
//         <input
//           type="text"
//           placeholder="MM/DD/YYYY"
//           onChange={(e) => {
//             if (
//               new Date(e.target.value) !== "Invalid Date" &&
//               !isNaN(new Date(e.target.value))
//             ) {
//               let d = new Date(e.target.value);
//               d.setTime(d.getTime() + d.getTimezoneOffset() * 60 * 1000);
//               row.setValue(d);
//             }
//           }}
//         />
//       )}
//     </div>
//   );
// };

const panelFabsEdit = (rowData) => {
  console.log("panelFabsEdit function called", rowData);
  // You can return a simple placeholder element for now
  return <span>Editing...</span>;
};

export {
  month,
  lightOrDark,
  getHighlight,
  toWeeks,
  toDays,
  toMondayDate,
  addDays,
  createBasicRows,
  convertDates,
  calculateWeeks,
  createRows,
  convertToDate,
  toOffset,
  getMondays,
  isDateInRange,
  getDates,
  calculateForOffSetsNew,
  loadData,
  loadData2,
  loadSettings,
  postData,
  putData,
  deleteData,
  createShopDrawingDates,
  createCalendarData,
  getIndexes,
  getJobName,
  getJob,
  getEmployeeName,
  getTask,
  getJobColor,
  getEmployeeNamesFromIDs,
  getDataByCategory,
  getFirebaseDataByCategory,
  getData,
  updateJSONWithData,
  addJSONData,
  addDataToJSON,
  deconstructJobData,
  sortByDateField,
  getDisplayUnits,
  createCategoryData,
  getFirebaseData,
  panelFabsRender,
  panelFabsEdit,

  // employees,
  // employeeNotes,
  // tasks,
  // settings
};
