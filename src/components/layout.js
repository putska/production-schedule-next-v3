import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/ww logo.png";

import Zoom from "@mui/material/Zoom";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import { Router, useRouter } from "next/router";
import NextNProgress from "nextjs-progressbar";
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Stack,
  Box,
  CircularProgress,
  Grow,
  Collapse,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

// const url = '/Portal/ReactModules/ProductionScheduleNext'; // TO DO: add actual URL later
// const url = 'http://wwweb/portal/reactmodules/productionschedulenext';
// const url = "http://wwweb/portal/reactmodules/productionschedulenextadmin";
// const localURL = 'http://localhost:3000';
const url = "http://localhost:3000";
// const url = "https://production-schedule-next-milgor931-milgor931-s-team.vercel.app"
// const url = ""
const localURL = "";

const MUI_BLUE = "#1976d2";

const tabs = [
  { name: "Production Schedule", link: `${url}/production-schedule.html` },
  { name: "Shop Drawings", link: `${url}/shop-drawings.html` },
  { name: "Takeoff Matrix", link: `${url}/takeoff-matrix.html` },
  { name: "Panel Matrix", link: `${url}/panel-matrix.html` },
  { name: "Fab Matrix", link: `${url}/fab-matrix.html` },
  { name: "All Activities", link: `${url}/all-activities.html` },
  { name: "Glass & Gasket", link: `${url}/glass-and-gasket.html` },
  { name: "Metal", link: `${url}/metal.html` },
  { name: "Field", link: `${url}/field.html` },
  { name: "Packaging", link: `${url}/packaging.html` },
  { name: "Purchasing", link: `${url}/purchasing.html` },
  { name: "JMP Field Tracking Log", link: `${url}/jmp-field-tracking.html` },
];

// const tabs = [
//   { name: 'Production Schedule', link: `/production-schedule.html` },
//   { name: 'Shop Drawings', link: `/shop-drawings.html` },
//   { name: 'Takeoff Matrix', link: `/takeoff-matrix.html` },
//   { name: 'Panel Matrix', link: `/panel-matrix.html` },
//   { name: 'Fab Matrix', link: `/fab-matrix.html` },
//   { name: 'All Activities', link: `/all-activities.html` },
//   { name: 'Glass & Gasket', link: `/glass-and-gasket.html` },
//   { name: 'Metal', link: `/metal.html` },
//   { name: 'Field', link: `/field.html` },
//   { name: 'Packaging', link: `/packaging.html` },
//   { name: 'Purchasing', link: `/purchasing.html` },
//   { name: 'JMP Field Tracking Log', link: `/jmp-field-tracking.html` }
// ];

// const tabs = [
//   { name: 'Production Schedule', link: `${url}/production-schedule` },
//   { name: 'Shop Drawings', link: `${url}/shop-drawings` },
//   { name: 'Takeoff Matrix', link: `${url}/takeoff-matrix` },
//   { name: 'Panel Matrix', link: `${url}/panel-matrix` },
//   { name: 'Fab Matrix', link: `${url}/fab-matrix` },
//   { name: 'All Activities', link: `${url}/all-activities` },
//   { name: 'Glass & Gasket', link: `${url}/glass-and-gasket` },
//   { name: 'Metal', link: `${url}/metal` },
//   { name: 'Field', link: `${url}/field` },
//   { name: 'Packaging', link: `${url}/packaging` },
//   { name: 'Purchasing', link: `${url}/purchasing` },
//   { name: 'JMP Field Tracking Log', link: `${url}/jmp-field-tracking` }
// ];

const localTabs = [
  { name: "Production Schedule", link: `${localURL}/production-schedule` },
  { name: "Shop Drawings", link: `${localURL}/shop-drawings` },
  { name: "Takeoff Matrix", link: `${localURL}/takeoff-matrix` },
  { name: "Panel Matrix", link: `${localURL}/panel-matrix` },
  { name: "Fab Matrix", link: `${localURL}/fab-matrix` },
  { name: "All Activities", link: `${localURL}/all-activities` },
  { name: "Glass & Gasket", link: `${localURL}/glass-and-gasket` },
  { name: "Metal", link: `${localURL}/metal` },
  { name: "Field", link: `${localURL}/field` },
  { name: "Packaging", link: `${localURL}/packaging` },
  { name: "Purchasing", link: `${localURL}/purchasing` },
  { name: "JMP Field Tracking Log", link: `${localURL}/jmp-field-tracking` },
];

export default function Layout({ children }) {
  const router = useRouter();
  const [currTabs, setCurrTabs] = useState(tabs);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [currentTabName, setCurrentTabName] = useState("");
  const [canEdit, setCanEdit] = useState(true);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Router.events.on("routeChangeStart", () => setLoading(true));
    Router.events.on("routeChangeComplete", () => setLoading(false));
    Router.events.on("routeChangeError", () => setLoading(false));
    return () => {
      Router.events.off("routeChangeStart", () => setLoading(true));
      Router.events.off("routeChangeComplete", () => setLoading(false));
      Router.events.off("routeChangeError", () => setLoading(false));
    };
  }, [Router.events]);

  useEffect(() => {
    setCurrentTabName(getTabName(router.asPath));
  }, []);

  useEffect(() => {
    setCurrentTabName(getTabName(router.asPath));
  }, [router.asPath]);

  const getTabName = (path) => {
    if (process.env.NODE_ENV === "development") {
      setCurrTabs(localTabs);
      const currTab =
        localTabs.find((tab) => tab.link === path) || localTabs[0];
      return currTab.name;
    } else {
      setCurrTabs(tabs);
      const currTab =
        tabs.find((tab) => tab.link === window.location.href) || tabs[0];
      return currTab.name;
      // const normalTab = tabs.find(tab => (url + tab.link) === window.location.href);
      // const adminTab = tabs.find(tab => (admin_url + tab.link) === window.location.href);

      // if (normalTab) {
      //   setCanEdit(false)
      //   return normalTab.name;
      // } else if (adminTab) {
      //   setCanEdit(true)
      //   return adminTab.name
      // }
      // return tabs[0].name;
    }
  };

  const toggleDrawer = (open) => (event) => {
    if (
      event &&
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    setOpenDrawer(open);
  };

  const handleTabChange = (name) => {
    setCurrentTabName(name);
    toggleDrawer(false);
    setOpenDrawer(false);
  };

  const sideList = () => (
    <Stack
      spacing={2}
      direction="column"
      style={{ padding: "5%", minWidth: "30vw" }}
    >
      {currTabs.map((tab, index) => {
        const selectedTab = tab.name === currentTabName;

        return (
          <Link
            key={index}
            href={tab.link}
            onClick={(e) => handleTabChange(tab.name)}
            className="link"
            style={{
              fontSize: "max(15px, 1vw)",
              backgroundColor: `${selectedTab ? MUI_BLUE : "white"}`,
              color: `${selectedTab ? "white" : "black"}`,
            }}
          >
            {tab.name}
          </Link>
        );
      })}
    </Stack>
  );

  return (
    <>
      <AppBar position="sticky" style={{ padding: "20px" }}>
        <Toolbar variant="dense">
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>
              <Image
                src={logo}
                priority
                alt="Logo"
                style={{ minWidth: "40px", width: "5vw", height: "auto" }}
              />
            </Grid>
            <Grid item>
              <Typography style={{ fontSize: "max(15px, 3vw)" }}>
                {currentTabName}
              </Typography>
            </Grid>
            <Grid item>
              <IconButton
                color="inherit"
                onClick={toggleDrawer(true)}
                size="large"
              >
                <MenuIcon />
              </IconButton>
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>

      {/* Side Drawer */}
      <Drawer anchor="right" open={openDrawer} onClose={toggleDrawer(false)}>
        {sideList()}
      </Drawer>

      <NextNProgress />

      {/* <Suspense fallback={<Loading />}> */}
      <div style={{ padding: "3vw" }}>
        {loading ? (
          <CircularProgress sx={{ display: "block", margin: "0 auto" }} />
        ) : (
          <Zoom
            in={!openDrawer}
            style={{ transitionDelay: !openDrawer ? "500ms" : "0ms" }}
          >
            <div>{React.cloneElement(children, { canEdit: canEdit })}</div>
          </Zoom>
        )}
      </div>
    </>
  );
}
