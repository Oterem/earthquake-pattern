import React, { useContext, useEffect, useState } from "react";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";
import Typography from "@material-ui/core/Typography";
import GridReact from "@material-ui/core/Grid";
import { ExcelRenderer } from "react-excel-renderer";
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import OverrideSwitch from './BuildClusetrs/OverrideSwitch';
import DownloadExcel from "./DownloadExcel";
import moment from "moment";
import * as _ from "lodash";
import {
  fisherYatesShuffle,
  excelDateToIsoString,
  excelDateToJSDate,
  validateExcel
} from "./utils/HelperFunctions";
import { MyContext } from "./utils/AppContext";
import CheckBoxes from "./CheckBoxes";
import worker from 'workerize-loader!./worker'; // eslint-disable-line import/no-webpack-loader-syntax
import mapLimit from 'async/mapLimit';
import DownloadTestsResultsExcel from './DownTestsResultsExcel';
// Create an instance of your worker


export default ({ checks }) => {

  const store = useContext(MyContext.Context);
  const [excelRows, setExcelRows] = useState([]);//original, never changed
  const fileInput = React.createRef();
  const [loading, setLoading] = useState(false);
  const [dataRowOffset, setDataRowOffset] = useState(2);
  const [numOfTests, setNumOfTests] = useState(5);
  const [shuffledData, setShuffledData] = useState([]);
  const [showDownloadButton, setShowDownloadButton] = useState(false);
  const [markedCheckBoxes, setCheckBoxes] = useState({
    date: false,
    latitude: false,
    longtitude: false,
    z: false,
    typeF: false,
    magF: false
  });

  const [isOverride, setIsOverride] = useState(false);
  const [overrideLatitude, setOverrideLatitude] = useState(0);
  const [overrideLongitude, setOverrideLongitude] = useState(0);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [magnitude, setMagnitude] = useState(0.5);
  const [cutOffDays, setCutOffDays] = useState(365);
  const [distanceThreshold, setDistanceThreshold] = useState(350);
  const [cutoffDaysDirection, setCutoffDaysDirection] = useState(1);

  const [finalResults, setFinalResults] = useState([]);




  const results = [];
  let testsLeft = numOfTests;

  useEffect(() => {
    store.loading.set(loading);
  }, [loading]);

  async function workerTask({id,propertyToShuffle}){
    const shuffledArray = shuffleData(propertyToShuffle);
    const data = shuffledArray.length ? shuffledArray : excelRows;
    const overrideObj = {
      isOverride,
      overrideLatitude:+overrideLatitude,
      overrideLongitude:+overrideLongitude
    };
    const workerParams = {
      rows:[...data],
      latitude,
      longitude,
      magnitude,
      cutOffDays,
      distanceThreshold,
      overrideObj,
      cutoffDaysDirection
    };
    const workerInstance = new worker();
    const {final, visitedEvents} = await workerInstance.kuku(workerParams);
    const testObj = {
      id,
      totalEvents:workerParams.rows.length
    }
    const clustered = final.filter(obj => obj.children.length);
    testObj.numberOfParents = clustered.length;

    let numberOfChildren = 0;
    let numberOfUnClustered = 0;
    clustered.forEach(row => {
      numberOfChildren += row.children.length;
    });

    const ids = Object.keys(visitedEvents);
    ids.forEach(id=>{
      const obj = visitedEvents[id];
      if(obj && obj.taken ===false){
        const objtoPush = workerParams.rows.find(obj=>obj.eventid === +id);
        if(objtoPush){
          numberOfUnClustered++;
        }
      }
    });

    testObj.unclusteredEvents = numberOfUnClustered;
    testObj.numberOfChildren = numberOfChildren;
    testsLeft--;
    store.loading.setLoadingText(`${testsLeft} tests left`);
    return testObj

  }

  async function startTests(){
    store.loading.setLoadingText(`Perfoming ${numOfTests} test`);
    store.loading.set(true);
    results.length = 0;
    store.loading.setLoadingText(`${testsLeft} tests left`);

    const propertyToShuffle = [];
    const shuffledProps = Object.keys(markedCheckBoxes);
    for (const prop of shuffledProps) {
      if (markedCheckBoxes[prop] === true) {
        propertyToShuffle.push(prop);
      }
    }

    const arrayOfPromises = [];

    /*Shuffle each array*/
    for(let i=0; i<=numOfTests-1; i++){
      arrayOfPromises.push({id:i, propertyToShuffle});
      // arrayOfPromises.push(workerTask({id:i,propertyToShuffle}))
    }
    // const res = await Promise.all(arrayOfPromises);
    const res = await mapLimit(arrayOfPromises,10, async (data)=>{
      console.log(data.id)
        return await workerTask({id:data.id,propertyToShuffle:data.propertyToShuffle})
    });
    debugger
    setFinalResults(res);
    setShowDownloadButton(true);
    store.loading.set(false);

  }



 function shuffleData(propertyToShuffle) {
    const arrayHolder = {};
    propertyToShuffle &&
      propertyToShuffle.forEach(property => {
        const arrayOfProperties =
          excelRows && excelRows.map(item => item[property]);
        arrayHolder[property] = fisherYatesShuffle([...arrayOfProperties]);
      });
      const shuffledKeys = Object.keys(arrayHolder);
      if (shuffledKeys.length) {
        
        const shuffledArray = excelRows.map((row, index) => {
            const partialObj = {};
            shuffledKeys.forEach(key => {
              partialObj[key] = arrayHolder[key][index];
            });
            return { ...row, ...partialObj };
          });
          return shuffledArray;
  }
  return [];
}


  const fileHandler = event => {
    store.loading.setLoadingText("Importing file...");
    store.loading.set(true);
    const fileObj = event.target.files[0];

    // just pass the fileObj as parameter
    ExcelRenderer(fileObj, (err, resp) => {
      if (err) {
        console.log(err);
      } else {
        const validRows = resp.rows.filter(
          row => _.isArray(row) && !_.isEmpty(row)
        );
        if (validRows && validRows[0] && validRows[0][0] === "eventid") {
          validRows.shift();
        }
        const { valid, msg } = validateExcel(validRows,dataRowOffset);
        if (!valid) {
          store.loading.set(false);
          alert(msg);
          return;
        }
        try {
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
          setExcelRows([...excelRowsArray]);
        } catch (e) {
          console.log(e);
        }
      }
      store.loading.set(false);
    });
  };

  const handleCutoffDaysDirectionChange = (event) =>{
    setCutoffDaysDirection(+event.target.value);
  }

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
        <div>
          <br />
          <GridReact
            container
            spacing={10}
            direction="row"
            justify="center"
            alignItems="center"
          >
            <GridReact item>
              <GridReact
                container
                direction="column"
                justify="center"
                alignItems="center"
              >
                <GridReact item>
                  <CheckBoxes setCheckBoxes={setCheckBoxes} />
                </GridReact>

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


              </GridReact>
            </GridReact>
          </GridReact>
        </div>
      )}


                <GridReact item>
                <TextField
                  id="outlined-number"
                  label="Number of Tests"
                  value={numOfTests}
                  onChange={e => {
                    setNumOfTests(+e.target.value);
                  }}
                  type="number"
                  margin="normal"
                />
                </GridReact>
                <GridReact item style={{ padding: 15 }}>
                  {!_.isEmpty(excelRows) && (
                    <Button
                      variant="contained"
                      color="primary"
                      style={{ paddingRight: 10 }}
                      onClick={startTests}
                    >
                      Start Tests
                    </Button>)}
                </GridReact>
                <GridReact item>
                  {showDownloadButton && finalResults.length ? (
                    <DownloadTestsResultsExcel
                      fullData={finalResults}
                      buttonTitle="Download tests results"
                    />
                  ) : null}
                </GridReact>
              </GridReact>
            </GridReact>
          </GridReact>
        </div>
      )}
    </div>
  );
}

