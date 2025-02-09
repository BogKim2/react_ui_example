import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Slider,
  Button,
  Typography,
  Paper,
  LinearProgress,
  MenuItem,
  Select,
} from "@mui/material";
import "./BeamTab.css";

/**
 * BeamTab
 * - Vacuum, Emission은 1초마다 /api/beam/status에서 GET
 * - Scintillator ON/OFF 상태는 useState 관리 (className으로 빨간색 배경 등)
 * - 기타 HV, Filament, Bias, SpotSize 등은 기존처럼 POST
 * - Gun/Beam/Wobble 슬라이더도 기존처럼 handleSliderChange
 *
 * onLog: 외부에서 로그를 출력하기 위한 함수 (예: WebSocket 로그 등)
 */
const BeamTab = ({ onLog }) => {
  // 1) 상단부 상태
  const [vacuum, setVacuum] = useState(0); // Vacuum %
  const [hvSetting, setHvSetting] = useState("1 kV");
  const [hvReading, setHvReading] = useState(33.14); // 단순 표시용
  const [filament, setFilament] = useState(24); // Filament (%)
  const [bias, setBias] = useState(24); // Bias (%)
  const [emission, setEmission] = useState(0); // Emission (µA)
  const [spotSize, setSpotSize] = useState("1"); // Spot Size 콤보박스
  const [scintillatorOn, setScintillatorOn] = useState(false);

  // 2) 하단 Gun/Beam/Wobble 슬라이더
  const [values, setValues] = useState({
    gunX: 2048,
    gunY: 2048,
    beamX: 2048,
    beamY: 2048,
    wobble: 30,
  });

  // ------------------- Vacuum / Emission 폴링 (1초 간격) -------------------
  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const res = await fetch("/api/beam/status");
        if (!res.ok) throw new Error("Network response was not ok");
        const data = await res.json();
        // data: { vacuum: number, emission: number }
        setVacuum(data.vacuum);
        setEmission(data.emission);
      } catch (error) {
        onLog(`Error fetching beam status: ${error.message}`);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [onLog]);

  // ------------------- 상단부: API 호출들 -------------------

  // (A) High Voltage Setting 변경
  const handleHvChange = async (event) => {
    const newVal = event.target.value;
    setHvSetting(newVal);
    try {
      const response = await fetch("/api/beam/hv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hvSetting: newVal }),
      });
      if (!response.ok) throw new Error("HV setting failed");
      onLog(`HV Setting changed to ${newVal}`);
    } catch (error) {
      onLog(`Error setting HV: ${error.message}`);
    }
  };

  // HV Reading 단순 표시 (UI에서만 사용)
  const handleHvReadingChange = (newReading) => {
    setHvReading(newReading);
    onLog(`HV Reading updated: ${newReading} kV`);
  };

  // (B) Filament
  const handleFilamentSet = async () => {
    try {
      const response = await fetch("/api/beam/filament", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filament }),
      });
      if (!response.ok) throw new Error("Filament set failed");
      onLog(`Filament Set to ${filament}%`);
    } catch (error) {
      onLog(`Error setting Filament: ${error.message}`);
    }
  };

  // (C) Bias
  const handleBiasSet = async () => {
    try {
      const response = await fetch("/api/beam/bias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bias }),
      });
      if (!response.ok) throw new Error("Bias set failed");
      onLog(`Bias Set to ${bias}%`);
    } catch (error) {
      onLog(`Error setting Bias: ${error.message}`);
    }
  };

  // (D) Scintillator ON
  const handleScintOn = async () => {
    try {
      const response = await fetch("/api/beam/scintillator_hv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ on: true }),
      });
      if (!response.ok) throw new Error("Scintillator ON failed");
      setScintillatorOn(true);
      onLog("Scintillator HV ON");
    } catch (error) {
      onLog(`Error: ${error.message}`);
    }
  };

  // (E) Scintillator OFF
  const handleScintOff = async () => {
    try {
      const response = await fetch("/api/beam/scintillator_hv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ on: false }),
      });
      if (!response.ok) throw new Error("Scintillator OFF failed");
      setScintillatorOn(false);
      onLog("Scintillator HV OFF");
    } catch (error) {
      onLog(`Error: ${error.message}`);
    }
  };

  // Filament Time Reset
  const handleReset = async () => {
    try {
      const response = await fetch("/api/beam/filament_time_reset", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Reset filament time failed");
      onLog("Filament Time Reset to 0");
    } catch (error) {
      onLog(`Error: ${error.message}`);
    }
  };

  // (F) Spot Size
  const handleSpotSizeChange = async (event) => {
    const newVal = event.target.value;
    setSpotSize(newVal);
    onLog(`Spot Size changed to ${newVal}`);
    try {
      const response = await fetch("/api/beam/spot_size", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotSize: Number(newVal) }),
      });
      if (!response.ok) throw new Error("Spot size set failed");
    } catch (error) {
      onLog(`Error setting Spot Size: ${error.message}`);
    }
  };

  // ------------------- 하단 Gun/Beam/Wobble -------------------

  // 슬라이더 변경
  const handleSliderChange = async (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    try {
      const response = await fetch("/api/beam/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, value }),
      });
      if (!response.ok) throw new Error("Network response was not ok");
    } catch (error) {
      onLog(`Error: Failed to update ${name} - ${error.message}`);
    }
  };

  // Auto 버튼 (Gun/Beam/Wobble)
  const handleAutoClick = async (type) => {
    try {
      const response = await fetch(`/api/beam/auto/${type}`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Network response was not ok");
      onLog(`${type} Auto initiated`);
    } catch (error) {
      onLog(`Error: Failed to execute ${type} Auto - ${error.message}`);
    }
  };

  // 마우스 휠로 슬라이더 제어 (altKey시 x10)
  const handleWheel = (name, event) => {
    event.preventDefault();
    const baseStep = 1;
    const step = event.altKey ? baseStep * 10 : baseStep;
    const currentValue = values[name];
    const newValue =
      event.deltaY < 0 ? currentValue + step : currentValue - step;
    const maxValue = name === "wobble" ? 100 : 4095;
    const clampedValue = Math.min(Math.max(newValue, 0), maxValue);
    handleSliderChange(name, clampedValue);
  };

  return (
    <Box className="beam-tab-container">
      {/* -------- 상단부 (Vacuum, HV Setting, Filament, Bias, Emission 등) -------- */}
      <Paper className="beam-tab-item">
        {/* Vacuum */}
        <Grid container spacing={1} alignItems="center">
          <Grid item xs={2}>
            <Typography>Vacuum</Typography>
          </Grid>
          <Grid item xs={10}>
            <LinearProgress variant="determinate" value={vacuum} />
            <Typography align="right" style={{ marginTop: "-16px" }}>
              {vacuum.toFixed(1)}%
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper className="beam-tab-item">
        {/* High Voltage Setting */}
        <Grid container spacing={1} alignItems="center">
          <Grid item xs={4}>
            <Typography>High Voltage Setting</Typography>
          </Grid>
          <Grid item xs={3}>
            <Select
              value={hvSetting}
              onChange={handleHvChange}
              size="small"
              style={{ width: "100%" }}
            >
              {["1 kV", "5 kV", "10 kV", "15 kV", "20 kV", "30 kV"].map(
                (item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                )
              )}
            </Select>
          </Grid>
          <Grid item xs={2}>
            <Typography>Reading</Typography>
          </Grid>
          <Grid item xs={2}>
            <Paper
              style={{ padding: "4px", textAlign: "center", minWidth: "40px" }}
            >
              <Typography>{hvReading.toFixed(2)}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={1}>
            <Typography>kV</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper className="beam-tab-item">
        {/* Filament */}
        <Grid container spacing={1} alignItems="center">
          <Grid item xs={2}>
            <Typography>Filament</Typography>
          </Grid>
          <Grid item xs={6}>
            <LinearProgress variant="determinate" value={filament} />
            <Typography
              align="right"
              style={{ marginTop: "-16px", fontSize: "0.75rem" }}
            >
              {filament}%
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Button
              variant="contained"
              size="small"
              style={{ marginLeft: "4px" }}
              onClick={handleFilamentSet}
            >
              Set
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper className="beam-tab-item">
        {/* Bias */}
        <Grid container spacing={1} alignItems="center">
          <Grid item xs={2}>
            <Typography>Bias</Typography>
          </Grid>
          <Grid item xs={6}>
            <LinearProgress variant="determinate" value={bias} />
            <Typography
              align="right"
              style={{ marginTop: "-16px", fontSize: "0.75rem" }}
            >
              {bias}%
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Button
              variant="contained"
              size="small"
              style={{ marginLeft: "4px" }}
              onClick={handleBiasSet}
            >
              Set
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper className="beam-tab-item">
        {/* Emission */}
        <Grid container spacing={1} alignItems="center">
          <Grid item xs={2}>
            <Typography>Emission</Typography>
          </Grid>
          <Grid item xs={10}>
            <Typography>{emission.toFixed(1)} µA</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper className="beam-tab-item">
        {/* Scintillator HV (2줄 배치) */}
        <Grid container spacing={1} alignItems="center">
          {/* 첫 줄: ON/OFF */}
          <Grid item>
            <Typography>Scintillator HV</Typography>
          </Grid>
          <Grid item>
            {/* ON 버튼 */}
            <Button
              variant="contained"
              size="small"
              onClick={handleScintOn}
              className={
                scintillatorOn ? "scintillator-on" : "scintillator-off"
              }
            >
              ON
            </Button>
          </Grid>
          <Grid item>
            {/* OFF 버튼 */}
            <Button
              variant="contained"
              size="small"
              onClick={handleScintOff}
              className={
                scintillatorOn ? "scintillator-off" : "scintillator-on"
              }
            >
              OFF
            </Button>
          </Grid>

          {/* 줄바꿈 */}
          <Grid item xs={12} />

          {/* 둘째 줄: Filament Time */}
          <Grid item>
            <Typography>Filament Time</Typography>
          </Grid>
          <Grid item>
            <Button variant="contained" size="small" onClick={handleReset}>
              Reset
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper className="beam-tab-item">
        {/* Spot Size */}
        <Grid container spacing={1} alignItems="center">
          <Grid item xs={3}>
            <Typography>Spot Size</Typography>
          </Grid>
          <Grid item xs={9}>
            <Select
              value={spotSize}
              onChange={handleSpotSizeChange}
              size="small"
              style={{ width: "100px" }}
            >
              {["1", "3", "5", "7", "9", "11", "13", "15"].map((val) => (
                <MenuItem key={val} value={val}>
                  {val}
                </MenuItem>
              ))}
            </Select>
          </Grid>
        </Grid>
      </Paper>

      {/* -------------------------- 아래쪽 (Gun/Beam/Wobble) -------------------------- */}
      <Paper className="beam-tab-item">
        {/* Gun Alignment */}
        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
          Gun Alignment
        </Typography>
        <Button
          className="beam-tab-gun-button"
          variant="contained"
          size="small"
          sx={{ mb: 0.5 }}
          onClick={() => handleAutoClick("Gun")}
        >
          Gun Auto
        </Button>
        <Grid container spacing={0.5} alignItems="center">
          <Grid item xs={3}>
            <Typography>Gun X</Typography>
          </Grid>
          <Grid item xs={7}>
            <Slider
              className="beam-tab-gun-slider"
              value={values.gunX}
              onChange={(_, value) => handleSliderChange("gunX", value)}
              onWheel={(e) => handleWheel("gunX", e)}
              min={0}
              max={4095}
            />
          </Grid>
          <Grid item xs={2}>
            <Typography align="right">{values.gunX}</Typography>
          </Grid>

          <Grid item xs={3}>
            <Typography>Gun Y</Typography>
          </Grid>
          <Grid item xs={7}>
            <Slider
              className="beam-tab-gun-slider"
              value={values.gunY}
              onChange={(_, value) => handleSliderChange("gunY", value)}
              onWheel={(e) => handleWheel("gunY", e)}
              min={0}
              max={4095}
            />
          </Grid>
          <Grid item xs={2}>
            <Typography align="right">{values.gunY}</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper className="beam-tab-item">
        {/* Beam Alignment */}
        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
          Beam Alignment
        </Typography>
        <Button
          className="beam-tab-beam-button"
          variant="contained"
          size="small"
          sx={{ mb: 0.5 }}
          onClick={() => handleAutoClick("Beam")}
        >
          Beam Auto
        </Button>
        <Grid container spacing={0.5} alignItems="center">
          <Grid item xs={3}>
            <Typography>Beam X</Typography>
          </Grid>
          <Grid item xs={7}>
            <Slider
              className="beam-tab-beam-slider"
              value={values.beamX}
              onChange={(_, value) => handleSliderChange("beamX", value)}
              onWheel={(e) => handleWheel("beamX", e)}
              min={0}
              max={4095}
            />
          </Grid>
          <Grid item xs={2}>
            <Typography align="right">{values.beamX}</Typography>
          </Grid>

          <Grid item xs={3}>
            <Typography>Beam Y</Typography>
          </Grid>
          <Grid item xs={7}>
            <Slider
              className="beam-tab-beam-slider"
              value={values.beamY}
              onChange={(_, value) => handleSliderChange("beamY", value)}
              onWheel={(e) => handleWheel("beamY", e)}
              min={0}
              max={4095}
            />
          </Grid>
          <Grid item xs={2}>
            <Typography align="right">{values.beamY}</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper className="beam-tab-item">
        {/* Wobble */}
        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
          Wobble
        </Typography>
        <Button
          className="beam-tab-wobble-button"
          variant="contained"
          size="small"
          sx={{ mb: 0.5 }}
          onClick={() => handleAutoClick("Wobble")}
        >
          Wobble ON
        </Button>
        <Grid container spacing={0.5} alignItems="center">
          <Grid item xs={3}>
            <Typography>Wobble</Typography>
          </Grid>
          <Grid item xs={7}>
            <Slider
              className="beam-tab-wobble-slider"
              value={values.wobble}
              onChange={(_, value) => handleSliderChange("wobble", value)}
              onWheel={(e) => handleWheel("wobble", e)}
              min={0}
              max={100}
            />
          </Grid>
          <Grid item xs={2}>
            <Typography align="right">{values.wobble}</Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default BeamTab;
