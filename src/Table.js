import React, { useEffect, useState } from 'react'
import Paper from '@material-ui/core/Paper';
import Card from '@material-ui/core/Card';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import Typography from '@material-ui/core/Typography';
import GridReact from '@material-ui/core/Grid';
import LoadingOverlay from 'react-loading-overlay';
import {OutTable, ExcelRenderer} from 'react-excel-renderer';
import DownloadExcel from './DownloadExcel';
import moment from 'moment';
import * as _ from 'lodash';
import { buildGroups } from './data/MakeGroups';



export default () => {
  const columns = [
    { name: 'eventid', title: 'Event ID' },
    { name: 'date', title: 'Date'},
    { name: 'stime', title: 'stime' },
    { name: 'latitude', title: 'Lat'},
    { name: 'longtitude', title: 'Long'},
    { name: 'z', title: 'z'},
    { name: 'typeF', title: 'typeF'},
    { name: 'magF', title: 'magF'},
    { name: 'Id', title: 'Id'},
    { name: 'parentId', title: 'Parent ID'},
    { name: 'Name', title: 'Name'},
    { name: 'distanceFromParent', title: 'Km From Parent'}
  ];
  const [totalSummaryItems] = useState([
      { columnName: 'eventid', type: 'count' },
    ]);
    const [treeSummaryItems] = useState([
      { columnName: 'eventid', type: 'count' },
    ]);

  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [magnitude, setMagnitude] = useState("");
  const [cutOffDays, setCutOffDays] = useState(365);
  const [distanceThreshold, setDistanceThreshold] = useState(350);
  const [showStatistics, setShowStatistics] = useState(false);
  const [defaultHiddenColumnNames] = useState(['distanceFromParent']);
  const [excelRows, setExcelRows] = useState([]);
  const [rawData, setRawData] = useState([]);
  const [showClustersFilters, setShowClustersFilters] = useState(false);
  const fileInput = React.createRef();
  const [loading, setLoading] = useState(false);
  const [clusteredData, setClusteredData] = useState([]);
  const [numOfClusters, setNumOfClusters] = useState(0);
  const [loadMessage, setLoadMessage] = useState('Loading...');
  const [totalRows, setTotalRows] = useState(0);
  const [clusteredRows, setClusteredRows] = useState(0);
  const [unclusteredRows, setUnclusteredRows] = useState(0);
  const [unclusteredEvents, setUnclusteredEvents] = useState([]);
  const [dataRowOffset, setDataRowOffset] = useState(2);


  function makeGroups () {
    if(!latitude && !longitude){
      alert('Insert at least one of: latitue or longitude');
      return;
    }
    setLoadMessage('Building clusters...');
    setLoading(true);
    setTimeout(async ()=>{
      await a([...excelRows], latitude, longitude, magnitude, cutOffDays, distanceThreshold);
      setShowStatistics(true);
      setLoading(false);
    },50)
    const a = (arrayOfDate, latitude, longitude, magnitude, cutOffDays, distanceThreshold) =>{
          return new Promise(resolve => {
            const groups = buildGroups(arrayOfDate, latitude, longitude, magnitude, cutOffDays, distanceThreshold);
            const clustered = groups.filter(obj=>obj.children.length);
            setClusteredData([...clustered]);
            const unclustered = groups.filter(obj=>!obj.children.length);
            let counter=0;
            clustered.forEach(row=>{
              counter += 1+row.children.length;
            });
            setUnclusteredEvents(unclustered);
            setClusteredRows(counter);
            setUnclusteredRows(totalRows-counter);
            setNumOfClusters(clustered.length);
            resolve();
          })
        }
  }

  function formatGroup (data) {
    const rows = [];
    let countClustered = 0;
    setNumOfClusters(data.length);
    data.forEach(group=>{
      countClustered += 1+group.children.length;
      const parent = group.parent;
      parent.ParentGroup = 0;
      rows.push(parent);
      group.children.reverse();
      group.children && group.children.forEach(child=>{
        child.ParentGroup = parent.eventid;
        rows.push(child);
      })
    });

    return rows;
  }

  const excelDateToIsoString = (excelDate)=>{
    if(typeof excelDate === 'string'){
      const a = moment(excelDate, ["DD-MM-YYYY","MM-DD-YYYY"]).toISOString()
      return a;
    } else {
      const b = new Date(Math.round((excelDate - (25567 + 2))*86400)*1000).toISOString();
      return b
    }
  }




  const fileHandler = (event) => {
    setLoadMessage('Importing file...');
    setLoading(true);
    let fileObj = event.target.files[0];

    //just pass the fileObj as parameter
    ExcelRenderer(fileObj, (err, resp) => {
      if(err){
        console.log(err);
      }
      else{
        setNumOfClusters(0);
        setShowClustersFilters(true);
        setShowStatistics(false);
        resp.rows.splice(0,dataRowOffset-1);
        setTotalRows(resp.rows.length);
        const validRows = resp.rows.filter(row=>{
          return _.isArray(row) && !_.isEmpty(row);
        })
        const transformedData = validRows.map(row=>{
          const excelTime = excelDateToJSDate(row[2]);
          const newDate = excelDateToIsoString(row[1]);
          const dateWithTime = moment(newDate).add(excelTime.hour,'h').add(excelTime.minute, 'm').toISOString();
          return{
            ParentGroup:0,
            eventid:row[0],
            date:dateWithTime,
            stime:`${excelTime.hour}:${excelTime.minute}:00`,
            latitude:row[3],
            longtitude:row[4],
            z:row[5],
            typeF:row[6],
            magF:row[7],
            Id:row[8],
            Name:row[9],
            _id:row[8],
          }
        });
        const excelRowsArray = validRows.map(row=>{
          const excelTime = excelDateToJSDate(row[2]);
          const newDate = excelDateToIsoString(row[1]);
          const dateWithTime = moment(newDate).add(excelTime.hour,'h').add(excelTime.minute, 'm').toISOString();
          return{
            eventid:row[0],
            date:dateWithTime,
            stime:`${excelTime.hour}:${excelTime.minute}:00`,
            latitude:row[3],
            longtitude:row[4],
            z:row[5],
            typeF:row[6],
            magF:row[7],
            Id:row[8],
            Name:row[9],
            _id:row[8],
            }
        })
        setRawData([...transformedData]);
        setExcelRows([...excelRowsArray]);
      }
      setLoading(false);

    });

  }



  function excelDateToJSDate(excel){
    let basenumber;
    if(typeof excel !== 'string'){
      basenumber = (excel*24);
    } else {
      const split = excel.split(":");
      return {hour:split[0],minute:split[1]};
    }

      let hour = Math.floor(basenumber).toString();
      if (hour.length < 2) {
          hour = '0'+hour;
      }

      let minute = Math.round((basenumber % 1)*60).toString();
      if (minute.length < 2) {
       minute = '0'+minute;
      }
    return {hour, minute};
  }




  return (
      <LoadingOverlay
        active={loading}
        spinner
        text={loadMessage}
        >
      <Paper>
        <div>
          <TextField
                                    id="outlined-number"
                                    label="Data starts in row"
                                    value={dataRowOffset}
                                    onChange={(e)=>{setDataRowOffset(+e.target.value)}}
                                    type="number"
                                    margin="normal"
                            />
          <input type="file" onChange={fileHandler} ref={fileInput} onClick={(event)=> { event.target.value = null }} style={{"padding":"40px", height:70}} />

        </div>


        <br/>
        <br/>
        {/*{excelRows.length ? <Button variant="contained" color="primary" disabled={!rawData.length} onClick={()=>{*/}
        {/*  setShowClustersFilters(true);*/}
        {/*  setNumOfClusters(0);*/}
        {/*}} >Make Clusters</Button>:null}*/}
        {!_.isEmpty(excelRows) && <div>
          <TextField
                  id="outlined-number"
                  label="Latitude"
                  value={latitude}
                  onChange={(e)=>{setLatitude(e.target.value)}}
                  type="number"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">+ -</InputAdornment>,
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  margin="normal"
                  variant="outlined"
          />
          <TextField
                  id="outlined-number"
                  label="Longitude"
                  value={longitude}
                  onChange={(e)=>{setLongitude(e.target.value)}}
                  type="number"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">+ -</InputAdornment>,
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  margin="normal"
                  variant="outlined"
          />
          <TextField
                  id="outlined-number"
                  label="Distance threshold(Km)"
                  value={distanceThreshold}
                  onChange={(e)=>{setDistanceThreshold(e.target.value)}}
                  type="number"
                  // className={classes.textField}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  margin="normal"
                  variant="outlined"
          />
          <TextField
                  id="outlined-number"
                  label="Magnitude"
                  value={magnitude}
                  onChange={(e)=>{setMagnitude(e.target.value)}}
                  type="number"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">+ -</InputAdornment>,
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  margin="normal"
                  variant="outlined"
          />
          <TextField
                  id="outlined-number"
                  label="Cut Off Days"
                  value={cutOffDays}
                  onChange={(e)=>{setCutOffDays(e.target.value)}}
                  type="number"
                  // className={classes.textField}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  margin="normal"
                  variant="outlined"
          />
          <br/>
          <GridReact container spacing={1} direction="row"
            justify="center"
            alignItems="center">
            <GridReact item >
              <Button variant="contained" color="primary" style={{paddingRight:10}}  onClick={makeGroups} >GO</Button>
            </GridReact>
            <GridReact item >
              {numOfClusters ? <DownloadExcel fullData={clusteredData} isClustered={true} buttonTitle={'Clustered events as excel'}/> : null}
            </GridReact>
            <GridReact item >
              {numOfClusters ? <DownloadExcel fullData={unclusteredEvents} isClustered={false} buttonTitle={'UnClustered events as excel'}/> : null}
            </GridReact>
          </GridReact>
        </div>}
        {showStatistics &&  <div style={{paddingTop:30}}>
            {numOfClusters ? <Typography variant="body2" >Total events: {totalRows}</Typography> : null}
            {numOfClusters ? <Typography variant="body2" >Clustered events: {clusteredRows} ({Math.floor(clusteredRows*100/totalRows)})%</Typography> : null}
          {numOfClusters ? <Typography variant="body2" >Unclustered events: {unclusteredRows}</Typography> : null}
          {numOfClusters ? <Typography variant="body2" >Total Clusters: {numOfClusters}</Typography> : null}
        </div>}

    </Paper>

      </LoadingOverlay>
  );
};
