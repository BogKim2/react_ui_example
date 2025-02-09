import { useState, useEffect, useCallback } from "react";
import { ReflexContainer, ReflexSplitter, ReflexElement } from "react-reflex";
import { Tabs, Tab, Box } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import "react-reflex/styles.css";
import BeamTab from "./components/BeamTab";
import ImageTab from "./components/ImageTab";
import "./App.css";

/**
 * MUI 기본 테마 설정
 */
const theme = createTheme({
  components: {
    MuiTypography: {
      styleOverrides: {
        root: {
          fontSize: "0.875rem",
        },
        h6: {
          fontSize: "1rem",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontSize: "0.8rem",
          padding: "4px 8px",
        },
      },
    },
  },
});

/**
 * 탭 패널 구성 (MUI Tabs)
 */
function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ height: "100%" }}>
      {value === index && <Box sx={{ height: "100%" }}>{children}</Box>}
    </div>
  );
}

function App() {
  const [logs, setLogs] = useState([]);
  const [ws, setWs] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  // 예시: ImageTab에 사용할 상태
  const [imageValues, setImageValues] = useState({
    coarseFocus: 2048,
    fineFocus: 2048,
    stigX: 2048,
    stigY: 2048,
    contrast: 2048,
    brightness: 2048,
    shiftX: 0,
    shiftY: 0,
    rotation: 0,
  });

  // WebSocket 연결 함수
  const connectWebSocket = useCallback(() => {
    const websocket = new WebSocket("ws://localhost:8081/ws");

    websocket.onopen = () => {
      console.log("WebSocket Connected");
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      console.log("WebSocket message received:", event.data);
      // 최신 로그가 상단에 오도록 앞에 추가
      setLogs((prevLogs) => [event.data, ...prevLogs]);

      // 로그 패널 자동 스크롤 (아래로)
      const logArea = document.querySelector(".log-area");
      if (logArea) {
        logArea.scrollTop = logArea.scrollHeight;
      }
    };

    websocket.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };

    websocket.onclose = () => {
      console.log("WebSocket Disconnected");
      setWs(null);
      // 재연결 시도
      setTimeout(() => {
        connectWebSocket();
      }, 3000);
    };

    return websocket;
  }, []);

  // 컴포넌트 마운트 시 WebSocket 연결
  useEffect(() => {
    const websocket = connectWebSocket();
    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, [connectWebSocket]);

  /**
   * 로그 추가 함수
   */
  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    const formattedMessage = `[${timestamp}] ${message}`;
    // 상단에 추가
    setLogs((prevLogs) => [formattedMessage, ...prevLogs]);

    // WebSocket 전송
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    } else {
      console.log("WebSocket is not connected. Attempting to reconnect...");
      connectWebSocket();
    }
  };

  /**
   * 탭 변경 핸들러
   */
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  /**
   * 이미지 컨트롤(슬라이더) 값 변경 (POST)
   */
  const handleImageControl = async (name, value) => {
    // 내부 상태 갱신
    setImageValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    // 서버에 POST
    try {
      const response = await fetch("/api/image/control", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, value }),
      });
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
    } catch (error) {
      addLog(`Error: Failed to update ${name} - ${error.message}`);
    }
  };

  /**
   * 이미지 탭 Auto 기능 (예: /api/image/auto/Focus)
   */
  const handleImageAuto = async (type) => {
    try {
      const response = await fetch(`/api/image/auto/${type}`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
    } catch (error) {
      addLog(`Error: Failed to execute ${type} Auto - ${error.message}`);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <div className="app-container">
        <ReflexContainer orientation="horizontal">
          {/* 상단 영역 */}
          <ReflexElement>
            <ReflexContainer orientation="vertical">
              {/* Left Panel */}
              <ReflexElement minSize={200}>
                <div className="pane-content">
                  <label>Left Panel (Reserved)</label>
                </div>
              </ReflexElement>

              <ReflexSplitter />

              {/* 중앙(탭) Panel */}
              <ReflexElement minSize={400} maxSize={600} size={400}>
                <Box
                  sx={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* 탭 영역 */}
                  <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <Tabs
                      value={tabValue}
                      onChange={handleTabChange}
                      variant="scrollable"
                      scrollButtons="auto"
                      sx={{ minHeight: 36 }}
                    >
                      <Tab label="IMAGE" sx={{ minHeight: 36 }} />
                      <Tab label="BEAM" sx={{ minHeight: 36 }} />
                      <Tab label="Stage" sx={{ minHeight: 36 }} />
                      <Tab label="BSE" sx={{ minHeight: 36 }} />
                      <Tab label="Stat1" sx={{ minHeight: 36 }} />
                    </Tabs>
                  </Box>

                  {/* 탭 패널 */}
                  <Box sx={{ flexGrow: 1, overflow: "auto" }}>
                    <TabPanel value={tabValue} index={0}>
                      {/* ImageTab */}
                      <ImageTab
                        values={imageValues}
                        onControlChange={handleImageControl}
                        onAutoClick={handleImageAuto}
                      />
                    </TabPanel>
                    <TabPanel value={tabValue} index={1}>
                      {/* BeamTab */}
                      <BeamTab onLog={addLog} />
                    </TabPanel>
                    {/* 나머지 탭들은 필요 시 추가 */}
                  </Box>
                </Box>
              </ReflexElement>
            </ReflexContainer>
          </ReflexElement>

          <ReflexSplitter />

          {/* 우측 Log Panel */}
          <ReflexElement minSize={100} maxSize={200}>
            <div className="pane-content log-content">
              <label>Log Panel</label>
              <div className="log-area">
                {logs.map((log, index) => (
                  <div key={index} className="log-entry">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </ReflexElement>
        </ReflexContainer>
      </div>
    </ThemeProvider>
  );
}

export default App;
