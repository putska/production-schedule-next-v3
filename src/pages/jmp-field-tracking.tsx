import React, { useState, useEffect } from "react";
import {
  loadData,
  getFirebaseData,
  getFirebaseDataByCategory,
  putData,
  postData,
  deleteData,
  updateJSONWithData,
  addJSONData,
  addDataToJSON,
  deconstructJobData,
  createCategoryData,
  convertDates,
} from "@/lib/helper-functions";

import CustomView from "@/src/components/Views/CustomView";

const categoryKey = "jmp-field-tracking";
const jobsKey = "production-schedule";

export default function JMPFieldTrackingPage(props: any) {
  const [canEdit, setCanEdit] = useState(props.canEdit);

  const [jobs, setJobs] = useState([]);
  const [shops, setShops] = useState([]);
  const [settings, setSettings] = useState([]);

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

    setJobs(loadedJobs);
    setShops(loadedShops);
    setSettings(loadedSettings);
  };

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    let newCategoryData = createCategoryData(jobs, categoryKey, tabColumns);
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

  const tabColumns = [
    {
      visibleIndex: 0,
      dataField: "jobName",
      minWidth: "300px",
      caption: "Job Name",
      alignment: "left",
      canEdit: true,
    },
    {
      visibleIndex: 1,
      dataField: "jobNumber",
      dataType: "string",
      caption: "Job Number",
      alignment: "center",
      allowSorting: true,
      canEdit: true,
    },
    {
      visibleIndex: 2,
      dataField: "pm",
      caption: "Project Manager",
      alignment: "center",
      datatype: "string",
      canEdit: true,
    },
    {
      visibleIndex: 3,
      dataField: "superintendent",
      caption: "Superintendent",
      alignment: "center",
      datatype: "string",
      canEdit: true,
    },
    {
      visibleIndex: 4,
      dataField: "templateAdded",
      caption: "Template Added",
      alignment: "center",
      datatype: "string",
      canEdit: true,
    },
    {
      visibleIndex: 5,
      dataField: "preliminaryJPS",
      caption: "Preliminary JPS",
      alignment: "center",
      datatype: "string",
      canEdit: true,
    },
    {
      visibleIndex: 6,
      dataField: "jobBookedReview",
      caption:
        "Job Booked review prelim JMP add field dates - Read the waterfall to determine what jobs. Update the field start date - Sen",
      alignment: "center",
      datatype: "string",
      canEdit: true,
    },
    {
      visibleIndex: 7,
      dataField: "prelimSent",
      caption: "Preliminary JMP Sent to Watts",
      alignment: "center",
      datatype: "string",
      canEdit: true,
    },
    {
      visibleIndex: 8,
      dataField: "safetyHandOff",
      caption: "Safety hand off - link to pallet schedule",
      alignment: "center",
      datatype: "string",
      canEdit: true,
    },
    {
      visibleIndex: 9,
      dataField: "fieldMonitorMeetingDate",
      caption:
        "Field Monitor Meeting Date - Fill out JPS 2nd half of monitor meeting",
      alignment: "center",
      datatype: "date",
      canEdit: true,
    },
    {
      visibleIndex: 10,
      dataField: "warRoom",
      caption: "War Room - 1 wk after field monitor meeting",
      alignment: "center",
      datatype: "boolean",
      canEdit: true,
    },
    {
      visibleIndex: 11,
      dataField: "fieldStart",
      dataType: "date",
      caption: "Field Start",
      alignment: "center",
      sortOrder: "asc",
      allowSorting: true,
      canEdit: true,
    },
    {
      visibleIndex: 12,
      dataField: "linkUnitInstallStart",
      caption: "Weekly boots on the ground - link Unit install start",
      alignment: "center",
      datatype: "string",
      canEdit: true,
    },
    {
      visibleIndex: 13,
      dataField: "afterActionWeekly",
      caption: "After Action - weekly",
      alignment: "center",
      datatype: "string",
      canEdit: true,
    },
    {
      visibleIndex: 14,
      dataField: "toGoList",
      caption: "ToGo List",
      alignment: "center",
      datatype: "string",
      canEdit: true,
    },
    {
      visibleIndex: 15,
      dataField: "wolfpackJobs",
      caption: "Wolf Pack Jobs",
      alignment: "center",
      datatype: "string",
      minWidth: 300,
      canEdit: true,
      lookup: {
        dataSource: [
          "No",
          "Yes",
          "Need to Discuss with Superintendent",
          "Have Notes",
        ],
      },
    },
    {
      visibleIndex: 16,
      dataField: "comments",
      caption: "Comments",
      alignment: "center",
      datatype: "string",
      canEdit: true,
    },
  ];

  return (
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
  );
}

// export const getStaticProps = async() =>  {
//     // const loadedJobs = await loadData("/GetJobs");
//     // let loadedSettings = await loadData("/GetSettings");
//     // loadedSettings = loadedSettings.filter((setting: any) => setting.category === categoryKey)

//     // let loadedJobs = await loadData("/GetJobs");

//     let loadedJobs =  await loadData("/GetJobs")
//     // if (loadedJobs) {
//     //     loadedJobs = Object.entries(loadedJobs).map((item: any) => {
//     //         return {
//     //             ...item[1],
//     //             ID: item[0],
//     //         }
//     //     })
//     // }

//     let loadedSettings = await loadData("/GetSettings")
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

//     // let loadedJobs:any = []
//     // let loadedSettings:any = []

//     return {
//         props: {
//             loadedJobs,
//             loadedSettings
//         },
//     }
// }
