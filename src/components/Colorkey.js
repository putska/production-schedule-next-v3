import React, { useState, useEffect } from "react";

import {
    Grid,
    Button as MaterialButton,
} from "@mui/material";

const categoryKey = "metal";
const jobsKey = "production-schedule";

const ENGINEERING_COLOR = "salmon";
const BOOKED_COLOR = "cyan";
const RESERVED_COLOR = "red";
const SHOPSTART_COLOR = "green";
const FIELDSTART_COLOR = "red";

export default function ColorKey({ engineering, booked, reserved, shopStart, fieldStart }) {

    return (
        <Grid container direction="column" spacing={1}>
            {engineering &&
                <Grid item>
                    <span style={{ display: "flex", flexDirection: "row" }}>
                        <div style={{ width: "20px", height: "20px", backgroundColor: ENGINEERING_COLOR, marginRight: "10px" }}></div>
                        <div>Engineering</div>
                    </span>
                </Grid>
            }
            {booked &&
                <Grid item>
                    <span style={{ display: "flex", flexDirection: "row" }}>
                        <div style={{ width: "20px", height: "20px", backgroundColor: BOOKED_COLOR, marginRight: "10px" }}></div>
                        <div>Booked</div>
                    </span>
                </Grid>}
            {reserved &&
                <Grid item>
                    <span style={{ display: "flex", flexDirection: "row" }}>
                        <div style={{ width: "20px", height: "20px", backgroundColor: RESERVED_COLOR, marginRight: "10px" }}></div>
                        <div>Reserved</div>
                    </span>
                </Grid>}
            {shopStart &&
                <Grid item>
                    <span style={{ display: "flex", flexDirection: "row" }}>
                        <div style={{ width: "5px", height: "20px", backgroundColor: SHOPSTART_COLOR, marginRight: "10px" }}></div>
                        <div>Shop Start</div>
                    </span>
                </Grid>}
            {fieldStart &&
                <Grid item>
                    <span style={{ display: "flex", flexDirection: "row" }}>
                        <div style={{ width: "5px", height: "20px", backgroundColor: FIELDSTART_COLOR, marginRight: "10px" }}></div>
                        <div>Field Start</div>
                    </span>
                </Grid>}
        </Grid>
    )
}