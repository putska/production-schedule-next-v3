import React, { useState, useEffect } from "react";
import { revalidatePath } from "next/cache";
import {
  GetStaticProps,
  GetStaticPaths,
  GetServerSideProps,
  NextPageContext,
} from "next";
import {
  createBasicRows,
  calculateWeeks,
  loadData,
  postData,
  putData,
  deleteData,
  toMondayDate,
  getTask,
  getJob,
  getJobColor,
  convertDates,
  getHighlight,
  addDataToJSON,
  updateJSONWithData,
  addJSONData,
  deconstructJobData,
  getDataByCategory,
  addDays,
  getFirebaseData,
  loadData2,
} from "@/lib/helper-functions";
import DailyView from "@/src/components/Views/DailyView";
import WeeklyView from "@/src/components/Views/WeeklyView";
import TasksView from "@/src/components/Views/TasksView";
import MyMetrics from "@/src/components/Views/MyMetrics";
import Loading from "@/src/components/Loading";
import { Tabs, Tab, Box, ButtonGroup } from "@mui/material";

// VERY IMPORTANTE
const categoryKey = "shop-drawings";
const jobsKey = "production-schedule";

const tasksViewCustomColumns = [
  {
    visibleIndex: 1,
    dataField: "includeOnMetrics",
    caption: "Metrics",
    dataType: "boolean",
    alignment: "center",
    width: 100,
  },
];

const statusOptions = [
  { status: "In Queue", color: "gray" },
  { status: "Scheduled", color: "#e8b64a" },
  { status: "In Progress", color: "blue" },
  { status: "Parking Lot", color: "red" },
  { status: "Done", color: "green" },
  { status: "Archived", color: "black" },
];

const buttonOptions = [
  { name: "Fab Matrix", value: "fab-matrix" },
  { name: "Glass and Gasket", value: "glass-and-gasket" },
];

function ShopDrawingsPage(props: any) {
  const [tabs, setTabs] = useState([]);
  const [canEdit, setCanEdit] = useState(props.canEdit);

  const [selectedMonday, setSelectedMonday] = useState(new Date());
  const [week, setWeek] = useState([]);

  const [jobs, setJobs] = useState([]);
  const [employeeNames, setEmployeeNames] = useState([]);
  const [employeeNotes, setEmployeeNotes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [settings, setSettings] = useState([]);

  const [tasksData, setTasksData] = useState([]);
  const [jobsData, setJobsData] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(2);

  const [weeks, setWeeks] = useState(0);
  const [dateRows, setDateRows] = useState([]);
  const [aiResult, setAiResult] = useState("");
  const [loaded, setLoaded] = useState(false);

  const getData = async () => {
    let loadedJobs = await getFirebaseData("/GetJobs");
    loadedJobs = convertDates(deconstructJobData(loadedJobs, categoryKey));

    let loadedTasks = await getFirebaseData("/GetTasks");
    loadedTasks = loadedTasks
      .filter((task: any) => task.category === categoryKey)
      .map((task: any) => addJSONData(task));
    let loadedEmployeeNames = await getFirebaseData("/GetEmployeeNames");
    loadedEmployeeNames = loadedEmployeeNames
      .filter((setting: any) => setting.category === categoryKey)
      .map((setting: any) => addJSONData(setting));
    let loadedEmployeeNotes = await getFirebaseData("/GetEmployeeNotes");
    loadedEmployeeNotes = loadedEmployeeNotes
      .filter((setting: any) => setting.category === categoryKey)
      .map((setting: any) => addJSONData(setting));
    let loadedSettings = await getFirebaseData("/GetSettings");
    loadedSettings = loadedSettings
      .filter((setting: any) => setting.category === categoryKey)
      .map((setting: any) => addJSONData(setting));

    // try {
    //     const res = await fetch(`http://localhost:3000/api/generate-answer`, {
    //         method: "POST",
    //         headers: {
    //             "Content-Type": "application/json",
    //         },
    //         body: JSON.stringify({
    //             prompt: loadedTasks
    //         }),
    //     });

    //     const GPTdata = await res.json();
    //     setAiResult(GPTdata.text);

    // } catch (error) { console.log(error) }

    // for the metrics tab planned dates baseline
    for (let job of loadedJobs) {
      try {
        const dates = await loadData2(
          `/GetShopDrawingDates?jobNum=${job.jobNumber}`
        );
        if (dates.length > 0) {
          job.startDate = dates[0].startDate ? dates[0].startDate : null;
          job.endDate = dates[0].endDate ? dates[0].endDate : null;
        }
      } catch (err) {
        console.log(err);
      }
    }

    const loadedWeeks = calculateWeeks(deconstructJobData(loadedJobs, jobsKey));
    const loadedDateRows = createBasicRows(new Date(), loadedWeeks);

    setJobs(loadedJobs);
    setTasks(loadedTasks);
    setEmployeeNames(loadedEmployeeNames);
    setEmployeeNotes(loadedEmployeeNotes);
    setSettings(loadedSettings);

    setWeeks(loadedWeeks);
    setDateRows(loadedDateRows);
  };

  useEffect(() => {
    getData();

    if (typeof window !== "undefined" && window.localStorage) {
      const storedValue = localStorage.getItem(`${categoryKey}_selectedIndex`);
      setSelectedIndex(storedValue ? parseInt(storedValue) : 0); // Convert the value to the desired data type
    }
    const today = new Date();
    updateWeek(today);
  }, []);

  useEffect(() => {
    localStorage.setItem(
      `${categoryKey}_selectedIndex`,
      selectedIndex.toString()
    );
  }, [selectedIndex]);

  useEffect(() => {
    const updatedTasksData =
      tasks.length > 0
        ? tasks.map((task: any) => {
            const color = getJobColor(task.jobNumber, settings);
            const job = getJob(task.jobNumber, jobs);
            const highlightJob =
              getHighlight(job.weeksToGoBackUpdated) ||
              getHighlight(job.startUpdated);

            return {
              ...task,
              color: color,
              highlightJob: highlightJob,
            };
          })
        : [];
    setTasksData(updatedTasksData);
    setLoaded(true);
  }, [jobs, employeeNames, employeeNotes, tasks, settings]);

  const updateWeek = (d: any) => {
    const mon = toMondayDate(d);
    const weekdays = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(mon);
      date.setDate(mon.getDate() + i);
      const dateString = date.toLocaleDateString();
      weekdays.push(dateString);
    }
    setSelectedMonday(mon);
    setWeek(weekdays);
  };

  async function handleUpdate(data: any, endpoint: any) {
    console.log("handleUpdate", data, endpoint);
    switch (endpoint) {
      case "employeeNotes":
        try {
          const taskData = getTask(data.taskID, tasks);
          const newTaskData = {
            ...taskData,
            startDate: data.startDate,
            endDate: data.endDate,
            status: data.status,
          };
          await handleUpdate(newTaskData, "tasks");
          const newData = addDataToJSON(data);
          const resData = await putData("/GetEmployeeNotes", newData);
          setEmployeeNotes((prev: any) => {
            let items = prev.filter((item: any) => data.ID !== item.ID);
            return [...items, data];
          });
        } catch (error) {
          console.log(error);
        }
        break;
      case "employeeNames":
        try {
          const newData = addDataToJSON(data);
          const resData = await putData("/GetEmployeeNames", newData);
          setEmployeeNames((prev: any) => {
            let items = prev.filter((item: any) => data.ID !== item.ID);
            return [...items, data];
          });
        } catch (error) {
          console.log(error);
        }
        break;
      case "tasks":
        try {
          console.log("Updating Task Data: ", data);
          const newData = addDataToJSON(data);
          const resData = await putData("/GetTasks", newData);
          setTasks((prev: any) => {
            let items = prev.filter((item: any) => data.ID !== item.ID);
            return [...items, data];
          });
        } catch (error) {
          console.log(error);
        }
        break;
      case "settings":
        try {
          let newData = addDataToJSON(data);
          const resData = await putData("/GetSettings", newData);
          setSettings((prev: any) => {
            let items = prev.filter((item: any) => data.ID !== item.ID);
            return [...items, data];
          });
        } catch (error) {
          console.log(error);
        }
        break;

      case "metrics":
        try {
          const newData = updateJSONWithData(data, categoryKey);
          console.log(newData);
          const resData = await putData("/GetJobs", newData);
          setJobs((prev: any) => {
            let items = prev.filter((item: any) => data.ID !== item.ID);
            return [...items, data];
          });
        } catch (error) {
          console.log(error);
        }
        break;
      default:
        break;
    }
  }

  async function handleAdd(data: any, endpoint: any) {
    switch (endpoint) {
      case "employeeNotes":
        try {
          const taskData = getTask(data.taskID, tasks);
          const newTaskData = {
            ...taskData,
            startDate: data.startDate,
            endDate: data.endDate,
            status: data.status,
          };
          await handleUpdate(newTaskData, "tasks");

          let newData = addDataToJSON(data);
          let resData = await postData("/GetEmployeeNotes", newData);
          const updatedResData = addJSONData(resData);

          setEmployeeNotes((prev: any) => {
            let items = prev.filter(
              (item: any) => item.ID && updatedResData.ID !== item.ID
            );
            return [...items, updatedResData];
          });
        } catch (error) {
          console.log(error);
        }
        break;
      case "employeeNames":
        try {
          let newData = addDataToJSON(data);
          let resData = await postData("/GetEmployeeNames", newData);
          const updatedResData = addJSONData(resData);

          setEmployeeNames((prev: any) => {
            let items = prev.filter(
              (item: any) => item.ID && updatedResData.ID !== item.ID
            );
            return [...items, updatedResData];
          });
        } catch (error) {
          console.log(error);
        }
        break;
      case "tasks":
        try {
          let newData = addDataToJSON(data);
          let resData = await postData("/GetTasks", newData);
          const updatedResData = addJSONData(resData);

          setTasks((prev: any) => {
            let items = prev.filter(
              (item: any) => item.ID && updatedResData.ID !== item.ID
            );
            return [...items, updatedResData];
          });
        } catch (error) {
          console.log(error);
        }
        break;
      case "settings":
        try {
          let newData = addDataToJSON(data);
          let resData = await postData("/GetSettings", newData);
          const updatedResData = addJSONData(resData);

          setSettings((prev: any) => {
            let items = prev.filter(
              (item: any) => item.ID && updatedResData.ID !== item.ID
            );
            return [...items, updatedResData];
          });
        } catch (error) {
          console.log(error);
        }
        break;
      default:
        break;
    }
  }

  async function handleDelete(data: any, endpoint: any) {
    switch (endpoint) {
      case "employeeNotes":
        try {
          const newData = addDataToJSON(data);
          const resData = await deleteData("/GetEmployeeNotes", newData);
          setEmployeeNotes((prev: any) =>
            prev.filter((item: any) => item.ID !== data.ID)
          );
        } catch (error) {
          console.log(error);
        }
        break;
      case "employeeNames":
        try {
          const newData = addDataToJSON(data);
          const resData = await deleteData("/GetEmployees", newData);
          const newEmployeeNames = employeeNames.filter(
            (item: any) => item.ID !== data.ID
          );
          for (let task of tasks) {
            if (task.assignedPeople.includes(data.ID.toString())) {
              // Split assignedPeople into an array of numbers
              const assignedPeopleArray = task.assignedPeople
                .split(",")
                .map((e: any) => parseInt(e, 0));

              // Filter out the data.ID from the array
              const filteredAssignedPeople = assignedPeopleArray.filter(
                (id: any) => id !== data.ID
              );

              // Join the array back into a string
              const assignedPeople = filteredAssignedPeople.join(", ");
              const newTask = { ...task, assignedPeople: assignedPeople };
              await handleUpdate(newTask, "tasks");
            }
          }

          for (let note of employeeNotes) {
            if (note.empID === data.ID.toString()) {
              await handleDelete(note, "employeeNotes");
            }
          }
          setEmployeeNames(newEmployeeNames);
        } catch (error) {
          console.log(error);
        }
        break;
      case "tasks":
        try {
          const newData = addDataToJSON(data);
          const resData = await deleteData("/GetTasks", newData);
          setTasks((prev: any) =>
            prev.filter((item: any) => item.ID !== newData.ID)
          );
        } catch (error) {
          console.log(error);
        }
        break;
      case "settings":
        try {
          const newData = addDataToJSON(data);
          const resData = await deleteData("/GetSettings", newData);
          setSettings((prev: any) =>
            prev.filter((item: any) => item.ID !== newData.ID)
          );
        } catch (error) {
          console.log(error);
        }
        break;
      default:
        break;
    }
  }

  useEffect(() => {
    setTabs([
      {
        ID: 0,
        name: "Daily View",
        component: (
          <DailyView
            categoryKey={categoryKey}
            jobs={jobs}
            employees={employeeNames}
            employeeNotes={employeeNotes}
            tasks={tasksData}
            settings={settings}
            selectedMonday={selectedMonday}
            week={week}
            updateWeek={updateWeek}
            statusOptions={statusOptions}
            showPCs={false}
            handleUpdate={handleUpdate}
            handleAdd={handleAdd}
            handleDelete={handleDelete}
            rows={dateRows}
            weeks={weeks}
            canEdit={canEdit}
          />
        ),
      },
      {
        ID: 1,
        name: "Weekly View",
        component: (
          <WeeklyView
            categoryKey={categoryKey}
            jobs={jobs}
            employees={employeeNames}
            employeeNotes={employeeNotes}
            tasks={tasksData}
            settings={settings}
            handleUpdate={handleUpdate}
            handleAdd={handleAdd}
            handleDelete={handleDelete}
            rows={dateRows}
            weeks={weeks}
            canEdit={canEdit}
          />
        ),
      },
      {
        ID: 2,
        name: "Tasks View",
        component: (
          <TasksView
            categoryKey={categoryKey}
            jobs={jobs}
            employees={employeeNames}
            employeeNotes={employeeNotes}
            tasks={tasksData}
            settings={settings}
            customColumns={tasksViewCustomColumns}
            linkToShopStart={false}
            handleUpdate={handleUpdate}
            handleAdd={handleAdd}
            handleDelete={handleDelete}
            statusOptions={statusOptions}
            buttonOptions={buttonOptions}
            showPCs={false}
            rows={dateRows}
            weeks={weeks}
            canEdit={canEdit}
          />
        ),
      },
      {
        ID: 3,
        name: "Metrics 2.0",
        component: (
          <MyMetrics
            categoryKey={categoryKey}
            jobs={jobs}
            tasks={tasksData}
            settings={settings}
            aiMetrics={aiResult}
            handleUpdate={handleUpdate}
            canEdit={canEdit}
          />
        ),
      },
    ]);
  }, [
    jobs,
    employeeNames,
    employeeNotes,
    settings,
    tasksData,
    selectedMonday,
    week,
  ]);

  const TabMenu = () => {
    return (
      <Box
        sx={{
          width: "100%",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Tabs
          value={selectedIndex}
          onChange={(e, value) => setSelectedIndex(value)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab value={0} label="Daily Plan" />
          <Tab value={1} label="Weekly Plan" />
          <Tab value={2} label="Tasks" />
          <Tab value={3} label="Metrics" />
        </Tabs>
      </Box>
    );
  };

  return (
    <div style={{ alignItems: "center", justifyContent: "center" }}>
      {loaded ? (
        <div>
          <TabMenu />
          <div> {tabs[selectedIndex] && tabs[selectedIndex].component} </div>
        </div>
      ) : (
        <Loading />
      )}
    </div>
  );
}
// export const getStaticProps = async () => {

// const loadedJobs = await loadData("/GetJobs");
// const loadedTasks = await getDataByCategory("/GetTasks", categoryKey);
// const loadedEmployees = await getDataByCategory("/GetEmployeeNames", categoryKey);
// const loadedEmployeeNotes = await getDataByCategory("/GetEmployeeNotes", categoryKey);
// const loadedSettings = await getDataByCategory("/GetSettings", categoryKey);

// let loadedJobs = await loadData("/GetJobs");
// let jobs_res = await fetch("https://ww-production-schedule-2-default-rtdb.firebaseio.com/GetJobs.json")
// let loadedJobs = await jobs_res.json()
// if (loadedJobs) {
//     loadedJobs = Object.entries(loadedJobs).map((item: any) => {
//         return {
//             ...item[1],
//             ID: item[0],
//         }
//     })
// }

// let loadedTasks = await loadData("/GetTasks");
// let tasks_res = await fetch("https://ww-production-schedule-2-default-rtdb.firebaseio.com/GetTasks.json")
// let loadedTasks = await tasks_res.json()
// if (loadedTasks) {
// loadedTasks = Object.entries(loadedTasks).map((item: any) => {
//     return {
//         ...item[1],
//         ID: item[0],
//     }
// })

//     loadedTasks = loadedTasks
//         .filter((task: any) => task.category === categoryKey)
//         .map((task: any) => addJSONData(task))
// }

// let loadedEmployees = await loadData("/GetEmployeeNames");
// let emps_res = await fetch("https://ww-production-schedule-2-default-rtdb.firebaseio.com/GetEmployeeNames.json")
// let loadedEmployees = await emps_res.json();
// if (loadedEmployees) {
// loadedEmployees = Object.entries(loadedEmployees).map((item: any) => {
//     return {
//         ...item[1],
//         ID: item[0],
//     }
// })

//         loadedEmployees = loadedEmployees
//             .filter((emp: any) => emp.category === categoryKey)
//             .map((emp: any) => addJSONData(emp))
//     }

//     let loadedEmployeeNotes = await loadData("/GetEmployeeNotes");
//     // let notes_res = await fetch("https://ww-production-schedule-2-default-rtdb.firebaseio.com/GetEmployeeNotes.json")
//     // let loadedEmployeeNotes = await notes_res.json()
//     if (loadedEmployeeNotes) {
//         // loadedEmployeeNotes = loadedEmployeeNotes && Object.entries(loadedEmployeeNotes).map((item: any) => {
//         //     return {
//         //         ...item[1],
//         //         ID: item[0],
//         //     }
//         // })

//         loadedEmployeeNotes = loadedEmployeeNotes
//             .filter((empNote: any) => empNote.category === categoryKey)
//             .map((empNote: any) => addJSONData(empNote))
//     }

//     let loadedSettings = await loadData("/GetSettings");
//     // let settings_res = await fetch("https://ww-production-schedule-2-default-rtdb.firebaseio.com/GetSettings.json")
//     // let loadedSettings = await settings_res.json();
//     if (loadedSettings) {
//         // loadedSettings = Object.entries(loadedSettings).map((item: any) => {
//         //     return {
//         //         ...item[1],
//         //         ID: item[0],
//         //     }
//         // })

//         loadedSettings = loadedSettings
//             .filter((setting: any) => setting.category === categoryKey)
//             .map((setting: any) => addJSONData(setting))
//     }

//     // for the metrics tab planned dates baseline
//     // for (let job of loadedJobs) {
//     //     if (job.JSON) {
//     //         try {
//     //             let jobNumber = JSON.parse(job.JSON)
//     //             jobNumber = jobNumber[jobsKey].jobNumber
//     //             const dates = await loadData(`/GetShopDrawingDates?jobNum=${jobNumber}`);
//     //             if (dates.length > 0) {
//     //                 job.startDate = dates[0].startDate ? dates[0].startDate : null
//     //                 job.endDate = dates[0].endDate ? dates[0].endDate : null
//     //             }
//     //         } catch (err) {
//     //             console.log(err)
//     //         }

//     //     }
//     // }

//     const weeks = calculateWeeks(loadedJobs);
//     const dateRows = createBasicRows(new Date(), weeks);

//     // for metrics ai statement
//     let aiResult = "";
//     // try {
//     //     const res = await fetch(`http://localhost:3000/api/generate-answer`, {
//     //         method: "POST",
//     //         headers: {
//     //             "Content-Type": "application/json",
//     //         },
//     //         body: JSON.stringify({
//     //             prompt: loadedTasks
//     //         }),
//     //     });

//     //     const GPTdata = await res.json();
//     //     aiResult = GPTdata.text;

//     // } catch (error) { console.log(error) }

//     return {
//         props: {
//             loadedJobs,

//             loadedTasks,
//             loadedEmployees,
//             loadedEmployeeNotes,
//             loadedSettings,

//             aiResult,

//             dateRows,
//             weeks
//         }
//     }
// }

export default ShopDrawingsPage;
