import React, { useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import BuildClusters from './BuildClusters'
import ShuffleData from './ShuffleData'
import RunTests from './RunTests';
import MatchGroups from './MatchGroups';
import firebase from './firebase';
import { Redirect } from 'react-router-dom'

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <Typography
      component="div"
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      <Box p={3}>{children}</Box>
    </Typography>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired,
};

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper,
  },
  tabs:{
    height: 5
  }
}));

function SimpleTabs() {
  const classes = useStyles();
  const [value, setValue] = React.useState(0);


  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  if(!firebase.getCurrentUseId()){
    alert('please log in');
    return <Redirect to='/login'/>
  }



  return  (
    <div className={classes.root}>
      <AppBar position="static">
        <Tabs value={value} classes={{indicator:classes.tabs}} onChange={handleChange} aria-label="simple tabs example" variant="fullWidth">
          <Tab label="Build Clusters" {...a11yProps(0)} />
          <Tab  label="Shuffle data" {...a11yProps(1)} />
          <Tab  label="Match Groups" {...a11yProps(2)} />
          <Tab  label="Run Tests" {...a11yProps(3)} />
        </Tabs>
      </AppBar>
      <TabPanel value={value} index={0}>
        <BuildClusters/>
      </TabPanel>
      <TabPanel value={value} index={1}>
        <ShuffleData/>
      </TabPanel>
      <TabPanel value={value} index={2}>
        <MatchGroups/>
      </TabPanel>
      <TabPanel value={value} index={3}>
        <RunTests/>
      </TabPanel>
    </div>
  );
}

export default SimpleTabs
