import React, { useEffect } from 'react'
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField'

export default function OverrideSwitch({setIsOverride,setOverrideLatitudeParent,setOverrideLongitudeParent}) {
  const [override, setOverride] = React.useState(false);
  const [overridedLatitude, setOverridedLatitude] = React.useState(0);
  const [overridedLongitude, setOverridedLongitude] = React.useState(0);


  useEffect(()=>{
      setIsOverride(override)
  },[override]);

    useEffect(()=>{
        setOverrideLatitudeParent(overridedLatitude)
  },[overridedLatitude]);

    useEffect(()=>{
        setOverrideLongitudeParent(overridedLongitude)
  },[overridedLongitude]);


  const handleChange = name => event => {
      setOverride(event.target.checked);
  };

  return (
      <>
      <FormControlLabel
        control={
          <Switch checked={override} onChange={handleChange('checkedA')} value="checkedA" />
        }
        label="Override values"
      />
          <Grid container   justify="center" spacing={3}
                alignItems="center">
              <Grid item xs={12} sm={2}>
                  <TextField
                    disabled={!override}
                    id="outlined-disabled"
                    label="Override Latitude"
                    variant="outlined"
                    type="number"
                    value={overridedLatitude}
                    onChange={e => {
                        setOverridedLatitude(e.target.value);
                    }}
                  />
              </Grid>
              <Grid item xs={12} sm={2}>
                  <TextField
                      disabled={!override}
                      id="outlined-disabled"
                      label="Override Longitue"
                      variant="outlined"
                      type="number"
                      value={overridedLongitude}
                      onChange={e => {
                          setOverridedLongitude(e.target.value);
                      }}
                  />
              </Grid>
          </Grid>
      </>
  );
}
