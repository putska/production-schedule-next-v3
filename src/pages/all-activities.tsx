import React, { useState, useEffect, use } from "react";
import {
  getFirebaseData,
  putData,
  postData,
  deleteData,
  updateJSONWithData,
  addJSONData,
  addDataToJSON,
  deconstructJobData,
  createCategoryData,
  getFirebaseDataByCategory,
  getDataByCategory,
  convertDates,
} from "@/lib/helper-functions";
import loadAllActivitiesDates from "./api/activitiesAPI";

import CustomView from "@/src/components/Views/CustomView";
import { Button } from "@mui/material";

const categoryKey = "all-activities";
const fabDrawings_categoryKey = "fab-matrix";
const shopDrawings_categoryKey = "shop-drawings";
const jobsKey = "production-schedule";

export default function PanelMatrixPage(props: any) {
  const [canEdit, setCanEdit] = useState(props.canEdit);

  const [jobs, setJobs] = useState([]);
  const [shops, setShops] = useState([]);
  const [settings, setSettings] = useState([]);
  const [dates, setDates] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [fabMatrixs, setFabMatrixs] = useState([]);
  const [shopDrawings, setShopDrawings] = useState([]);

  const [currCategoryData, setCurrCategoryData] = useState([]);
  const [defaultSortField, setDefaultSortField] = useState([1, "asc"]);

  const getData = async () => {
    let loadedJobs = await getFirebaseData("/GetJobs");
    let loadedAllSettings = await getFirebaseData("/GetSettings");
    let loadedShops = loadedAllSettings
      .filter((setting: any) => setting.category === "shops")
      .map((setting: any) => addJSONData(setting));
    let loadedSettings = loadedAllSettings
      .filter((setting: any) => setting.category === categoryKey)
      .map((setting: any) => addJSONData(setting));

    let loadedTasks = await getFirebaseDataByCategory("/GetTasks", categoryKey);

    let loadedDates = await loadAllActivitiesDates();

    setJobs(loadedJobs);
    setShops(loadedShops);
    setSettings(loadedSettings);
    setTasks(loadedTasks);
    setDates(loadedDates);
  };

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    let newCategoryData = createCategoryData(
      jobs,
      categoryKey,
      tabColumns,
      shops
    );
    setShopDrawings(
      tasks.filter((task: any) => task.category === shopDrawings_categoryKey)
    );
    setFabMatrixs(
      tasks.filter((task: any) => task.category === fabDrawings_categoryKey)
    );

    setCurrCategoryData(newCategoryData);
  }, [jobs]);

  async function handleUpdate(data: any, endpoint: any) {
    switch (endpoint) {
      case "job":
        try {
          const newData = updateJSONWithData(data, categoryKey);
          const resData = await putData("/GetJobs", newData);
          setJobs((prev: any) => {
            let items = prev.filter((item: any) => newData.ID !== item.ID);
            return [...items, newData];
          });
        } catch (error) {
          console.log(error);
        }
        break;
      case "setting":
        try {
          const newData = addDataToJSON(data);
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
      case "setting":
        try {
          const newData = addDataToJSON(data);
          let resData = await postData("/GetSettings", newData);
          resData = addJSONData(resData);

          setSettings((prev: any) => {
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

  const renderDateCell = (rowData: any, type: any) => {
    const typeMapping: any = {
      metalTakeoff: "2",
      fieldStart: "9",
      shopStart: "8",
      doorSchedule: "10",
      glassTakeoff: "4",
      panelFabs: "4",
      shopUseBrakeShapesAndSteel: "3",
      fabDrawings: "7",
    };
    const dateMapping: any = {
      metalTakeoff: rowData.metalTakeoff,
      fieldStart: rowData.fieldStart,
      shopStart: rowData.shopStart,
      // doorSchedule: rowData.doorSchedule,
      // glassTakeoff: rowData.glassTakeoff,
      doorSchedule: (() => {
        const date = new Date(rowData.metalTakeoff.value);
        date.setDate(date.getDate() + 7);
        return { value: date };
      })(),
      glassTakeoff: (() => {
        const date = new Date(rowData.metalTakeoff.value);
        date.setDate(date.getDate() + 7);
        return { value: date };
      })(),

      panelFabs: rowData.panelFabs,
      // shopUseBrakeShapesAndSteel: rowData.shopUseBrakeShapesAndSteel,
      shopUseBrakeShapesAndSteel: (() => {
        const date = new Date(rowData.metalTakeoff.value);
        date.setDate(date.getDate() + 14);
        return { value: date };
      })(),
      fabDrawings: rowData.fabDrawings,
    };
    if (!dateMapping[type] && !dateMapping[type].value) {
      return null;
    }

    const value = dateMapping[type].value;
    console.log("dateMapping[type].value", dateMapping[type].value);
    console.log("type", type);

    let result = dates.find(
      (item: any) => item.Job_Number === rowData.jobNumber.value
    );
    let color = "#009E60";

    if (result && result[typeMapping[type]]) {
      let date = result[typeMapping[type]];

      let dateArr = date.split(" ");
      if (dateArr.length > 1) {
        date = dateArr[1];
        let date1 = new Date(date);
        date1.setHours(0, 0, 0, 0);
        let date2 = new Date(value);
        date2.setHours(0, 0, 0, 0);
        if (date1.getTime() === date2.getTime()) {
          date = null;
        } else if (date1 > date2) {
          color = "red";
        }
      } else {
        date = null;
      }

      return (
        <div>
          <div>{value && new Date(value).toLocaleDateString()}</div>
          <div style={{ color: color }}>{date}</div>
        </div>
      );
    } else {
      return <div>{value && new Date(value).toLocaleDateString()}</div>;
    }
  };

  const onChangeDateButtonClicked = () => {
    currCategoryData.forEach((job) => {
      const dateMapping: any = {
        metalTakeoff: job.metalTakeoff.value,
        fieldStart: job.fieldStart.value,
        shopStart: job.shopStart.value,
        doorSchedule: job.doorSchedule.value,
        glassTakeoff: job.glassTakeoff.value,
        panelFabs: job.panelFabs.value,
        shopUseBrakeShapesAndSteel: job.shopUseBrakeShapesAndSteel.value,
        fabDrawings: job.fabDrawings.value,
      };

      Object.keys(dateMapping).forEach((key) => {
        let date = dateMapping[key];
        if (date) {
          date = new Date(date).toJSON();

          // TO DO: Uncomment when done with project
          // axios
          //     .put(
          //         `http://wwweb/portal/DesktopModules/ww_Global/API/PTSchedule/PutBaseline?Job_Number=${job.jobNumber.value}&Activity=${key}&Date=${date}`
          //     )
          //     .catch((error) => console.log(error));
        }
      });
    });
  };

  const tabColumns = [
    {
      dataField: "jobNumber",
      dataType: "string",
      caption: "Job Number",
      alignment: "center",
      canEdit: false,
      visibleIndex: 0,
    },
    {
      dataField: "jobName",
      dataType: "string",
      caption: "Job Name",
      alignment: "left",
      minWidth: 200,
      canEdit: false,
      visibleIndex: 1,
    },
    {
      dataField: "PM",
      dataType: "string",
      caption: "PM",
      alignment: "center",
      minWidth: 200,
      canEdit: true,
      visibleIndex: 2,
    },
    {
      dataField: "superindentent",
      dataType: "string",
      caption: "Superintendent",
      alignment: "center",
      minWidth: 200,
      canEdit: true,
      visibleIndex: 3,
    },
    {
      dataField: "startShopDrawings",
      dataType: "date",
      caption: "Start Shop Drawings",
      alignment: "center",
      canEdit: false,
      visibleIndex: 4,
      cellRender: (row: any) => {
        let dates = shopDrawings
          .filter((task: any) => task.jobNumber === row.data.jobNumber.value)
          .sort((a: any, b: any) => {
            const startA = new Date(a.startDate).getTime();
            const startB = new Date(b.startDate).getTime();
            return startA - startB;
          });
        row.data.shopDrawings = {};
        row.data.shopDrawings.value =
          dates.length > 0 ? new Date(dates[0].startDate) : null;
        return row.data.shopDrawings.value
          ? row.data.shopDrawings.value.toLocaleDateString()
          : "";
      },
    },
    {
      dataField: "metalTakeoff",
      caption: "Start Metal and Misc Takeoff",
      alignment: "center",
      canEdit: false,
      visibleIndex: 5,
      cellRender: (e: any) => renderDateCell(e.data, "metalTakeoff"),
    },
    {
      dataField: "glassTakeoff",
      dataType: "date",
      caption: "Start Glass Takeoff",
      alignment: "center",
      canEdit: false,
      visibleIndex: 6,
      cellRender: (e: any) => renderDateCell(e.data, "glassTakeoff"),
    },
    {
      dataField: "doorSchedule",
      dataType: "date",
      caption: "Start Door Schedule",
      alignment: "center",
      canEdit: false,
      visibleIndex: 7,
      cellRender: (e: any) => renderDateCell(e.data, "doorSchedule"),
    },
    {
      dataField: "shopUseBrakeShapesAndSteel",
      dataType: "date",
      caption: "Start Shop Use Brake Shapes",
      alignment: "center",
      canEdit: false,
      visibleIndex: 8,
      cellRender: (e: any) =>
        renderDateCell(e.data, "shopUseBrakeShapesAndSteel"),
    },
    {
      dataField: "panelFabs",
      dataType: "date",
      caption: "Panel Fabs",
      alignment: "center",
      canEdit: false,
      visibleIndex: 9,
      cellRender: (e: any) => renderDateCell(e.data, "panelFabs"),
    },
    {
      dataField: "panelRelease",
      dataType: "date",
      caption: "Panel Release",
      alignment: "center",
      visibleIndex: 10,
      canEdit: false,
    },
    {
      dataField: "fabDrawings",
      dataType: "date",
      caption: "Fab Drawings",
      alignment: "center",
      canEdit: false,
      visibleIndex: 11,
      calculateCellValue: (row: any) => {
        let dates = fabMatrixs
          .filter((task: any) => task.jobNumber === row.jobNumber.value)
          .sort((a: any, b: any) => {
            const startA = new Date(a.startDate).getTime();
            const startB = new Date(b.startDate).getTime();
            return startA - startB;
          });
        row.fabDrawings = {};
        row.fabDrawings.value =
          dates.length > 0 ? new Date(dates[0].startDate) : null;
      },
      cellRender: (e: any) => renderDateCell(e.data, "fabDrawings"),
    },
    {
      dataField: "shopStart",
      dataType: "date",
      caption: "Shop Start",
      alignment: "center",
      canEdit: false,
      visibleIndex: 12,
      cellRender: (e: any) => renderDateCell(e.data, "shopStart"),
    },
    {
      dataField: "fieldStart",
      dataType: "date",
      caption: "Field Start",
      alignment: "center",
      canEdit: false,
      visibleIndex: 13,
      cellRender: (e: any) => renderDateCell(e.data, "fieldStart"),
    },
  ];
  return (
    <div>
      <Button
        variant="contained"
        style={{ marginBottom: "20px" }}
        onClick={onChangeDateButtonClicked}
      >
        Update Dates
      </Button>
      <CustomView
        jobs={jobs}
        data={currCategoryData}
        tabColumns={tabColumns}
        categoryKey={categoryKey}
        colorOptions={settings}
        defaultSortField={defaultSortField}
        handleUpdate={handleUpdate}
        handleAdd={handleAdd}
        handleDelete={handleDelete}
        canEdit={canEdit}
      />
    </div>
  );
}

// export async function getStaticProps() {
//     // const loadedJobs = await loadData("/GetJobs");
//     // const loadedTasks = await loadData("/GetTasks");
//     const dates = await loadAllActivitiesDates();

//     // let loadedSettings = await loadData("/GetSettings");
//     // loadedSettings = loadedSettings.filter((setting: any) => setting.category === categoryKey)

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

//     let loadedSettings = await loadData("/GetSettings");
//     if (loadedSettings) {
//         // loadedSettings = Object.entries(loadedSettings).map((item: any) => {
//         //     return {
//         //         ...item[1],
//         //         ID: item[0],
//         //     }
//         // })

//         loadedSettings = loadedSettings
//             .filter((setting: any) => setting.category === categoryKey || setting.category === "shops")
//             .map((setting: any) => addJSONData(setting))
//     }

//     return {
//         props: {
//             loadedJobs,
//             loadedTasks,
//             loadedSettings,
//             dates
//         }
//     }
// }
