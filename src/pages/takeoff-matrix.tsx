import React, { useState, useEffect } from "react";

import VerticalWeeklyView from "@/src/components/Views/VerticalWeeklyView";
import {
  toMondayDate,
  addDays,
  toWeeks,
  createBasicRows,
  calculateWeeks,
  getHighlight,
  createRows,
  convertDates,
  loadData,
  getFirebaseData,
  putData,
  postData,
  deleteData,
  toDays,
  deconstructJobData,
  addDataToJSON,
  addJSONData,
  updateJSONWithData,
} from "@/lib/helper-functions";
import { create } from "domain";

const categoryKey = "takeoff-matrix";
const jobsKey = "production-schedule";
const categoryColumnKey = categoryKey + "-column";

export default function TakeoffMatrixPage(props: any) {
  const [canEdit, setCanEdit] = useState(props.canEdit);
  const [takeoffData, setTakeoffData] = useState([]);
  const [hJobs, sethJobs] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [takeoffMatrixs, setTakeoffMatrixs] = useState([]);
  const [settings, setSettings] = useState([]);
  const [weeks, setWeeks] = useState(0);
  const [dateRows, setDateRows] = useState([]);
  const [cellSettings, setCellSettings] = useState([]);
  const [cellSettingsID, setCellSettingsID] = useState(null);

  const getData = async () => {
    let loadedJobs = await getFirebaseData("/GetJobs");
    loadedJobs = convertDates(deconstructJobData(loadedJobs, categoryKey));
    let loadedSettings = await getFirebaseData("/GetSettings");
    if (loadedSettings) {
      let loadedCellSettings = loadedSettings.find(
        (setting: any) => setting.category === categoryKey + "-cell-status"
      );
      if (loadedCellSettings) {
        setCellSettingsID(loadedCellSettings.ID);
        loadedCellSettings = JSON.parse(loadedCellSettings.JSON);
        setCellSettings(loadedCellSettings);
      }
      loadedSettings = loadedSettings
        .filter(
          (setting: any) =>
            setting.category === categoryKey ||
            setting.category === categoryColumnKey
        )
        .map((setting: any) => addJSONData(setting));
    }
    const loadedWeeks = calculateWeeks(loadedJobs);
    const loadedDateRows = createBasicRows(new Date(), loadedWeeks);

    setJobs(loadedJobs);
    setTakeoffMatrixs(
      loadedSettings.filter(
        (setting: any) => setting.category === categoryColumnKey
      )
    );
    setSettings(
      loadedSettings.filter((setting: any) => setting.category === categoryKey)
    );
    setWeeks(loadedWeeks);
    setDateRows(loadedDateRows);
  };

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    if (jobs) {
      const newJobs = JSON.parse(JSON.stringify(jobs));
      const createdRows = createRows(
        takeoffMatrixs,
        dateRows,
        newJobs,
        weeks,
        cellSettings
      );
      setTakeoffData(createdRows);

      sethJobs(
        newJobs.filter((job: any) => {
          if (job.jobDatesUpdated) {
            const timeSinceChanged = toDays(job.jobDatesUpdated, new Date());
            return timeSinceChanged < 7;
          }
          return false;
        })
      );
    }
  }, [jobs, takeoffMatrixs, settings, cellSettings]);

  async function handleUpdate(data: any, endpoint: any) {
    switch (endpoint) {
      case "cell status":
        try {
          const newData = {
            ID: cellSettingsID,
            category: categoryKey + "-cell-status",
            JSON: JSON.stringify(data),
          };
          let resData = await putData("/GetSettings", newData);
          setCellSettings(data);
        } catch (error) {
          console.log(error);
        }
        break;
      case "column":
        try {
          const newData = addDataToJSON(data);
          const resData = await putData("/GetSettings", newData);
          setTakeoffMatrixs((prev: any) => {
            let items = prev.filter((item: any) => data.ID !== item.ID);
            return [...items, data];
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
      case "column":
        try {
          const newData = addDataToJSON(data);
          let resData = await postData("/GetSettings", newData);
          resData = addJSONData(resData);

          setTakeoffMatrixs((prev: any) => {
            let items = prev.filter(
              (item: any) => resData.ID !== item.ID && item.ID
            );
            return [...items, resData];
          });
        } catch (error) {
          console.log(error);
        }
        break;
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
      case "column":
        try {
          const newData = addDataToJSON(data);
          const resData = await deleteData("/GetSettings", newData);
          setTakeoffMatrixs((prev: any) =>
            prev.filter((item: any) => item.ID !== data.ID)
          );
        } catch (error) {
          console.log(error);
        }
        break;
      case "setting":
        try {
          const newData = addDataToJSON(data);
          const resData = await deleteData("/GetSettings", newData);
          setSettings((prev: any) =>
            prev.filter((item: any) => item.ID !== data.ID)
          );
        } catch (error) {
          console.log(error);
        }
        break;
      default:
        break;
    }
  }

  return (
    <VerticalWeeklyView
      categoryKey={categoryKey}
      categoryColumnKey={categoryColumnKey}
      takeoffMatrixs={takeoffMatrixs}
      takeoffData={takeoffData}
      jobs={jobs}
      highlightJobs={hJobs}
      cellSettingsID={cellSettingsID}
      handleUpdate={handleUpdate}
      handleAdd={handleAdd}
      handleDelete={handleDelete}
      colorOptions={settings}
      rows={dateRows}
      weeks={weeks}
      canEdit={canEdit}
    />
  );
}

// export async function getStaticProps() {
//     let loadedJobs = await loadData("/GetJobs");
//     let loadedSettings = await loadData("/GetSettings");
//     if (loadedSettings) {
//         loadedSettings = loadedSettings
//             .filter((setting: any) => setting.category === categoryKey || setting.category === categoryColumnKey)
//             .map((setting: any) => addJSONData(setting))
//     }

//     const weeks = calculateWeeks(deconstructJobData(loadedJobs, jobsKey));
//     const dateRows = createBasicRows(new Date(), weeks);

//     return {
//         props: {
//             loadedJobs,
//             loadedSettings,
//             dateRows,
//             weeks
//         }
//     }
// }
