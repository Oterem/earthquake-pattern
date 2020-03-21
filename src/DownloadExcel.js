import React, { useEffect, useState } from "react";
import ReactExport from "react-data-export";
import Button from "@material-ui/core/Button";
import * as _ from "lodash";
import moment from "moment";

const ExcelFile = ReactExport.ExcelFile;
const ExcelSheet = ReactExport.ExcelFile.ExcelSheet;

const ExcelColumns = [
  { title: "eventid", width: { wpx: 150 } },
  { title: "date", width: { wpx: 150 } },
  { title: "stime", width: { wpx: 150 } },
  { title: "latitude", width: { wpx: 120 } },
  { title: "longtitude", width: { wpx: 120 } },
  { title: "z", width: { wpx: 100 } },
  { title: "typeF", width: { wpx: 80 } },
  { title: "magF", width: { wpx: 80 } },
  { title: "Id", width: { wpx: 100 } },
  { title: "Name", width: { wpx: 180 } },
  { title: "parentId", width: { wpx: 150 } },
  { title: "distanceFromParent", width: { wpx: 100 } },
  { title: "diffDaysFromParent", width: { wpx: 100 } }
];

export default ({ fullData, buttonTitle, isClustered, isRandom = false }) => {
  const colors = [
    "FFFFFF00",
    "FFCCEEFF",
    "FFF86B00",
    "FF00FF00",
    "FFFF0000",
    "cd6be0"
  ];
  const [multiDataSet, setMultidataSet] = useState([]);

  useEffect(() => {
    const x = [];
    if (isRandom) {
      fullData &&
        fullData.forEach(row => {
          delete row._id;
          const parentRowArray = makeExcelRowArray(row, null);
          x.push(parentRowArray);
        });
    } else {
      const a = _.sortBy(fullData, "parentDate");
      a &&
        a.forEach((cluster, index) => {
          const colorIndex = index % 6;
          /*handle parent*/
          const parent = cluster.parent;
          if(parent){
            delete parent._id;
            delete parent.overridedLatitude;
            delete parent.overridedLongitude;
            parent.parentId = "self";
            parent.diffDays = 0;
            parent.distanceFromParent = 0;
            
          }
          const parentRowArray = makeExcelRowArray(parent || cluster, colors[colorIndex]);
          x.push(parentRowArray);
          /*hadnle children*/
          const children = cluster.children;
          children &&
            children.forEach(child => {
              delete child._id;
              delete child.overridedLatitude;
              delete child.overridedLongitude;
              const childRowArray = makeExcelRowArray(
                child,
                colors[colorIndex]
              );
              x.push(childRowArray);
            });
        });
    }

    multiDataSet.data = [...x];
    setMultidataSet([
      {
        columns: ExcelColumns,
        data: x
      }
    ]);
  }, [fullData]);

  const colTitleToObjKey = {
    eventid:"eventid",
    date:"date",
    stime:"stime",
    latitude:"latitude",
    longtitude:"longtitude",
    z:"z",
    typeF:"typeF",
    magF:"magF",
    Id:"Id",
    Name:"Name",
    parentId:"parentId",
    distanceFromParent:"distanceFromParent",
    diffDaysFromParent:"diffDays"
  }

  const makeExcelRowArray = (obj, color) => {
    const keys = Object.keys(obj);
    const rowArray = [];
    ExcelColumns.forEach(colObj=>{
        const key = colTitleToObjKey[colObj.title];
        const row = {
          value: obj[key],
          style: {
            font: {
              sz: "20"
            }
          }
        };
        if (isClustered) {
          row.style.fill = { fgColor: { rgb: color } };
        }
        if (key === "date") {
          row.value = moment(obj[key]).format("DD/MM/YYYY");
        }
        rowArray.push(row);

    });
    return rowArray;
  };

  return (
    <div>
      <ExcelFile
        element={
          <Button
            variant="contained"
            color="primary"
            style={{ paddingRight: 10 }}
          >
            {buttonTitle}
          </Button>
        }
      >
        <ExcelSheet dataSet={multiDataSet} name="Earth quake pattern" />
      </ExcelFile>
    </div>
  );
};
