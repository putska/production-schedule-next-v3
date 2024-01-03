import React, { useState, useEffect } from "react";
import {
  loadData,
  getFirebaseData,
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

const categoryKey = "glass-and-gasket";
const jobsKey = "production-schedule";

export default function PurchasingPage(props: any) {
  const [canEdit, setCanEdit] = useState(props.canEdit);

  const [jobs, setJobs] = useState([]);
  const [shops, setShops] = useState([]);
  const [settings, setSettings] = useState([]);

  const [currCategoryData, setCurrCategoryData] = useState([]);
  const [defaultSortField, setDefaultSortField] = useState([4, "asc"]);

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
      dataField: "shopStart",
      sortOrder: "asc",
      visible: false,
    },
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
      dataField: "orderLinkToShop",
      caption: "Link To Shop Start?",
      dataType: "boolean",
      canEdit: false,
      visibleIndex: 2,
    },
    {
      dataField: "orderWeekOf",
      dataType: "date",
      caption: "Order Week Of",
      alignment: "center",
      minWidth: 160,
      canEdit: true,
      visibleIndex: 3,
      // cellRender: orderWeekRender,
      // editCellRender: orderWeekEdit,
    },
    {
      dataField: "glassRequired",
      dataType: "date",
      caption: "Glass Required",
      alignment: "center",
      canEdit: false,
      visibleIndex: 4,
      // cellRender: (row: any) => {
      //     let date = new Date(row.data.start.value);
      //     date.setDate(date.getDate() - 14);
      //     return date;
      // },
    },
    {
      dataField: "numberOfLites",
      caption: "# Of Lites",
      alignment: "center",
      dataType: "string",
      canEdit: true,
      visibleIndex: 5,
    },
    {
      dataField: "sqft",
      caption: "Square Footage",
      alignment: "center",
      dataType: "string",
      canEdit: true,
      visibleIndex: 6,
    },
    {
      dataField: "vendor",
      dataType: "string",
      caption: "Vendor",
      alignment: "center",
      canEdit: true,
      visibleIndex: 7,
    },
    {
      dataField: "lbs",
      dataType: "number",
      caption: "Lbs, K",
      alignment: "center",
      canEdit: true,
      visibleIndex: 8,
    },
    {
      dataField: "gasket",
      caption: "Gasket",
      alignment: "center",
      dataType: "string",
      canEdit: false,
      visibleIndex: 9,
    },
    {
      dataField: "coating",
      dataType: "string",
      caption: "Coating",
      alignment: "center",
      canEdit: true,
      visibleIndex: 10,
    },
    {
      dataField: "pgtTransferred",
      dataType: "boolean",
      caption: "PGT Transferred",
      alignment: "center",
      canEdit: false,
      visibleIndex: 11,
    },
    {
      dataField: "bookingPO",
      dataType: "string",
      caption: "Booking PO",
      alignment: "center",
      canEdit: true,
      visibleIndex: 12,
    },
    {
      dataField: "pgtComplete",
      dataType: "string",
      caption: "PGT Complete",
      alignment: "center",
      canEdit: true,
      visibleIndex: 13,
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

// export async function getStaticProps() {
//     // const loadedJobs = await loadData("/GetJobs");
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
//             loadedSettings
//         }
//     }
// }
