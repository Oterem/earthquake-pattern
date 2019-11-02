import React, { useContext, useEffect, useState } from "react";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import GridReact from "@material-ui/core/Grid";
import { ExcelRenderer } from "react-excel-renderer";
import DownloadExcel from "./DownloadExcel";
import moment from "moment";
import * as _ from "lodash";
import {
  fisherYatesShuffle,
  excelDateToIsoString,
  excelDateToJSDate
} from "./utils/HelperFunctions";
import { MyContext } from "./utils/AppContext";
import CheckBoxes from "./CheckBoxes";

export default ({ checks }) => {
  const store = useContext(MyContext.Context);
  const [excelRows, setExcelRows] = useState([]);
  const fileInput = React.createRef();
  const [loading, setLoading] = useState(false);
  const [dataRowOffset, setDataRowOffset] = useState(2);
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

  useEffect(() => {
    store.loading.set(loading);
  }, [loading]);

  async function shuffleData() {
      setShowDownloadButton(false);
    store.loading.setLoadingText("Shuffling Data...");
    setLoading(true);
    setShuffledData([]);
    const propertyToShuffle = [];
    const arrayHolder = {};
    const shuffledProps = Object.keys(markedCheckBoxes);
    for (const prop of shuffledProps) {
      if (markedCheckBoxes[prop] === true) {
        propertyToShuffle.push(prop);
      }
    }
    propertyToShuffle &&
      propertyToShuffle.forEach(property => {
        const arrayOfProperties =
          excelRows && excelRows.map(item => item[property]);
        arrayHolder[property] = fisherYatesShuffle([...arrayOfProperties]);
      });
    /* If need to shuffle */
    const shuffledKeys = Object.keys(arrayHolder);
    if (shuffledKeys.length) {
      setShuffledData(
        excelRows.map((row, index) => {
          const partialObj = {};
          shuffledKeys.forEach(key => {
            partialObj[key] = arrayHolder[key][index];
          });
          return { ...row, ...partialObj };
        })
      );
    }
    setTimeout(() => {
        setShowDownloadButton(true);
      setLoading(false);
    }, 2000);
  }

  const validateExcel = rows => {
    let errorMsg = "";
    rows &&
      rows.forEach((row, index) => {
        const isMissing = row.includes(undefined);
        const currentRow = index + dataRowOffset;
        for (let i = 0; i < 10; i++) {
          if (row[i] === undefined) {
            errorMsg += `check row ${currentRow}`;
            break;
          }
        }
      });
    if (errorMsg) {
      return {
        valid: false,
        msg: errorMsg
      };
    }
    return {
      valid: true,
      msg: null
    };
  };

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
        const { valid, msg } = validateExcel(validRows);
        if (!valid) {
          setLoading(false);
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
                <GridReact item style={{ padding: 15 }}>
                  {!_.isEmpty(excelRows) && (
                    <Button
                      variant="contained"
                      color="primary"
                      style={{ paddingRight: 10 }}
                      onClick={shuffleData}
                    >
                      Start shuffle data
                    </Button>
                  )}
                </GridReact>
                <GridReact item>
                  {showDownloadButton && shuffledData.length ? (
                    <DownloadExcel
                      fullData={shuffledData}
                      isClustered={false}
                      isRandom
                      buttonTitle="Download shuffled data"
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
};
