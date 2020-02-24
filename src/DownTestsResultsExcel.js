import React, { useEffect, useState } from "react";
import ReactExport from "react-data-export";
import Button from "@material-ui/core/Button";
import * as _ from "lodash";
import moment from "moment";

const ExcelFile = ReactExport.ExcelFile;
const ExcelSheet = ReactExport.ExcelFile.ExcelSheet;

export default ({ fullData, buttonTitle}) => {
  const [multiDataSet, setMultidataSet] = useState([]);

  const makeExcelRowArray = (obj, maxMinValues) => {
    const keys = Object.keys(obj);
    const rowArray = [];
    debugger
    for (const key of keys) {
      const row = {
        value: obj[key],
        style: {
          font: {
            sz: "20"
          }
        }
      };
      if(key === 'numberOfParents'){
        if(maxMinValues.maxNumberOfParents === obj.id){
            row.style.fill = { fgColor: { rgb: '00FF00' } };
          }
          if(maxMinValues.minNumberOfParents === obj.id){
            row.style.fill = { fgColor: { rgb: 'FF0000' } };
          }
      } else if(key === 'unclusteredEvents'){
        if(maxMinValues.maxUnclusteredEvents === obj.id){
            row.style.fill = { fgColor: { rgb: '00FF00' } };
          }
          if(maxMinValues.minUnclusteredEvents === obj.id){
            row.style.fill = { fgColor: { rgb: 'FF0000' } };
          }
      } else if(key === 'numberOfChildren'){
        if(maxMinValues.maxNumberOfChildren === obj.id){
            row.style.fill = { fgColor: { rgb: '00FF00' } };
          }
          if(maxMinValues.minNumberOfChildren === obj.id){
            row.style.fill = { fgColor: { rgb: 'FF0000' } };
          }
      }



      rowArray.push(row);
    }
    return rowArray;
  };

  const findMaxMinValues = (fullData) =>{
      const obj = {};
      const maxNumberOfParents = _.maxBy(fullData, 'numberOfParents');
      if(maxNumberOfParents){
          obj.maxNumberOfParents = maxNumberOfParents.id
      }

      const minNumberOfParents = _.minBy(fullData, 'numberOfParents');
      if(minNumberOfParents){
          obj.minNumberOfParents = minNumberOfParents.id
      }

      const maxUnclusteredEvents = _.maxBy(fullData, 'unclusteredEvents');
      if(maxUnclusteredEvents){
          obj.maxUnclusteredEvents = maxUnclusteredEvents.id
      }

      const minUnclusteredEvents = _.minBy(fullData, 'unclusteredEvents');
      if(minUnclusteredEvents){
          obj.minUnclusteredEvents = minUnclusteredEvents.id
      }

      const maxNumberOfChildren = _.maxBy(fullData, 'numberOfChildren');
      if(maxNumberOfChildren){
          obj.maxNumberOfChildren = maxNumberOfChildren.id
      }

      const minNumberOfChildren = _.minBy(fullData, 'numberOfChildren');
      if(minNumberOfChildren){
          obj.minNumberOfChildren = minNumberOfChildren.id
      }

      return obj;
  }

  useEffect(() => {
      debugger
    const values = [];
    const maxMinValues = findMaxMinValues(fullData);
    fullData && fullData.forEach(obj=>{
        const row = makeExcelRowArray(obj,maxMinValues);
        values.push(row)
    })

    setMultidataSet([
      {
        columns: [
            { title: "Test Id", width: { wpx: 150 } },
            { title: "Total Rows", width: { wpx: 150 } },
            { title: "Number Of Parents", width: { wpx: 150 } },
            { title: "Number Of UnClustered", width: { wpx: 150 } },
            { title: "Number Of Children", width: { wpx: 150 } },
        ],
        data: values
      }
    ]);
  }, [fullData]);


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
