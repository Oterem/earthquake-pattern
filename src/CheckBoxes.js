import React, { useEffect } from "react";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";

export default function CheckboxLabels({ setCheckBoxes }) {
  const [state, setState] = React.useState({
    date: false,
    latitude: false,
    longtitude: false,
    z: false,
    typeF: false,
    magF: false
  });

  const handleChange = name => event => {
    setState({ ...state, [name]: event.target.checked });
  };

  useEffect(() => {
    setCheckBoxes({ ...state });
  }, [state]);

  return (
    <FormGroup row>
      <FormControlLabel
        control={
          <Checkbox
            checked={state.date}
            onChange={handleChange("date")}
            value="checkedDate"
            color="primary"
          />
        }
        label="Date"
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={state.latitude}
            onChange={handleChange("latitude")}
            value="latitude"
            color="primary"
          />
        }
        label="Latitude"
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={state.longtitude}
            onChange={handleChange("longtitude")}
            value="longtitude"
            color="primary"
          />
        }
        label="Longitude"
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={state.z}
            onChange={handleChange("z")}
            value="z"
            color="primary"
          />
        }
        label="z"
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={state.typeF}
            onChange={handleChange("typeF")}
            value="typeF"
            color="primary"
          />
        }
        label="typeF"
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={state.magF}
            onChange={handleChange("magF")}
            value="magF"
            color="primary"
          />
        }
        label="magF"
      />
    </FormGroup>
  );
}
