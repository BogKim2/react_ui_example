import React from "react";
import { Box, Grid, Slider, Button, Typography, Paper } from "@mui/material";
import "./ImageTab.css";

const ImageTab = ({ values, onControlChange, onAutoClick }) => {
  // altKey 눌림 여부에 따라 변화량을 10배 또는 1배로 조정하는 핸들러
  const handleWheel = (name, e, min, max) => {
    e.preventDefault();
    const step = e.altKey ? 10 : 1;
    let newValue = values[name];
    // deltaY < 0이면 스크롤 올릴 때 값 증가, deltaY > 0이면 감소
    if (e.deltaY < 0) {
      newValue += step;
    } else {
      newValue -= step;
    }
    if (newValue > max) newValue = max;
    if (newValue < min) newValue = min;
    onControlChange(name, newValue);
  };

  return (
    <Box className="image-tab-container">
      {/* All Auto 그룹 */}
      <Paper className="image-tab-item">
        <Typography
          variant="subtitle1"
          className="image-tab-typography"
          style={{ fontWeight: "bold" }}
        >
          All Auto Control
        </Typography>
        <Button
          className="image-tab-all-button"
          variant="contained"
          size="small"
          style={{ marginBottom: "4px" }}
          onClick={() => onAutoClick("allauto")}
        >
          All auto
        </Button>
      </Paper>

      {/* Focus Control 그룹 */}
      <Paper className="image-tab-item">
        <Typography
          variant="subtitle1"
          className="image-tab-typography"
          style={{ fontWeight: "bold" }}
        >
          Focus Control
        </Typography>
        <Button
          className="image-tab-focus-button"
          variant="contained"
          size="small"
          style={{ marginBottom: "4px" }}
          onClick={() => onAutoClick("Focus")}
        >
          Focus Auto
        </Button>
        <Grid container spacing={1} alignItems="center">
          <Grid item xs={3}>
            <Typography className="image-tab-typography">Coarse</Typography>
          </Grid>
          <Grid item xs={7}>
            <Slider
              className="image-tab-focus-slider"
              value={values.coarseFocus}
              onChange={(_, value) => onControlChange("coarseFocus", value)}
              onWheel={(e) => handleWheel("coarseFocus", e, 0, 4095)}
              min={0}
              max={4095}
            />
          </Grid>
          <Grid item xs={2}>
            <Typography className="image-tab-typography" align="right">
              {values.coarseFocus}
            </Typography>
          </Grid>

          <Grid item xs={3}>
            <Typography className="image-tab-typography">Fine</Typography>
          </Grid>
          <Grid item xs={7}>
            <Slider
              className="image-tab-focus-slider"
              value={values.fineFocus}
              onChange={(_, value) => onControlChange("fineFocus", value)}
              onWheel={(e) => handleWheel("fineFocus", e, 0, 4095)}
              min={0}
              max={4095}
            />
          </Grid>
          <Grid item xs={2}>
            <Typography className="image-tab-typography" align="right">
              {values.fineFocus}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Stigmator 그룹 */}
      <Paper className="image-tab-item">
        <Typography
          variant="subtitle1"
          className="image-tab-typography"
          style={{ fontWeight: "bold" }}
        >
          Stigmator
        </Typography>
        <Button
          className="image-tab-stigmator-button"
          variant="contained"
          size="small"
          style={{ marginBottom: "4px" }}
          onClick={() => onAutoClick("Stigmator")}
        >
          Stig Auto
        </Button>
        <Grid container spacing={1} alignItems="center">
          <Grid item xs={3}>
            <Typography className="image-tab-typography">Stig X</Typography>
          </Grid>
          <Grid item xs={7}>
            <Slider
              className="image-tab-stigmator-slider"
              value={values.stigX}
              onChange={(_, value) => onControlChange("stigX", value)}
              onWheel={(e) => handleWheel("stigX", e, 0, 4095)}
              min={0}
              max={4095}
            />
          </Grid>
          <Grid item xs={2}>
            <Typography className="image-tab-typography" align="right">
              {values.stigX}
            </Typography>
          </Grid>

          <Grid item xs={3}>
            <Typography className="image-tab-typography">Stig Y</Typography>
          </Grid>
          <Grid item xs={7}>
            <Slider
              className="image-tab-stigmator-slider"
              value={values.stigY}
              onChange={(_, value) => onControlChange("stigY", value)}
              onWheel={(e) => handleWheel("stigY", e, 0, 4095)}
              min={0}
              max={4095}
            />
          </Grid>
          <Grid item xs={2}>
            <Typography className="image-tab-typography" align="right">
              {values.stigY}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Contrast & Brightness 그룹 */}
      <Paper className="image-tab-item">
        <Typography
          variant="subtitle1"
          className="image-tab-typography"
          style={{ fontWeight: "bold" }}
        >
          Contrast & Brightness
        </Typography>
        <Button
          className="image-tab-cb-button"
          variant="contained"
          size="small"
          style={{ marginBottom: "4px" }}
          onClick={() => onAutoClick("ContrastBrightness")}
        >
          Auto BC
        </Button>
        <Grid container spacing={1} alignItems="center">
          <Grid item xs={3}>
            <Typography className="image-tab-typography">Contrast</Typography>
          </Grid>
          <Grid item xs={7}>
            <Slider
              className="image-tab-cb-slider"
              value={values.contrast}
              onChange={(_, value) => onControlChange("contrast", value)}
              onWheel={(e) => handleWheel("contrast", e, 0, 4095)}
              min={0}
              max={4095}
            />
          </Grid>
          <Grid item xs={2}>
            <Typography className="image-tab-typography" align="right">
              {values.contrast}
            </Typography>
          </Grid>

          <Grid item xs={3}>
            <Typography className="image-tab-typography">Bright</Typography>
          </Grid>
          <Grid item xs={7}>
            <Slider
              className="image-tab-cb-slider"
              value={values.brightness}
              onChange={(_, value) => onControlChange("brightness", value)}
              onWheel={(e) => handleWheel("brightness", e, 0, 4095)}
              min={0}
              max={4095}
            />
          </Grid>
          <Grid item xs={2}>
            <Typography className="image-tab-typography" align="right">
              {values.brightness}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Image Shift 그룹 */}
      <Paper className="image-tab-item">
        <Typography
          variant="subtitle1"
          className="image-tab-typography"
          style={{ fontWeight: "bold" }}
        >
          Image Shift
        </Typography>
        <Grid container spacing={1} alignItems="center">
          <Grid item xs={3}>
            <Typography className="image-tab-typography">Shift X</Typography>
          </Grid>
          <Grid item xs={7}>
            <Slider
              className="image-tab-shift-slider"
              value={values.shiftX}
              onChange={(_, value) => onControlChange("shiftX", value)}
              onWheel={(e) => handleWheel("shiftX", e, -500, 500)}
              min={-500}
              max={500}
            />
          </Grid>
          <Grid item xs={2}>
            <Typography className="image-tab-typography" align="right">
              {values.shiftX}
            </Typography>
          </Grid>

          <Grid item xs={3}>
            <Typography className="image-tab-typography">Shift Y</Typography>
          </Grid>
          <Grid item xs={7}>
            <Slider
              className="image-tab-shift-slider"
              value={values.shiftY}
              onChange={(_, value) => onControlChange("shiftY", value)}
              onWheel={(e) => handleWheel("shiftY", e, -500, 500)}
              min={-500}
              max={500}
            />
          </Grid>
          <Grid item xs={2}>
            <Typography className="image-tab-typography" align="right">
              {values.shiftY}
            </Typography>
          </Grid>

          <Grid item xs={3}>
            <Typography className="image-tab-typography">Rotation</Typography>
          </Grid>
          <Grid item xs={7}>
            <Slider
              className="image-tab-shift-slider"
              value={values.rotation}
              onChange={(_, value) => onControlChange("rotation", value)}
              onWheel={(e) => handleWheel("rotation", e, 0, 360)}
              min={0}
              max={360}
            />
          </Grid>
          <Grid item xs={2}>
            <Typography className="image-tab-typography" align="right">
              {values.rotation}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default ImageTab;
