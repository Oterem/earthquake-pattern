import * as _ from 'lodash';
import moment from 'moment'
const sleep = require('util').promisify(setTimeout);

let data = {};
let visitedEvents = {};
let fullData = [];



function visited(event){
    return _.has(visitedEvents, event);
}

function diffBetweenDates(date1,date2){
    const d1 = moment(date1);
    const d2 = moment(date2);
    const diff = moment.duration(d1.diff(d2));
    return Math.floor(Math.abs(diff.asDays()));
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

function findEventDirectChildren (event,lat,long,mag,cutOffDays,distance) {
    const maxDate = moment(event.date).add(cutOffDays,'d').toISOString();
    let adjacentYear = fullData.filter(row=>{
        return row.date >= event.date && row.date <= maxDate && row.eventid !== event.eventid
    });
    if(lat || lat==='0'){
        adjacentYear = adjacentYear.filter(obj=>{
            const objLat = Math.abs(obj.latitude);
            const eventLat = Math.abs(event.latitude);
            let parsedLat = +lat;
            const upperBound = eventLat+parsedLat;
            const bottomBound = eventLat-parsedLat;
            if((objLat > eventLat && objLat < upperBound) || (objLat < eventLat && objLat > bottomBound)){
                return true;
            }
            return false;
        })
    }

    if(long || long === '0'){
        adjacentYear = adjacentYear.filter(obj=>{
            const objLong = Math.abs(obj.longtitude);
            const eventLong = Math.abs(event.longtitude);
            const parsedLaongitude = +long;
            const upperBound = eventLong+parsedLaongitude;
            const bottomBound = eventLong-parsedLaongitude;
            return (objLong > eventLong && objLong < upperBound) || (objLong < eventLong && objLong > bottomBound);
        })

    }

    if(mag){
        adjacentYear = adjacentYear.filter(obj=>{
            const objMag = Math.abs(obj.magF);
            const eventMag = Math.abs(event.magF);
            const parsedMag = +mag;
            const maxMagnitude = eventMag+parsedMag;
            const minMagnitude = eventMag-parsedMag;
            return (objMag > eventMag && objMag < maxMagnitude) || (objMag < eventMag && objMag > minMagnitude);
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

export function buildGroups (rows,lat,long,mag,cutOffDays,distance) {
    rows.forEach(row=>{
        delete row.ParentGroup;
        delete row.distanceFromParent;
    });
    fullData = rows;
    visitedEvents = {};

    data = {};
    for (const event of rows) {
        if (visited(event.eventid)) {
            continue;
        }
        let fetchMoreChildren = true;
        let currentEvent = event;
        visitedEvents[event.eventid] = true
        data[event.eventid] = {
            parent: event,
            parentLatitude: event.latitude,
            parentDate: event.date,
            parentMagnitude: event.magF,
            children: []
        }
        while (fetchMoreChildren) {

            const directChildren = findEventDirectChildren(currentEvent,lat,long,mag,cutOffDays,distance);
            if (directChildren.length) {
                const nearestEvent = _.minBy(directChildren, 'date');
                if (nearestEvent) {
                    visitedEvents[nearestEvent.eventid] = true
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
    return final
}

