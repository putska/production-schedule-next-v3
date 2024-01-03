import React, { useState, useEffect } from "react";
import GanttView from "@/src/components/Views/GanttView";
import Colorkey from "@/src/components/Colorkey";
import {
  toMondayDate,
  addDays,
  toWeeks,
  loadData,
  getFirebaseData,
  getFirebaseDataByCategory,
  putData,
  postData,
  deleteData,
  convertDates,
  calculateForOffSetsNew,
  updateJSONWithData,
  getDataByCategory,
  addJSONData,
  addDataToJSON,
  deconstructJobData,
} from "@/lib/helper-functions";

const categoryKey = "metal";
const jobsKey = "production-schedule";

const officialStartDate = "1/1/2022";

const ENGINEERING_COLOR = "salmon";

const customColumns: any = [
  {
    visibleIndex: 6,
    dataField: "reserved",
    caption: "Reserved",
    dataType: "boolean",
    alignment: "center",
    calculateCellValue: (cell: any) => (cell.reserved ? cell.reserved : false),
  },
  {
    visibleIndex: 7,
    dataField: "lbs",
    caption: "lbs",
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
];

export default function MetalPage(props: any) {
  const [canEdit, setCanEdit] = useState(props.canEdit);

  const [jobs, setJobs] = useState([]);
  const [jobsData, setJobsData] = useState([]);
  const [settings, setSettings] = useState([]);

  const [cols, setCols] = useState([]);
  const [colsX, setColsX] = useState([]);
  const [startDate, setStartDate] = useState(toMondayDate(new Date()));

  let newEndDate = toMondayDate(addDays(new Date(), 365));
  const [endDate, setEndDate] = useState(newEndDate);

  const getData = async () => {
    let loadedJobs = await getFirebaseData("/GetJobs");
    loadedJobs = convertDates(deconstructJobData(loadedJobs, categoryKey));

    let loadedSettings = await getFirebaseDataByCategory(
      "/GetSettings",
      "shops"
    );

    setJobs(loadedJobs);
    setSettings(loadedSettings);
  };

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    const newJobs = JSON.parse(JSON.stringify(jobs));

    const { newCols, newColsX } = calculateForOffSetsNew(
      officialStartDate,
      startDate,
      endDate
    );

    newJobs.forEach((job: any, index: any) => {
      const startOffset = toWeeks(officialStartDate, job.shopStart);
      const shopColor = settings.find((shop: any) => shop.ID === job.shopID);

      newCols.forEach((innerCol: any) => {
        let isDate =
          parseInt(innerCol.offset) >= startOffset &&
          parseInt(innerCol.offset) < startOffset + job.weeks;

        let dataField = innerCol.offset;
        const cellData = job.JSON[categoryKey][dataField];

        let displayUnits = {
          cellColor: "",
          actual: cellData ? cellData.actual : 0,
          planned: cellData ? cellData.planned : 0,
        };

        if (isDate) {
          if (job.engineering) {
            displayUnits.cellColor = ENGINEERING_COLOR;
          } else {
            displayUnits.cellColor = shopColor ? shopColor.color : "#1976d2";
          }
        }

        newJobs[index][dataField] = displayUnits;
      });
    });

    setCols(newCols);
    setColsX(newColsX);
    setJobsData(newJobs);
  }, [jobs, startDate, endDate]);

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

  return (
    <div>
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
        showEditButtons={false}
        showShopButtons={false}
        sortByShopStart={true}
        saveByFieldStart={false}
        saveByShopStart={false}
        handleUpdate={handleUpdate}
        handleAdd={handleAdd}
        handleDelete={handleDelete}
        canEdit={canEdit}
      />

      <Colorkey
        engineering={true}
        booked={true}
        reserved={true}
        fieldStart={true}
        shopStart={true}
      />
    </div>
  );
}

// export async function getStaticProps() {
//     // const loadedJobs = await loadData("/GetJobs");
//     // const loadedSettings = await getDataByCategory("/GetSettings", "shops");

//     let loadedJobs = await loadData("/GetJobs");
//     // loadedJobs = Object.entries(loadedJobs).map((item: any) => {
//     //     return {
//     //         ...item[1],
//     //         ID: item[0],
//     //     }
//     // })

//     let loadedSettings = await loadData("/GetSettings");
//     // loadedSettings = Object.entries(loadedSettings).map((item: any) => {
//     //     return {
//     //         ...item[1],
//     //         ID: item[0],
//     //     }
//     // })

//     loadedSettings = loadedSettings
//         .filter((setting: any) => setting.category === "shops")
//         .map((setting: any) => addJSONData(setting))

//     return {
//         props: {
//             loadedJobs,
//             loadedSettings
//         }
//     }
// }
