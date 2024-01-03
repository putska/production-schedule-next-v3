import React, { useState, useEffect, use } from "react";
import { db } from "@/firebase"; // replace with your Firebase config file
import { useListVals } from "react-firebase-hooks/database";
import { ref } from "firebase/database";
//import { getIndexes } from "@/lib/helper-functions";
//import { useStore } from "@/store";
//import { firebaseJobsSync } from "./FirebaseJobsSync";
//import { firebaseSettingsSync } from "./FirebaseSettingsSync";

import Graph from "@/src/components/Views/PS_Graph";
import GanttView from "@/src/components/Views/GanttView";

import { Button, Tabs, Tab, Box } from "@mui/material";
import {
  toMondayDate,
  addDays,
  toWeeks,
  loadData,
  putData,
  postData,
  deleteData,
  convertDates,
  calculateForOffSetsNew,
  updateJSONWithData,
  addDataToJSON,
  addJSONData,
  deconstructJobData,
  getDataByCategory,
  getFirebaseData,
} from "@/lib/helper-functions";

const categoryKey = "production-schedule";
const jobsKey = "production-schedule";

const officialStartDate = "1/1/2022";

const customColumns = [
  {
    visibleIndex: 6,
    dataField: "units",
    caption: "Units",
    dataType: "number",
    alignment: "center",
    calculateCellValue: (cell: any) => cell.units,
  },
  {
    visibleIndex: 7,
    dataField: "actualUnits",
    caption: "Actual Units",
    dataType: "number",
    alignment: "center",
    calculateCellValue: (cell: any) => {
      let sum = 0;
      for (const key in cell) {
        if (!isNaN(parseInt(key)) && typeof cell[key].actual === "number") {
          sum += cell[key].actual;
        }
      }
      return sum;
    },
  },
  {
    visibleIndex: 8,
    dataField: "unitsPerWeek",
    caption: "Units/Week",
    dataType: "number",
    alignment: "center",
    calculateCellValue: (cell: any) => (cell.stickwall ? 0 : cell.unitsPerWeek),
  },
];

export default function ProductionSchedulePage(props: any) {
  const [tabs, setTabs] = useState([]);
  const [canEdit, setCanEdit] = useState(props.canEdit);

  const [jobs, setJobs] = useState([]);
  const [jobsData, setJobsData] = useState([]);
  const [settings, setSettings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [employeeNotes, setEmployeeNotes] = useState([]);

  const [cols, setCols] = useState([]);
  const [colsX, setColsX] = useState([]);
  const [startDate, setStartDate] = useState(toMondayDate(new Date()));

  let newEndDate = toMondayDate(addDays(new Date(), 365));
  const [endDate, setEndDate] = useState(newEndDate);

  const [selectedIndex, setSelectedIndex] = useState(0);

  // const { firebaseAddJob, firebaseUpdateJob, firebaseDeleteJob } =
  //   firebaseJobsSync();
  // // const {
  // //   fetchSettings,
  // //   firebaseAddSettings,
  // //   firebaseUpdateSettings,
  // //   firebaseDeleteSettings,
  // // } = firebaseSettingsSync();
  // const jobs2 = useStore((state) => state.jobs);
  // console.log("jobs2: ", jobs2);
  //   const settings = useStore((state) => state.settings);

  //   const loadedSettings = useStore((state) =>
  //     state.settings
  //       .filter((setting: any) => setting.category === "shops")
  //       .map((setting: any) => addJSONData(setting))
  //   );

  const jobsRef = ref(db, "GetJobs");
  // const settingsRef = ref(db, "GetSettings");
  // const tasksRef = ref(db, "GetTasks");
  // const employeeNotesRef = ref(db, "GetEmployeeNotes");

  const [loadedJobs2, loading, error] = useListVals(jobsRef);
  // const [snapshots, loadingsnap, errorsnap] = useList(jobsRef);
  // const [loadedSettings, loading2, error2] = useList(settingsRef);
  // const [loadedTasks, loading3, error3] = useListVals(tasksRef);
  // const [loadedEmployeeNotes, loading4, error4] = useListVals(employeeNotesRef);

  const getData = async () => {
    //let loadedJobs = await loadData("/GetJobs");
    let loadedJobs = await getFirebaseData("/GetJobs");
    console.log("loadedJobs: ", loadedJobs);
    let loadedSettings = await getFirebaseData("/GetSettings");
    loadedSettings = loadedSettings
      .filter((setting: any) => setting.category === "shops")
      .map((setting: any) => addJSONData(setting));
    let loadedTasks = await getFirebaseData("/GetTasks");
    loadedTasks = loadedTasks.map((task: any) => addJSONData(task));
    let loadedEmployeeNotes = await getFirebaseData("/GetEmployeeNotes");
    loadedEmployeeNotes = loadedEmployeeNotes.map((note: any) =>
      addJSONData(note)
    );
    setJobs(loadedJobs);
    setSettings(loadedSettings);
    setTasks(loadedTasks);
    setEmployeeNotes(loadedEmployeeNotes);
  };

  useEffect(() => {
    getData();
  }, [loadedJobs2]);

  useEffect(
    () => {
      getData();
      // if (settings.length === 0) {
      //   fetchSettings();
      // }
      // if (!loadingsnap && !errorsnap && snapshots) {
      //   const jobsList4 = snapshots.map((snapshot) => ({
      //     ...snapshot.val(),
      //     ID: snapshot.key,
      //   }));
      //   setJobs(jobsList4);
      // }
      // if (loadedJobs) {
      //   // setJobs(getIndexes(loadedJobs));
      //   // console.log("loadedJobs: ", loadedJobs);
      //   // const loadedJobs = snapshots.map((snapshot) => ({
      //   //   ...snapshot.val(),
      //   //   ID: snapshot.key,
      //   // }));
      //   // setJobs(loadedJobs);
      //   // console.log("loaded jobs: ", loadedJobs);
      // }
      // if (!loading2 && !error2 && loadedSettings) {
      //   console.log("loadedSettings: ", loadedSettings);
      //   const settingsList = loadedSettings.map((setting: any) => ({
      //     ...setting.val(),
      //     ID: setting.key,
      //   }));
      //   console.log("settingsList: ", settingsList);
      //   setSettings(
      //     settingsList
      //       .filter((setting: any) => setting.category === "shops")
      //       .map((setting: any) => addJSONData(setting))
      //   );
      //   console.log("setSettings: ", settings);
      // }
      // if (loadedTasks) {
      //   setTasks(loadedTasks.map((task: any) => addJSONData(task)));
      // }
      // if (loadedEmployeeNotes) {
      //   setEmployeeNotes(
      //     loadedEmployeeNotes.map((note: any) => addJSONData(note))
      //   );
      // }
    },
    [
      // snapshots,
      // loadingsnap,
      // errorsnap,
      // loadedSettings,
      // loading2,
      // error2,
      // loadedTasks,
      // loadedEmployeeNotes,
    ]
  );

  useEffect(() => {
    const newJobs = convertDates(deconstructJobData(jobs, categoryKey));

    const { newCols, newColsX } = calculateForOffSetsNew(
      officialStartDate,
      startDate,
      endDate
    );

    newJobs.forEach((job: any, index: any) => {
      const startOffset = toWeeks(officialStartDate, job.shopStart);
      const shopColor = settings.find((shop: any) => {
        return shop.ID === job.shopID;
      });

      newCols.forEach((innerCol: any) => {
        let isDate =
          parseInt(innerCol.offset) >= startOffset &&
          parseInt(innerCol.offset) < startOffset + job.weeks;

        let dataField = innerCol.offset;
        const cellData = job.JSON[categoryKey][dataField];

        let displayUnits: any = {
          cellColor: "",
          planned: 0,
          actual: cellData ? cellData.actual : 0,
        };

        if (isDate) {
          displayUnits.cellColor = shopColor ? shopColor.color : "#1976d2";

          const thisWeek = innerCol.offset - startOffset + 1;
          displayUnits.planned = job.unitsPerWeek;

          if (thisWeek == job.weeks) {
            const remainderUnits =
              job.unitsPerWeek > 0 ? job.units % job.unitsPerWeek : 0;
            displayUnits.planned =
              remainderUnits != 0 ? remainderUnits : job.unitsPerWeek;
          }
        }

        newJobs[index][dataField] = displayUnits;
      });
    });

    setCols(newCols);
    setColsX(newColsX);
    setJobsData(newJobs);
  }, [jobs, startDate, endDate, settings]);

  useEffect(() => {
    setTabs([
      {
        ID: 0,
        name: "Gantt",
        component: (
          <GanttView
            jobs={jobsData}
            shopSettings={settings}
            columns={cols}
            columnsX={colsX}
            startDate={startDate}
            endDate={endDate}
            handleDateChange={handleDateChange}
            categoryKey={categoryKey}
            customColumns={customColumns}
            showEditButtons={canEdit}
            sortByShop={false}
            defaultColor="#1976d2"
            showShopButtons={true}
            //showShopButtons={false}
            sortByShopStart={true}
            saveByFieldStart={false}
            saveByShopStart={false}
            handleUpdate={handleUpdate}
            handleAdd={handleAdd}
            handleDelete={handleDelete}
            canEdit={canEdit}
          />
        ),
      },
      {
        ID: 1,
        name: "Units Graph",
        component: <Graph jobs={jobsData} shops={settings} />,
      },
    ]);
  }, [jobsData, settings, cols, colsX, startDate, endDate]);

  const handleDateChange = (key: any, value: any) => {
    if (key === "startDate") {
      setStartDate(value);
    } else if (key === "endDate") {
      setEndDate(value);
    }
  };

  async function handleUpdate(data: any, endpoint: any) {
    switch (endpoint) {
      case "setting":
        try {
          const newData = addDataToJSON(data);
          //const resData = await putData("/UpdateSettings", newData);
          const resData = await putData("/GetSettings", newData);
          setSettings((prev: any) => {
            let items = prev.filter((item: any) => data.ID !== item.ID);
            return [...items, data];
          });
        } catch (error) {
          console.log(error);
        }
        break;
      case "job":
        try {
          const newData = updateJSONWithData(data, categoryKey);
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
      case "setting":
        try {
          const newData = addDataToJSON(data);
          // let resData = await postData("/AddSettings", newData);
          let resData = await postData("/GetSettings", newData);
          resData = addJSONData(resData);
          setSettings((prev: any) => {
            let items = prev.filter(
              (item: any) => resData.ID !== item.ID && item.ID
            );
            return [...items, resData];
          });
          // const newRef = push(settingsRef);
          // await update(newRef, newData);
        } catch (error) {
          console.log(error);
        }
        break;
      case "job":
        try {
          const newData = updateJSONWithData(data, categoryKey);
          let resData = await postData("/GetJobs", newData);
          // const newRef = push(jobsRef);
          // await update(newRef, newData);

          setJobs((prev: any) => {
            let items = prev.filter(
              (item: any) => resData.ID !== item.ID && item.ID
            );
            return [...items, resData];
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
      case "setting":
        try {
          const newData = addDataToJSON(data);
          //const resData = await deleteData("/DeleteSettings", newData);
          const resData = await deleteData("/GetSettings", newData);
          setSettings((prev: any) =>
            prev.filter((item: any) => item.ID !== newData.ID)
          );
        } catch (error) {
          console.log(error);
        }
        break;
      case "job":
        try {
          const newData = updateJSONWithData(data, categoryKey);
          //const resData = await deleteData("/DeleteJob", newData);
          const resData = await deleteData("/GetJobs", newData);

          const jobTasks = tasks.filter(
            (task: any) => task.jobNumber === data.jobNumber
          );
          jobTasks.forEach((task: any) =>
            deleteData("/GetTask", addDataToJSON(task))
          );

          const jobEmployeeNotes = employeeNotes.filter(
            (note: any) => note.jobNumber === data.jobNumber
          );
          jobEmployeeNotes.forEach((note: any) =>
            deleteData("/GetEmployeeNotes", addDataToJSON(note))
          );

          setJobs((prev: any) =>
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

  const TabMenu = () => (
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
        <Tab value={0} label="Gantt" />
        <Tab value={1} label="Graph" />
        <Button
          variant="text"
          color="secondary"
          href="http://wwweb/portal/desktopmodules/wwPMDashboard/PTSchedChart_extra.htm"
        >
          PT Tracker
        </Button>
      </Tabs>
    </Box>
  );

  return (
    <div style={{ alignItems: "center", justifyContent: "center" }}>
      <TabMenu />
      <div style={{ marginTop: "20px" }}>
        {" "}
        {tabs[selectedIndex] && tabs[selectedIndex].component}{" "}
      </div>
    </div>
  );
}

//  ***************************************************************************************************

// // export async function getStaticProps() {
// //     // const loadedJobs = await loadData("/GetJobs");
// //     // let loadedSettings = await loadData("/GetSettings");

// //     let loadedJobs = await loadData("/GetJobs");
// //     // loadedJobs = Object.entries(loadedJobs).map((item: any) => {
// //     //     return {
// //     //         ...item[1],
// //     //         ID: item[0],
// //     //     }
// //     // })

// //     let loadedSettings = await loadData("/GetSettings");
// //     // loadedSettings = Object.entries(loadedSettings).map((item: any) => {
// //     //     return {
// //     //         ...item[1],
// //     //         ID: item[0]
// //     //     }
// //     // })

// //     loadedSettings = loadedSettings
// //         .filter((setting: any) => setting.category === "shops")
// //         .map((setting: any) => addJSONData(setting))

// //     // const loadedJobs:any = []
// //     // const loadedSettings:any = []

// //     return {
// //         props: {
// //             loadedJobs,
// //             loadedSettings
// //         }
// //     }
// // }

// import { useState } from "react";
// import { db } from "@/firebase"; // replace with your Firebase config file
// import { useList } from "react-firebase-hooks/database";
// import { ref } from "firebase/database";

// export default function TestPage() {
//   const jobsRef = ref(db, "GetJobs");
//   const [value, loading, error] = useList(jobsRef);

//   return (
//     <div>
//       {error && <strong>Error: {error.message}</strong>}
//       {loading && <span>List: Loading...</span>}
//       <h1>Test Page</h1>
//       <h2>Jobs:</h2>
//       {value.map((v, index) => (
//         <div key={index}>
//           <p>{JSON.stringify(v.val())}</p>
//         </div>
//       ))}
//     </div>
//   );
// }
