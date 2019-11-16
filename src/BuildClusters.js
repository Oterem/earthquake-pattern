import React, { useContext, useEffect, useState } from "react";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";
import Typography from "@material-ui/core/Typography";
import GridReact from "@material-ui/core/Grid";
import { ExcelRenderer } from "react-excel-renderer";
import DownloadExcel from "./DownloadExcel";
import moment from "moment";
import * as _ from "lodash";
import {
  buildGroups,
  excelDateToIsoString,
  excelDateToJSDate,
  validateExcel
} from "./utils/HelperFunctions";
import { MyContext } from "./utils/AppContext";
import { makeStyles } from "@material-ui/core/styles";
import OverrideSwitch from './BuildClusetrs/OverrideSwitch';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper
  }
}));

export default ({ checks }) => {
  const classes = useStyles();
  const store = useContext(MyContext.Context);

  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [magnitude, setMagnitude] = useState(0.5);
  const [cutOffDays, setCutOffDays] = useState(365);
  const [distanceThreshold, setDistanceThreshold] = useState(350);
  const [showStatistics, setShowStatistics] = useState(false);
  const [excelRows, setExcelRows] = useState([]);
  const [rawData, setRawData] = useState([]);
  const fileInput = React.createRef();
  const [loading, setLoading] = useState(false);
  const [clusteredData, setClusteredData] = useState([]);
  const [numOfClusters, setNumOfClusters] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [clusteredRows, setClusteredRows] = useState(0);
  const [unclusteredRows, setUnclusteredRows] = useState(0);
  const [unclusteredEvents, setUnclusteredEvents] = useState([]);
  const [dataRowOffset, setDataRowOffset] = useState(2);
  const [isOverride, setIsOverride] = useState(false);
  const [overrideLatitude, setOverrideLatitude] = useState(0);
  const [overrideLongitude, setOverrideLongitude] = useState(0);
  const [cutoffDaysDirection, setCutoffDaysDirection] = useState(1);
  const [children, setChildren] = useState(0);

  useEffect(() => {
    store.loading.set(loading);
  }, [loading]);

  function makeGroups() {
    if (!latitude && !longitude) {
      alert("Insert at least one of: latitue or longitude");
      return;
    }
    if(overrideLatitude && !latitude){
      alert("you must insert +- Latitutue in order to override it");
      return;
    }
    if(overrideLongitude && !longitude){
      alert("you must insert +- Longitude in order to override it");
      return;
    }

    store.loading.setLoadingText("Building clusters...");
    store.loading.set(true);
    const overrideObj = {
      isOverride,
      overrideLatitude:+overrideLatitude,
      overrideLongitude:+overrideLongitude
    };
    setTimeout(async () => {
      await a(
        [...excelRows],
        latitude,
        longitude,
        magnitude,
        cutOffDays,
        distanceThreshold,
        overrideObj,
        cutoffDaysDirection
      );
      setShowStatistics(true);
      // setLoading(false);
      store.loading.set(false);
    }, 50);
    const a = (
      arrayOfDate,
      latitude,
      longitude,
      magnitude,
      cutOffDays,
      distanceThreshold,
      overrideObj,
      cutoffDaysDirection
    ) => {
      return new Promise(resolve => {
        const {final,visitedEvents} = buildGroups(
          arrayOfDate,
          latitude,
          longitude,
          magnitude,
          cutOffDays,
          distanceThreshold,
          overrideObj,
          cutoffDaysDirection
        );
        const clustered = final.filter(obj => obj.children.length);
        setClusteredData([...clustered]);
        const ids = Object.keys(visitedEvents);
        const unclustered = [];
        ids.forEach(id=>{
          const obj = visitedEvents[id];
          if(obj && obj.taken ===false){
            const objtoPush = arrayOfDate.find(obj=>obj.eventid === +id);
            unclustered.push(objtoPush);
          }
        });
        let counter = 0;
        let childrenCount = 0;
        clustered.forEach(row => {
          counter += 1;
          childrenCount += row.children.length;
        });
        setUnclusteredEvents(unclustered);
        setClusteredRows(counter);
        setChildren(childrenCount);
        setUnclusteredRows(unclustered.length);
        setNumOfClusters(clustered.length);
        resolve();
      });
    };
  }

  const handleCutoffDaysDirectionChange = (event) =>{
    setCutoffDaysDirection(+event.target.value);
  }

  const fileHandler = event => {
    store.loading.setLoadingText("Importing file...");
    store.loading.set(true);
    let fileObj = event.target.files[0];

    //just pass the fileObj as parameter
    ExcelRenderer(fileObj, (err, resp) => {
      if (err) {
        console.log(err);
      } else {
        setNumOfClusters(0);
        setShowStatistics(false);
        const validRows = resp.rows.filter(row => {
          return _.isArray(row) && !_.isEmpty(row);
        });
        if (validRows && validRows[0] && validRows[0][0] === "eventid") {
          validRows.shift();
        }

        const { valid, msg } = validateExcel(validRows,dataRowOffset);
        if (!valid) {
          store.loading.set(false);
          alert(msg);
          return;
        }
        setTotalRows(validRows.length);
        try {
          const transformedData = validRows.map((row, index) => {
            const excelTime = excelDateToJSDate(row[2]);
            const validDate = excelDateToIsoString(row[1]);
            if (!validDate) {
              const msg =
                "row " + (index + dataRowOffset) + " has invalid date";
              alert(msg);
              throw new Error(row);
            }
            const newDate = validDate;
            const dateWithTime = moment(newDate)
              .add(excelTime.hour, "h")
              .add(excelTime.minute, "m")
              .toISOString();
            return {
              ParentGroup: 0,
              eventid: row[0],
              date: dateWithTime,
              stime: `${excelTime.hour}:${excelTime.minute}:00`,
              latitude: row[3],
              longtitude: row[4],
              z: row[5],
              typeF: row[6],
              magF: row[7],
              Id: row[8],
              Name: row[9],
              _id: row[8]
            };
          });
          const excelRowsArray = validRows.map(row => {
            const excelTime = excelDateToJSDate(row[2]);
            const newDate = excelDateToIsoString(row[1]);
            const dateWithTime = moment(newDate)
              .add(excelTime.hour, "h")
              .add(excelTime.minute, "m")
              .toISOString();
            return {
              eventid: row[0],
              date: dateWithTime,
              stime: `${excelTime.hour}:${excelTime.minute}:00`,
              latitude: row[3],
              longtitude: row[4],
              z: row[5],
              typeF: row[6],
              magF: row[7],
              Id: row[8],
              Name: row[9],
              _id: row[8]
            };
          });
          setRawData([...transformedData]);
          setExcelRows([...excelRowsArray]);
        } catch (e) {
          console.log(e);
        }
      }
      store.loading.set(false);
    });
  };

  return (
    <div>
      <>
        <TextField
          id="outlined-number"
          label="Data starts in row"
          value={dataRowOffset}
          onChange={e => {
            setDataRowOffset(+e.target.value);
          }}
          type="number"
          margin="normal"
        />
        <input
          type="file"
          onChange={fileHandler}
          ref={fileInput}
          onClick={event => {
            event.target.value = null;
          }}
          style={{ padding: "40px", height: 70 }}
        />
      </>

      <br />
      <br />
      {!_.isEmpty(excelRows) && (
        <div >
          <GridReact
                      container
                      spacing={1}
                      direction="row"
                      justify="center"
                      alignItems="center"
          >


          <GridReact item xs={12} md={2}>
            <TextField
                        id="outlined-number"
                        label="Latitude"
                        value={latitude}
                        onChange={e => {
                          setLatitude(e.target.value);
                        }}
                        type="number"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">+ -</InputAdornment>
                          )
                        }}
                        InputLabelProps={{
                          shrink: true
                        }}
                        margin="normal"
                        variant="outlined"
                      />
          </GridReact>
          <GridReact item xs={12} md={2}>
            <TextField
                        id="outlined-number"
                        label="Longitude"
                        value={longitude}
                        onChange={e => {
                          setLongitude(e.target.value);
                        }}
                        type="number"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">+ -</InputAdornment>
                          )
                        }}
                        InputLabelProps={{
                          shrink: true
                        }}
                        margin="normal"
                        variant="outlined"
                      />
          </GridReact>
          <GridReact item xs={12} md={2} >
            <TextField
                        id="outlined-number"
                        label="Distance threshold(Km)"
                        value={distanceThreshold}
                        onChange={e => {
                          setDistanceThreshold(e.target.value);
                        }}
                        type="number"
                        // className={classes.textField}
                        InputLabelProps={{
                          shrink: true
                        }}
                        margin="normal"
                        variant="outlined"
                      />
          </GridReact>
          <GridReact item xs={12} md={2} >
            <TextField
                        id="outlined-number"
                        label="Magnitude"
                        value={magnitude}
                        onChange={e => {
                          setMagnitude(e.target.value);
                        }}
                        type="number"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">+ -</InputAdornment>
                          )
                        }}
                        InputLabelProps={{
                          shrink: true
                        }}
                        margin="normal"
                        variant="outlined"
                      />
          </GridReact>
            <GridReact  item xs={12} md={2} >
                <TextField
                                    id="outlined-number"
                                    label="Cut Off Days"
                                    value={cutOffDays}
                                    onChange={e => {
                                      setCutOffDays(e.target.value);
                                    }}
                                    type="number"
                                    // className={classes.textField}
                                    InputLabelProps={{
                                      shrink: true
                                    }}
                                    margin="normal"
                                    variant="outlined"
                                  />
            </GridReact>
            <GridReact style={{display:"contents"}}  item xs={12} md={1} >
              <RadioGroup   value={cutoffDaysDirection.toString()} onChange={handleCutoffDaysDirectionChange}>
                    <FormControlLabel value="1" control={<Radio />} label="Up" />
                    <FormControlLabel value="0" control={<Radio />} label="Down" />
              </RadioGroup>
            </GridReact>

          </GridReact>

          <br />
          <GridReact
            container
            spacing={10}
            direction="row"
            justify="center"
            alignItems="center"
          >
            <GridReact item xs={12}>
                <OverrideSwitch
                    setIsOverride={setIsOverride}
                    setOverrideLatitudeParent={setOverrideLatitude}
                    setOverrideLongitudeParent={setOverrideLongitude}
                />
            </GridReact>
            <GridReact item>
              <GridReact
                container
                direction="row"
                justify="center"
                alignItems="center"
              >
                <GridReact item>
                  <Button
                    variant="contained"
                    color="primary"
                    style={{ paddingRight: 10 }}
                    onClick={makeGroups}
                  >
                    GO
                  </Button>
                </GridReact>
                <GridReact item key={"clustered"}>
                  {numOfClusters ? (
                    <DownloadExcel
                      fullData={clusteredData}
                      isClustered={true}
                      buttonTitle={"Clustered events as excel"}
                    />
                  ) : null}
                </GridReact>
                <GridReact item key={"unclustered"}>
                  {unclusteredRows ? (
                    <DownloadExcel
                      fullData={unclusteredEvents}
                      isClustered={false}
                      buttonTitle={"UnClustered events as excel"}
                    />
                  ) : null}
                </GridReact>
              </GridReact>
            </GridReact>
          </GridReact>
        </div>
      )}
      {showStatistics && (
        <div style={{ paddingTop: 30 }}>
          <Typography variant="body2">Total events: {totalRows}</Typography>
          <Typography variant="body2">
            Clustered events: {clusteredRows} (
            {Math.floor((clusteredRows * 100) / totalRows)})%
          </Typography>
          <Typography variant="body2">
            Children: {children} (
            {Math.floor((children * 100) / totalRows)})%
          </Typography>
          <Typography variant="body2">
            Unclustered events: {unclusteredRows}
          </Typography>
          <Typography variant="body2">
            Total Clusters: {numOfClusters}
          </Typography>
        </div>
      )}
    </div>
  );
};
