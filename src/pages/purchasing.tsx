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

const categoryKey = "purchasing";

export default function PurchasingPage(props: any) {
  const [canEdit, setCanEdit] = useState(props.canEdit);

  const [jobs, setJobs] = useState([]);
  const [shops, setShops] = useState([]);
  const [settings, setSettings] = useState([]);

  const [currCategoryData, setCurrCategoryData] = useState([]);
  const [defaultSortField, setDefaultSortField] = useState([2, "asc"]);

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
    let newCategoryData = createCategoryData(
      jobs,
      categoryKey,
      tabColumns,
      shops
    );
    setCurrCategoryData(newCategoryData);
  }, [jobs]);

  const jobWallCell = (row: any) => {
    return (
      <div style={{ textAlign: "left" }}>
        <span>{row.data.jobName.value}</span>
      </div>
    );
  };

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
      dataField: "jobNumber",
      dataType: "string",
      caption: "Job Number",
      visibleIndex: 0,
      alignment: "center",
      allowSorting: true,
      canEdit: false,
      allowFiltering: true,
    },
    {
      dataField: "jobName",
      caption: "Job Name & Wall Type",
      visibleIndex: 1,
      alignment: "left",
      canEdit: false,
      minWidth: 200,
      cellRender: jobWallCell,
      allowFiltering: true,
    },
    {
      dataField: "shopStart",
      caption: "Shop Start Date",
      dataType: "date",
      format: "dd/MM/yyyy",
      visibleIndex: 2,
      alignment: "center",
      canEdit: false,
    },
    {
      dataField: "fieldStart",
      caption: "Field Start",
      visibleIndex: 3,
      dataType: "date",
      canEdit: false,
      alignment: "center",
    },
    {
      dataField: "shop",
      caption: "Shop",
      visibleIndex: 4,
      alignment: "left",
      canEdit: false,
    },
    {
      visibleIndex: 5,
      dataField: "hiltiEmbeds",
      caption: "Hilti Embeds",
      dataType: "string",
      canEdit: true,
    },
    {
      visibleIndex: 6,
      dataField: "MAC",
      caption: "MAC",
      dataType: "string",
      canEdit: true,
    },
    {
      visibleIndex: 7,
      dataField: "metalBooking",
      caption: "Metal Booking",
      dataType: "string",
      canEdit: true,
    },
    {
      visibleIndex: 8,
      dataField: "glassBooking",
      caption: "Glass Booking",
      dataType: "string",
      canEdit: true,
    },
    {
      visibleIndex: 9,
      caption: "Production Line Sample Approval",
      columns: [
        {
          visibleIndex: 10,
          dataField: "western",
          caption: "Western",
          dataType: "string",
          canEdit: true,
        },
        {
          visibleIndex: 11,
          dataField: "certified",
          caption: "Certified",
          dataType: "string",
          canEdit: true,
        },
        {
          visibleIndex: 12,
          dataField: "composite",
          caption: "Composite",
          dataType: "string",
          canEdit: true,
        },
      ],
    },
    {
      visibleIndex: 13,
      caption: "Dow",
      columns: [
        {
          visibleIndex: 14,
          dataField: "review",
          caption: "Review",
          dataType: "string",
          canEdit: true,
        },
        {
          visibleIndex: 15,
          dataField: "glass",
          caption: "Glass",
          dataType: "string",
          canEdit: true,
        },
        {
          visibleIndex: 16,
          dataField: "metal",
          caption: "Metal",
          dataType: "string",
          canEdit: true,
        },
        {
          visibleIndex: 17,
          dataField: "panel",
          caption: "Panel",
          dataType: "string",
          alignment: "center",
          canEdit: true,
        },
        {
          visibleIndex: 18,
          dataField: "gasket",
          caption: "Gasket",
          dataType: "string",
          alignment: "center",
          canEdit: true,
        },
      ],
    },
    {
      visibleIndex: 19,
      dataField: "shopSealant",
      caption: "Shop Sealant",
      dataType: "string",
      canEdit: true,
    },
    {
      visibleIndex: 20,
      dataField: "boltTesting",
      caption: "Bolt Testing",
      dataType: "string",
      canEdit: true,
    },
    {
      visibleIndex: 21,
      caption: "Doors",
      columns: [
        {
          visibleIndex: 22,
          dataField: "orderHardware",
          caption: "Order Hardware",
          dataType: "string",
          canEdit: true,
        },
        {
          visibleIndex: 23,
          dataField: "doorPaint",
          caption: "Door Paint",
          dataType: "string",
          canEdit: true,
        },
        {
          visibleIndex: 24,
          dataField: "threeWeekUpdate",
          caption: "3 Week Update and PM/Shop Notification",
          dataType: "string",
          canEdit: true,
        },
      ],
    },
    {
      visibleIndex: 25,
      dataField: "fieldUseReport3Updates",
      caption:
        "Field Use Report 3 Updates (2 weeks prior to due date.  Due 8 weeks prior to field start date.)",
      dataType: "string",
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
      showSecondRow={true}
      handleUpdate={handleUpdate}
      handleAdd={handleAdd}
      handleDelete={handleDelete}
      canEdit={canEdit}
    />
  );
}

// export async function getStaticProps() {
//     // const loadedJobs = await loadData("/GetJobs");
//     // const settings = await loadData("/GetSettings");
//     // const loadedSettings = settings.filter((setting: any) => setting.category === categoryKey)

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
