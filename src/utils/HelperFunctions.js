import * as _ from 'lodash';
import moment from 'moment'

let data = {};
let visitedEvents = {};
let fullData = [];

let visitedChildren = {};
let childrenData = []; 

function findAfterShocks({currentEvent, cutOffDays,distance, visitedEvents, fullData}){
    const maxDate = moment(currentEvent.date).add(cutOffDays,'d').toISOString();
    const afterShocks = fullData && fullData.filter(obj=>{
        return !visited(obj.eventid) && !visitedEvents[obj.eventid].visited;
    }).filter(row=>{
        return row.date >= currentEvent.date && row.date <= maxDate && row.eventid !== currentEvent.eventid
    }).filter(row=>{
        const dist = getDistanceFromLatLonInKm(currentEvent.latitude, currentEvent.longtitude, row.latitude, row.longtitude);
        if(dist <= distance){
            visitedEvents[row.eventid] = {
                ...visitedEvents[row.eventid],
                visited:true
            }
            return true;
        }
        return false;
    })
    return afterShocks;
}

export function filterAfterShocks({rows, cutOffDays,distance}){
    visitedEvents = {};
    rows.forEach(row=>{
        delete row.ParentGroup;
        delete row.distanceFromParent;
        visitedEvents[row.eventid] = {
            visited:false,
            taken:false
        }
    });
    fullData = rows;


    const eventWithoutAfterShocks = [];
    for (const event of rows) {
        
        if (visited(event.eventid) || visitedEvents[event.eventid].visited) {
            continue;
        }
        visitedEvents[event.eventid] = {...visitedEvents[event.eventid],visited:true}
        let currentEvent = event;
        const afterShocks = findAfterShocks({currentEvent,cutOffDays,distance,visitedEvents,fullData});
        const combined = [currentEvent,...afterShocks];
        const highestMag = _.maxBy(combined, 'magF');
        visitedEvents[highestMag.eventid] = {...visitedEvents[highestMag.eventid], taken:true}
        eventWithoutAfterShocks.push(highestMag);
    }
    return {eventWithoutAfterShocks,visitedEvents}
}

export function buildGroups (rows,lat,long,mag,cutOffDays,distance,overrideObj,cutoffDaysDirection) {
    visitedEvents = {};
    rows.forEach(row=>{
        delete row.ParentGroup;
        delete row.distanceFromParent;
        visitedEvents[row.eventid] = {
            visited:false,
            taken:false
        }
    });
    fullData = rows;


    data = {};
    for (const event of rows) {
        visitedEvents[event.eventid] = {...visitedEvents[event.eventid],visited:true}
        if (visited(event.eventid)) {
            continue;
        }
        let fetchMoreChildren = true;
        let currentEvent = event;
        while (fetchMoreChildren) {
            const directChildren = findEventDirectChildren(currentEvent,lat,long,mag,cutOffDays,distance,overrideObj,cutoffDaysDirection,visitedEvents);
            if (directChildren.length) {
                if(!_.has(data,event.eventid)){
                    data[event.eventid] = {
                        parent: event,
                        parentLatitude: event.latitude,
                        parentDate: event.date,
                        parentMagnitude: event.magF,
                        children: []
                    }
                }
                visitedEvents[event.eventid] = {...visitedEvents[event.eventid],taken:true}
                const nearestEvent = _.minBy(directChildren, 'date');
                if (nearestEvent) {
                    visitedEvents[nearestEvent.eventid] = {...visitedEvents[nearestEvent.eventid],taken : true}
                    nearestEvent.parentId = currentEvent.eventid
                    nearestEvent.distanceFromParent = getDistanceFromLatLonInKm(currentEvent.latitude, currentEvent.longtitude, nearestEvent.latitude, nearestEvent.longtitude);
                    nearestEvent.diffDays = diffBetweenDates(currentEvent.date, nearestEvent.date);
                    data[event.eventid].children.push(nearestEvent);
                    currentEvent = nearestEvent;
                } else {
                    fetchMoreChildren = false;
                }
            } else {
                fetchMoreChildren = false;
            }
        }


    }
    const z = Object.keys(data);
    const final = [];
    z.forEach(key => {
        const a = data[key];
        // if (a.children.length) {
            final.push(a);
        // }
    });
    return {final,visitedEvents}
}

function findEventDirectChildren (event,lat,long,mag,cutOffDays,distance,overrideObj,cutoffDaysDirection=1,visitedEvents) {
    const a = visitedEvents;
    const boundedDate = cutoffDaysDirection ? moment(event.date).add(cutOffDays,'d').toISOString() : moment(event.date).subtract(cutOffDays,'d').toISOString();
    let adjacentYear = fullData.filter(row=>{
        if(!cutoffDaysDirection){ //direction down
            return row.date <= event.date && row.date >= boundedDate && row.eventid !== event.eventid
        }//direction up
        return row.date >= event.date && row.date <= boundedDate && row.eventid !== event.eventid
    });
    if(overrideObj.isOverride && overrideObj.overrideLatitude){
        let combinedLat
        if(event.latitude >=0){
            combinedLat = event.latitude + overrideObj.overrideLatitude;
        } else {
            combinedLat = event.latitude - overrideObj.overrideLatitude;
        }
        Object.assign(event,{overridedLatitude:combinedLat});
        if(combinedLat<-62){
            const diff = Math.abs(combinedLat+62);
            Object.assign(event,{overridedLatitude:62-diff});
        } else if(combinedLat > 62){
            const diff = combinedLat - 62;
            Object.assign(event,{overridedLatitude:-62+diff});
        }

    }
    if(overrideObj.isOverride && overrideObj.overrideLongitude){
        let combinedLong;
        if(event.latitude >=0){
            combinedLong = event.longtitude + overrideObj.overrideLongitude;
        } else {
            combinedLong = event.longtitude - overrideObj.overrideLongitude;
        }
        Object.assign(event,{overridedLongitude:combinedLong});
        if(combinedLong<-180){
            const diff = Math.abs(combinedLong+180);
            Object.assign(event,{overridedLongitude:180-diff});
        } else if(combinedLong > 180){
            const diff = combinedLong - 180;
            Object.assign(event,{overridedLongitude:-180+diff});
        }

    }
    if(lat || lat==='0'){
        adjacentYear = adjacentYear.filter(obj=>{

            const objLat = Math.abs(obj.latitude);
            const eventLat = Math.abs(event.overridedLatitude ||event.latitude);
            let parsedLat = +lat;
            const upperBound = eventLat+parsedLat;
            const bottomBound = eventLat-parsedLat;
            return (objLat >= eventLat && objLat <= upperBound) || (objLat <= eventLat && objLat >= bottomBound);

        })
    }

    if(long || long === '0'){
        adjacentYear = adjacentYear.filter(obj=>{
            const objLong = Math.abs(obj.longtitude);
            const eventLong = Math.abs(event.overridedLongitude || event.longtitude);
            const parsedLaongitude = +long;
            const upperBound = eventLong+parsedLaongitude;
            const bottomBound = eventLong-parsedLaongitude;
            return (objLong >= eventLong && objLong <= upperBound) || (objLong <= eventLong && objLong >= bottomBound);
        })

    }

    if(mag){
        adjacentYear = adjacentYear.filter(obj=>{
            const objMag = Math.abs(obj.magF);
            const eventMag = Math.abs(event.magF);
            const parsedMag = +mag;
            const maxMagnitude = eventMag+parsedMag;
            const minMagnitude = eventMag-parsedMag;
            return (objMag >= eventMag && objMag <= maxMagnitude) || (objMag <= eventMag && objMag >= minMagnitude);
        })
    }

    if(distance){
        adjacentYear = adjacentYear.filter(obj=>{
            const dist = getDistanceFromLatLonInKm(event.latitude, event.longtitude, obj.latitude, obj.longtitude);
            const parsedDistance = +dist;
            return parsedDistance > distance;
        });
    }

    return adjacentYear.filter(obj=>{
        return !visited(obj.eventid);
    })
}

function findParentChildren (event,lat,long,mag,cutOffDays,distance,overrideObj,cutoffDaysDirection=1,visitedEvents) {
  const a = visitedEvents;
  const boundedDate = cutoffDaysDirection ? moment(event.date).add(cutOffDays,'d').toISOString() : moment(event.date).subtract(cutOffDays,'d').toISOString();
  let adjacentYear = childrenData.filter(row=>{
      if(!cutoffDaysDirection){ //direction down
          return row.date <= event.date && row.date >= boundedDate && row.eventid !== event.eventid
      }//direction up
      return row.date >= event.date && row.date <= boundedDate && row.eventid !== event.eventid
  });
  if(overrideObj.isOverride && overrideObj.overrideLatitude){
      let combinedLat
      if(event.latitude >=0){
          combinedLat = event.latitude + overrideObj.overrideLatitude;
      } else {
          combinedLat = event.latitude - overrideObj.overrideLatitude;
      }
      Object.assign(event,{overridedLatitude:combinedLat});
      if(combinedLat<-62){
          const diff = Math.abs(combinedLat+62);
          Object.assign(event,{overridedLatitude:62-diff});
      } else if(combinedLat > 62){
          const diff = combinedLat - 62;
          Object.assign(event,{overridedLatitude:-62+diff});
      }

  }
  if(overrideObj.isOverride && overrideObj.overrideLongitude){
      let combinedLong;
      if(event.latitude >=0){
          combinedLong = event.longtitude + overrideObj.overrideLongitude;
      } else {
          combinedLong = event.longtitude - overrideObj.overrideLongitude;
      }
      Object.assign(event,{overridedLongitude:combinedLong});
      if(combinedLong<-180){
          const diff = Math.abs(combinedLong+180);
          Object.assign(event,{overridedLongitude:180-diff});
      } else if(combinedLong > 180){
          const diff = combinedLong - 180;
          Object.assign(event,{overridedLongitude:-180+diff});
      }

  }
  if(lat || lat==='0'){
      adjacentYear = adjacentYear.filter(obj=>{

          const objLat = Math.abs(obj.latitude);
          const eventLat = Math.abs(event.overridedLatitude ||event.latitude);
          let parsedLat = +lat;
          const upperBound = eventLat+parsedLat;
          const bottomBound = eventLat-parsedLat;
          return (objLat >= eventLat && objLat <= upperBound) || (objLat <= eventLat && objLat >= bottomBound);

      })
  }

  if(long || long === '0'){
      adjacentYear = adjacentYear.filter(obj=>{
          const objLong = Math.abs(obj.longtitude);
          const eventLong = Math.abs(event.overridedLongitude || event.longtitude);
          const parsedLaongitude = +long;
          const upperBound = eventLong+parsedLaongitude;
          const bottomBound = eventLong-parsedLaongitude;
          return (objLong >= eventLong && objLong <= upperBound) || (objLong <= eventLong && objLong >= bottomBound);
      })

  }

  if(mag){
      adjacentYear = adjacentYear.filter(obj=>{
          const objMag = Math.abs(obj.magF);
          const eventMag = Math.abs(event.magF);
          const parsedMag = +mag;
          const maxMagnitude = eventMag+parsedMag;
          const minMagnitude = eventMag-parsedMag;
          return (objMag >= eventMag && objMag <= maxMagnitude) || (objMag <= eventMag && objMag >= minMagnitude);
      })
  }

  if(distance){
      adjacentYear = adjacentYear.filter(obj=>{
          const dist = getDistanceFromLatLonInKm(event.latitude, event.longtitude, obj.latitude, obj.longtitude);
          const parsedDistance = +dist;
          return parsedDistance > distance;
      });
  }

  return adjacentYear.filter(obj=>{
      return !visitedChild(obj.eventid);
  })
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2-lat1);  // deg2rad below
  const dLon = deg2rad(lon2-lon1);
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // Distance in km
  return +(d.toFixed());
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}



const visited = (eventid)=>{
    return visitedEvents[eventid].taken === true
}

const visitedChild = (eventid)=>{
  return visitedChildren[eventid].taken === true
}

function diffBetweenDates(date1,date2){
    const d1 = moment(date1);
    const d2 = moment(date2);
    const diff = moment.duration(d1.diff(d2));
    return Math.floor(Math.abs(diff.asDays()));
}

export function fisherYatesShuffle (array){
    for (let i = array.length - 1; i > 0; i--) {
          let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i

          // swap elements array[i] and array[j]
          // we use "destructuring assignment" syntax to achieve that
          // you'll find more details about that syntax in later chapters
          // same can be written as:
          // let t = array[i]; array[i] = array[j]; array[j] = t
          [array[i], array[j]] = [array[j], array[i]];
        }
    return array;
  }

export function excelDateToIsoString(excelDate){
    if(typeof excelDate === 'string'){
      const a = moment(excelDate, ["DD-MM-YYYY","MM-DD-YYYY"]);
      if(a.isValid()){
        return a.toISOString();
      } else{
        return false;
      }

    } else {
      const b = new Date(Math.round((excelDate - (25567 + 2))*86400)*1000).toISOString();
      return b
    }
  }

export function excelDateToJSDate(excel){
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

export function validateExcel(rows,dataRowOffset){
    let errorMsg = "";
    const ids = [];
    rows &&
      rows.forEach((row, index) => {
        const currentRow = index + dataRowOffset;
        ids.push(row[0]);
        for (let i = 0; i < 10; i++) {
          if (row[i] === undefined) {
            debugger
            errorMsg += "check row " +currentRow + "\n";
            console.error(`row error: ${row}`)
            break;
          }
        }
      });
    const duplicate = _(ids).groupBy().pickBy(x => x.length > 1).keys().value();
    if(duplicate && duplicate.length){
        errorMsg += "found "+ duplicate.length+" duplicate event ids: " +duplicate.toString() + "\n";
    }
    if (errorMsg) {
      return {
        valid: false,
        msg: errorMsg
      };
    } else {
      return {
        valid: true,
        msg: null
      };
    }
  };


  export function matchGroups (parents,lat,long,mag,cutOffDays,distance,overrideObj,cutoffDaysDirection, children) {

    visitedEvents = {};
    visitedChildren = {};
    parents.forEach(row=>{
        delete row.ParentGroup;
        delete row.distanceFromParent;
        visitedEvents[row.eventid] = {
            visited:false,
            taken:false
        }
    });
    children.forEach(row=>{
      delete row.ParentGroup;
      delete row.distanceFromParent;
      visitedChildren[row.eventid] = {
          visited:false,
          taken:false
      }
  });
    childrenData = children;



    data = {};
    for (const event of parents) {
        visitedEvents[event.eventid] = {...visitedEvents[event.eventid],visited:true}
        const directChildren = findParentChildren(event,lat,long,mag,cutOffDays,distance,overrideObj,cutoffDaysDirection,visitedChildren);
        if(directChildren.length){
          if(!_.has(data,event.eventid)){
            data[event.eventid] = {
                parent: event,
                parentLatitude: event.latitude,
                parentDate: event.date,
                parentMagnitude: event.magF,
                children: []
            }
        }
          const nearestEvent = _.minBy(directChildren, 'date');
          if(nearestEvent){
            visitedEvents[event.eventid] = {...visitedEvents[event.eventid],taken:true}
            visitedChildren[nearestEvent.eventid] = {...visitedChildren[nearestEvent.eventid], taken: true};
            nearestEvent.parentId = event.eventid;
            nearestEvent.distanceFromParent = getDistanceFromLatLonInKm(event.latitude, event.longtitude, nearestEvent.latitude, nearestEvent.longtitude);
            nearestEvent.diffDays = diffBetweenDates(event.date, nearestEvent.date);
            data[event.eventid].children.push(nearestEvent);

          }
        }

    }
    const z = Object.keys(data);
    const final = [];
    z.forEach(key => {
        const a = data[key];
        // if (a.children.length) {
            final.push(a);
        // }
    });
    return {final,visitedEvents, visitedChildren}
}