import React, { useState, useEffect } from "react";
import Switch from "@mui/material/Switch";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";

import {
  Chart,
  Series,
  ArgumentAxis,
  CommonSeriesSettings,
  Export,
  Legend,
  Margin,
  Tooltip,
  Label,
  CommonAxisSettings,
} from "devextreme-react/chart";

import {
  toMondayDate,
  addDays,
  toWeeks,
} from "@/lib/helper-functions";

import { Typography } from "@mui/material";

const sources = [
  { value: "units", name: "Units" },
  { value: "emps", name: "Employees" },
];

const Graph = (props) => {
  const { jobs, shops } = props;

  const [graphData, setGraphData] = useState([]);
  const [shopKeys, setShopKeys] = useState({});

  useEffect(() => {
    const calculateForOffSets = () => {
      let allData = [];

      jobs.forEach((job) => {
        const date = job.shopStart;
        const checked = shopKeys[job.shopID];
        if (checked) {
          for (let w = 0; w <= job.weeks; w++) {
            const mon = toMondayDate(date);
            const curDate = new Date(mon.setDate(mon.getDate() + w * 7));

            allData.push({
              shop: job.shop ? job.shop.trim() : null,
              offset: job.offset + w,
              unitsPerWeek: parseInt(job.unitsPerWeek),
              emps: parseInt(job.emps),
              shopKey: job.shopID,
              date: curDate.toLocaleDateString(),
            });
          }
        }
      });

      var result = [];
      allData.reduce(function (res, value) {
        if (!res[value.offset]) {
          res[value.offset] = {
            offset: value.offset,
            units: 0,
            emps: 0,
            date: value.date,
          };
          result.push(res[value.offset]);
        }
        res[value.offset].units += value.unitsPerWeek;
        res[value.offset].emps += value.emps;
        return res;
      }, {});

      setGraphData(result);
    };
    calculateForOffSets();
  }, [jobs, shopKeys, toMondayDate]);

  useEffect(() => {
    let shopKeysInit = [];
    shopKeysInit = shops.reduce((a, v) => ({ ...a, [v.ID]: false }), {});

    setShopKeys(shopKeysInit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (event) => {
    setShopKeys({ ...shopKeys, [event.target.name]: event.target.checked });
  };

  const ShopSwitches = () =>
    shops.map((shop) => {
      const key = shop.ID;

      return (
        <Grid item key={key}>
          <FormControlLabel
            control={
              <Switch
                name={shop.ID}
                id={shop.ID}
                color='primary'
                checked={shopKeys[key]}
                onChange={handleChange}
              />
            }
            label={shop.value}
          />
        </Grid>
      );
    });

  return (
    <Grid container direction='row' spacing={1}>
      <Grid item>
        <FormGroup style={{ marginTop: "50px", padding: "10px" }}>
          <Typography>Choose Shops</Typography>
          {shops && shopKeys ? <ShopSwitches /> : null}
        </FormGroup>
      </Grid>
      <Grid item sx={{width: "80%"}}>
        <Chart dataSource={graphData} title='Units and Employees Over Time'>
          <CommonSeriesSettings argumentField='date' type='scatter' />
          <CommonAxisSettings>
            <Grid visible={true} />
          </CommonAxisSettings>
          {sources.map((item) => (
            <Series key={item.value} valueField={item.value} name={item.name} />
          ))}

          <Margin bottom={20} />
          <ArgumentAxis allowDecimals={false} axisDivisionFactor={60}>
            <Label />
          </ArgumentAxis>
          <Legend verticalAlignment='center' horizontalAlignment='right' />
          <Export enabled={true} />
          <Tooltip
            enabled={true}
            customizeTooltip={(pointInfo) => {
              return { text: pointInfo.value + "\n" + pointInfo.argument };
            }}
          />
        </Chart>
      </Grid>
    </Grid>
  );
};

export default Graph;
