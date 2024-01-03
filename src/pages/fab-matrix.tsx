import React, { useState, useEffect } from "react";
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
  getFirebaseData,
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
  addJSONData,
  deconstructJobData,
  getDataByCategory,
  getFirebaseDataByCategory,
} from "@/lib/helper-functions";
import DailyView from "@/src/components/Views/DailyView";
import WeeklyView from "@/src/components/Views/WeeklyView";
import TasksView from "@/src/components/Views/TasksView";

import { Tabs, Tab, Box } from "@mui/material";

// VERY IMPORTANTE
const categoryKey = "fab-matrix";
const jobsKey = "production-schedule";

const tasksViewCustomColumns: any = [];

const statusOptions = [
  { status: "In Queue", color: "gray" },
  { status: "Scheduled", color: "#e8b64a" },
  { status: "In Progress", color: "blue" },
  { status: "Parking Lot", color: "red" },
  { status: "Done", color: "green" },
  { status: "Archived", color: "black" },
];

const buttonOptions = [{ name: "Shop Drawings", value: "shop-drawings" }];

function FabMatrixPage(props: any) {
  const [canEdit, setCanEdit] = useState(props.canEdit);
  const [tabs, setTabs] = useState([]);

  const [selectedMonday, setSelectedMonday] = useState(new Date());
  const [week, setWeek] = useState([]);

  const [jobs, setJobs] = useState([]);
  const [employeeNames, setEmployeeNames] = useState([]);
  const [employeeNotes, setEmployeeNotes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [settings, setSettings] = useState([]);

  const [tasksData, setTasksData] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(2);

  const [weeks, setWeeks] = useState(0);
  const [dateRows, setDateRows] = useState([]);

  const getData = async () => {
    let loadedJobs = await getFirebaseData("/GetJobs");
    loadedJobs = convertDates(deconstructJobData(loadedJobs, jobsKey));

    let loadedTasks = await getFirebaseDataByCategory("/GetTasks", categoryKey);
    let loadedEmployeeNames = await getFirebaseDataByCategory(
      "/GetEmployeeNames",
      categoryKey
    );
    let loadedEmployeeNotes = await getFirebaseDataByCategory(
      "/GetEmployeeNotes",
      categoryKey
    );
    let loadedSettings = await getFirebaseDataByCategory(
      "/GetSettings",
      categoryKey
    );

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
      setSelectedIndex(storedValue ? parseInt(storedValue, 10) : 0); // Convert the value to the desired data type
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
        ? tasks
            .filter((task: any) => task.category === categoryKey)
            .map((task: any) => {
              const color = getJobColor(task.jobNumber, settings);
              const job = getJob(task.jobNumber, jobs);
              const highlightJob =
                getHighlight(job.weeksToGoBackUpdated) ||
                getHighlight(job.startUpdated);

              return {
                ...task,
                shopStart: job.start,
                color: color,
                highlightJob: highlightJob,
              };
            })
        : [];
    setTasksData(updatedTasksData);
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
          const resData = await deleteData("/getEmployeeNotes", newData);
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
            showPCs={true}
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
            linkToShopStart={true}
            statusOptions={statusOptions}
            buttonOptions={buttonOptions}
            showPCs={true}
            handleUpdate={handleUpdate}
            handleAdd={handleAdd}
            handleDelete={handleDelete}
            rows={dateRows}
            weeks={weeks}
            canEdit={canEdit}
          />
        ),
      },
    ]);
  }, [employeeNames, employeeNotes, settings, tasksData, selectedMonday, week]);

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
        </Tabs>
      </Box>
    );
  };

  return (
    <div style={{ alignItems: "center", justifyContent: "center" }}>
      <TabMenu />
      <div> {tabs[selectedIndex] && tabs[selectedIndex].component} </div>
    </div>
  );
}
// export const getStaticProps = async () => {

//     // const loadedJobs = await loadData("/GetJobs");
//     // const loadedTasks = await getDataByCategory("/GetTasks", categoryKey);
//     // const loadedEmployees = await getDataByCategory("/GetEmployeeNames", categoryKey);
//     // const loadedEmployeeNotes = await getDataByCategory("/GetEmployeeNotes", categoryKey);
//     // const loadedSettings = await getDataByCategory("/GetSettings", categoryKey);

//     let loadedJobs = await loadData("/GetJobs");
//     // if (loadedJobs) {
//     //     loadedJobs = Object.entries(loadedJobs).map((item: any) => {
//     //         return {
//     //             ...item[1],
//     //             ID: item[0],
//     //         }
//     //     })
//     // }

//     let loadedTasks = await loadData("/GetTasks");
//     if (loadedTasks) {
//         // loadedTasks = Object.entries(loadedTasks).map((item: any) => {
//         //     return {
//         //         ...item[1],
//         //         ID: item[0],
//         //     }
//         // })

//         loadedTasks = loadedTasks
//             .filter((task: any) => task.category === categoryKey)
//             .map((task: any) => addJSONData(task))
//     }

//     let loadedEmployees = await loadData("/GetEmployeeNames");
//     if (loadedEmployees) {
//         // loadedEmployees = Object.entries(loadedEmployees).map((item: any) => {
//         //     return {
//         //         ...item[1],
//         //         ID: item[0],
//         //     }
//         // })

//         loadedEmployees = loadedEmployees
//             .filter((emp: any) => emp.category === categoryKey)
//             .map((emp: any) => addJSONData(emp))

//     }

//     let loadedEmployeeNotes = await loadData("/GetEmployeeNotes");
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

//     const weeks = calculateWeeks(loadedJobs);
//     const dateRows = createBasicRows(new Date(), weeks);

//     return {
//         props: {
//             loadedJobs,

//             loadedTasks,
//             loadedEmployees,
//             loadedEmployeeNotes,
//             loadedSettings,

//             dateRows,
//             weeks
//         }
//     }
// }

export default FabMatrixPage;
