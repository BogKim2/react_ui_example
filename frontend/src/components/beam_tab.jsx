// components/BeamTab.jsx
import React, { useState } from "react";
import {
  Box,
  Grid,
  Slider,
  Button,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Paper,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const Item = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const BeamTab = () => {
  const [values, setValues] = useState({
    gunX: 2048,
    gunY: 2048,
    beamX: 2048,
    beamY: 2048,
    wobble: 30,
    voltage: "5",
    vacuum: 100,
    emission: 0,
  });

  const handleSliderChange = (name) => (event, newValue) => {
    setValues({ ...values, [name]: newValue });
  };

  const handleVoltageChange = (event) => {
    setValues({ ...values, voltage: event.target.value });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Vacuum and High Voltage Section */}
      <Item>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={3}>
            <Typography>Vacuum</Typography>
          </Grid>
          <Grid item xs={9}>
            <LinearProgress
              variant="determinate"
              value={values.vacuum}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Grid>

          <Grid item xs={3}>
            <Typography>High Voltage</Typography>
          </Grid>
          <Grid item xs={4}>
            <FormControl fullWidth>
              <Select
                value={values.voltage}
                onChange={handleVoltageChange}
                size="small"
              >
                {[1, 5, 10, 15, 20, 30].map((v) => (
                  <MenuItem key={v} value={v.toString()}>
                    {v} kV
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Item>

      {/* Gun Alignment Section */}
      <Item>
        <Typography variant="h6" gutterBottom>
          Gun Alignment
        </Typography>
        <Button variant="contained" sx={{ mb: 2 }}>
          Gun Auto
        </Button>
        <Grid container spacing={2}>
          <Grid item xs={3}>
            <Typography>Gun X</Typography>
          </Grid>
          <Grid item xs={7}>
            <Slider
              value={values.gunX}
              onChange={handleSliderChange("gunX")}
              min={0}
              max={4095}
            />
          </Grid>
          <Grid item xs={2}>
            <Typography textAlign="right">{values.gunX}</Typography>
          </Grid>

          <Grid item xs={3}>
            <Typography>Gun Y</Typography>
          </Grid>
          <Grid item xs={7}>
            <Slider
              value={values.gunY}
              onChange={handleSliderChange("gunY")}
              min={0}
              max={4095}
            />
          </Grid>
          <Grid item xs={2}>
            <Typography textAlign="right">{values.gunY}</Typography>
          </Grid>
        </Grid>
      </Item>

      {/* Beam Alignment Section */}
      <Item>
        <Typography variant="h6" gutterBottom>
          Beam Alignment
        </Typography>
        <Button variant="contained" sx={{ mb: 2 }}>
          Beam Auto
        </Button>
        <Grid container spacing={2}>
          <Grid item xs={3}>
            <Typography>Beam X</Typography>
          </Grid>
          <Grid item xs={7}>
            <Slider
              value={values.beamX}
              onChange={handleSliderChange("beamX")}
              min={0}
              max={4095}
            />
          </Grid>
          <Grid item xs={2}>
            <Typography textAlign="right">{values.beamX}</Typography>
          </Grid>

          <Grid item xs={3}>
            <Typography>Beam Y</Typography>
          </Grid>
          <Grid item xs={7}>
            <Slider
              value={values.beamY}
              onChange={handleSliderChange("beamY")}
              min={0}
              max={4095}
            />
          </Grid>
          <Grid item xs={2}>
            <Typography textAlign="right">{values.beamY}</Typography>
          </Grid>
        </Grid>
      </Item>

      {/* Wobble Section */}
      <Item>
        <Typography variant="h6" gutterBottom>
          Wobble
        </Typography>
        <Button variant="contained" sx={{ mb: 2 }}>
          Wobble ON
        </Button>
        <Grid container spacing={2}>
          <Grid item xs={3}>
            <Typography>Wobble</Typography>
          </Grid>
          <Grid item xs={7}>
            <Slider
              value={values.wobble}
              onChange={handleSliderChange("wobble")}
              min={0}
              max={100}
            />
          </Grid>
          <Grid item xs={2}>
            <Typography textAlign="right">{values.wobble}</Typography>
          </Grid>
        </Grid>
      </Item>
    </Box>
  );
};

export default BeamTab;
