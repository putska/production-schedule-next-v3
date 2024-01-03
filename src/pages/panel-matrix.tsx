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
  convertDates,
  getDisplayUnits,
  createCategoryData,
  panelFabsRender,
  panelFabsEdit,
} from "@/lib/helper-functions";

import CustomView from "@/src/components/Views/CustomView";

const categoryKey = "panel-matrix";
const jobsKey = "production-schedule";

export default function PanelMatrixPage(props: any) {
  const [canEdit, setCanEdit] = useState(props.canEdit);

  const [jobs, setJobs] = useState([]);
  const [shops, setShops] = useState([]);
  const [settings, setSettings] = useState([]);

  const [currCategoryData, setCurrCategoryData] = useState([]);
  const [defaultSortField, setDefaultSortField] = useState([3, "asc"]);

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

  async function handleUpdate(data: any, endpoint: any) {
    switch (endpoint) {
      case "job":
        try {
          console.log("data", data);
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
      dataField: "linkToField",
      caption: "Link to Field Start",
      dataType: "boolean",
      canEdit: true,
      visibleIndex: 0,
    },
    {
      dataField: "jobNumber",
      dataType: "string",
      caption: "Job Number",
      alignment: "center",
      canEdit: false,
      visibleIndex: 1,
    },
    {
      dataField: "jobName",
      dataType: "string",
      caption: "Job Name",
      alignment: "left",
      minWidth: 200,
      canEdit: false,
      visibleIndex: 2,
    },
    {
      dataField: "shopStart",
      dataType: "date",
      caption: "Shop Start",
      alignment: "center",
      canEdit: false,
      visibleIndex: 3,
    },
    {
      dataField: "fieldStart",
      dataType: "date",
      caption: "Field Start",
      alignment: "center",
      canEdit: false,
      visibleIndex: 4,
    },
    {
      dataField: "panelFabs",
      dataType: "date",
      caption: "Panel Fabs",
      minWidth: 160,
      alignment: "center",
      canEdit: true,
      visibleIndex: 5,
      cellRender: (e: any) => panelFabsRender(e.data),
      editCellRender: (e: any) => panelFabsEdit(e.data),
      weeksToGoBack: (cellData: any, columnData: any) => {
        console.log("Link to Field: ", cellData);
        console.log("columnData", columnData);
        return (
          <div>
            {/* <input
              type="date"
              className="form-control"
              value={cellData.value}
              onChange={(e) => {
                cellData.setValue(e.target.value);
                console.log("Hey!  I'm some cell data!", cellData);
              }}
            /> */}
          </div>
        );
      },
    },
    {
      dataField: "panelRelease",
      dataType: "date",
      caption: "Panel Release",
      alignment: "center",
      minWidth: 160,
      canEdit: true,
      visibleIndex: 6,
      //   cellRender: panelReleaseRender,
      //   editCellRender: panelReleaseEdit,
    },
    {
      dataField: "dollarAmount",
      dataType: "number",
      caption: "Dollar Amount",
      alignment: "center",
      canEdit: true,
      visibleIndex: 7,
      cellRender: (cell: any) =>
        cell.data.dollarAmount?.value
          ? `$ ${cell.data.dollarAmount.value}`
          : "",
    },
    {
      dataField: "sqft",
      dataType: "number",
      caption: "Sq. Ft.",
      alignment: "center",
      canEdit: true,
      visibleIndex: 8,
    },
    {
      dataField: "pnl_vendor",
      dataType: "string",
      caption: "Vendor",
      alignment: "center",
      canEdit: true,
      visibleIndex: 9,
    },
    {
      dataField: "costPerSqft",
      dataType: "number",
      caption: "$ per Sq. Ft.",
      alignment: "center",
      canEdit: true,
      visibleIndex: 10,
      cellRender: (row: any) => {
        return row.data.dollarAmount?.value && row.data.sqft?.value
          ? `$ ${(row.data.dollarAmount?.value / row.data.sqft?.value).toFixed(
              2
            )}`
          : "";
      },
    },
    {
      dataField: "panelRFQ",
      caption: "Panel RFQ",
      dataType: "boolean",
      alignment: "center",
      canEdit: true,
      visibleIndex: 11,
    },
    {
      dataField: "proposedPanelReleases",
      dataType: "number",
      caption: "Proposed Panel Releases (from Sherwin)",
      alignment: "center",
      headerColor: " #1976d2",
      canEdit: true,
      visibleIndex: 12,
    },
    {
      dataField: "panelScope",
      caption: "Panel Scope",
      alignment: "center",
      headerColor: " #1976d2",
      canEdit: true,
      visibleIndex: 13,
    },
    {
      dataField: "vendorKickOffLetter",
      dataType: "string",
      caption: "Vendor Kick-Off Letter",
      alignment: "center",
      headerColor: " #1976d2",
      canEdit: true,
      visibleIndex: 14,
    },
    {
      dataField: "kickOffMeeting",
      dataType: "string",
      caption: "PM/Vendor Kick-Off Meeting",
      alignment: "center",
      headerColor: " #1976d2",
      canEdit: true,
      visibleIndex: 15,
    },
    {
      dataField: "finalPanelReleases",
      dataType: "number",
      caption: "Final Panel Releases",
      alignment: "center",
      headerColor: " #1976d2",
      canEdit: true,
      visibleIndex: 16,
    },
    {
      dataField: "keyNotes",
      dataType: "string",
      caption: "Key Notes for Scope",
      alignment: "center",
      canEdit: true,
      visibleIndex: 17,
    },
    {
      dataField: "finish",
      dataType: "string",
      caption: "Finish",
      alignment: "center",
      canEdit: true,
      visibleIndex: 18,
    },
    {
      dataField: "certifiedMatchApproved",
      dataType: "boolean",
      caption: "Certified Match Approved",
      alignment: "center",
      canEdit: true,
      visibleIndex: 19,
    },
    {
      dataField: "warranty",
      dataType: "string",
      caption: "Warranty",
      alignment: "center",
      canEdit: true,
      visibleIndex: 20,
    },
    {
      dataField: "deliveryStartDateShop",
      dataType: "date",
      caption: "Delivery Start Date Shop",
      alignment: "center",
      canEdit: true,
      visibleIndex: 21,
    },
    {
      dataField: "deliveryStartDateField",
      dataType: "date",
      caption: "Delivery Start Date Field",
      alignment: "center",
      canEdit: true,
      visibleIndex: 22,
    },
    {
      dataField: "shopUseBrakes",
      dataType: "date",
      caption: "Shop Use Brakes Shape Release",
      alignment: "center",
      canEdit: true,
      visibleIndex: 23,
    },
    {
      dataField: "shopUseSteel",
      dataType: "date",
      caption: "Shop Use Steel Release",
      alignment: "center",
      canEdit: true,
      visibleIndex: 24,
    },
    {
      dataField: "glazeInPanelRelease",
      dataType: "date",
      caption: "Glaze-In Panel Release",
      alignment: "center",
      canEdit: true,
      visibleIndex: 25,
    },
    {
      dataField: "fieldUsePanelRelease",
      dataType: "date",
      caption: "Field Use Panel Release",
      alignment: "center",
      canEdit: true,
      visibleIndex: 26,
    },
    {
      dataField: "QC",
      caption: "QC",
      alignment: "center",
      canEdit: true,
      visibleIndex: 27,
    },
    {
      dataField: "doorLeafs",
      dataType: "number",
      caption: "# of Door Leafs",
      alignment: "center",
      canEdit: true,
      visibleIndex: 28,
    },
    {
      dataField: "notes",
      dataType: "string",
      caption: "Notes",
      alignment: "left",
      canEdit: true,
      visibleIndex: 29,
    },
  ];

  return (
    <CustomView
      jobs={jobs}
      data={currCategoryData}
      tabColumns={tabColumns}
      categoryKey={categoryKey}
      colorOptions={settings}
      //showSecondRow={true}
      defaultSortField={defaultSortField}
      handleUpdate={handleUpdate}
      handleAdd={handleAdd}
      handleDelete={handleDelete}
      canEdit={canEdit}
    />
  );
}

// export async function getStaticProps() {
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
