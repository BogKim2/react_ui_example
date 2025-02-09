import time
import threading
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from datetime import datetime
import asyncio

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite 기본 포트
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================
# WebSocket 관리
# =====================
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(f"[WS-Message] {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# =====================
# 데이터 모델 정의
# =====================
class ImageControl(BaseModel):
    coarseFocus: float = 2048
    fineFocus: float = 2048
    stigX: float = 2048
    stigY: float = 2048
    contrast: float = 2048
    brightness: float = 2048
    # 필요시 shiftX, shiftY, rotation 등 추가

class BeamControl(BaseModel):
    """
    vacuum / emission = 실시간(0~100) 오르내리는 값
    gunX, gunY, beamX, beamY, wobble = 하단 슬라이더
    hvSetting, filament, bias, etc = 상단 설정값들
    """
    # 1) 실시간으로 바뀌는 값(백그라운드 스레드)
    vacuum: float = 0.0      # 0~100
    emission: float = 0.0    # 0~100 µA

    # 2) High Voltage, Filament, Bias, SpotSize 등
    hvSetting: str = "1 kV"
    filament: float = 24
    bias: float = 24
    scintillatorHV: bool = False
    filamentTime: float = 0
    spotSize: int = 1        # 1,3,5,7,9,11,13,15 등

    # 3) Gun/Beam/Wobble 슬라이더
    gunX: float = 2048
    gunY: float = 2048
    beamX: float = 2048
    beamY: float = 2048
    wobble: float = 30

# 공통 컨트롤 모델
class ControlValue(BaseModel):
    name: str
    value: float

# HV/Bias/Filament 설정 모델
class HVSetting(BaseModel):
    hvSetting: str

class FilamentSetting(BaseModel):
    filament: float

class BiasSetting(BaseModel):
    bias: float

# Scintillator ON/OFF
class ScintillatorState(BaseModel):
    on: bool  # True -> ON, False -> OFF

# SpotSize
class SpotSizeSetting(BaseModel):
    spotSize: int

# =====================
# 현재 상태 (전역)
# =====================
current_state = {
    "image": ImageControl(),
    "beam": BeamControl()
}

# =====================
# 백그라운드 스레드: vacuum / emission 값을 0→100→0 반복
# =====================
def vacuum_emission_loop():
    while True:
        # 오르막 (0 -> 100) 약 5초
        for i in range(101):
            current_state["beam"].vacuum = i
            current_state["beam"].emission = i
            time.sleep(0.05)  # 100단계 × 0.05s = 5초

        # 내리막 (100 -> 0) 약 5초
        for i in range(100, -1, -1):
            current_state["beam"].vacuum = i
            current_state["beam"].emission = i
            time.sleep(0.05)

# =====================
# 이미지 제어 관련 API
# =====================
@app.post("/api/image/control")
async def update_image_control(control: ControlValue):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    message = f"Image Control: {control.name} set to {control.value}"

    if hasattr(current_state["image"], control.name):
        setattr(current_state["image"], control.name, control.value)

    await manager.broadcast(f"[{timestamp}] {message}")
    return {"status": "success", "message": message}

@app.post("/api/image/auto/{function}")
async def image_auto_function(function: str):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    message = f"Image Auto function initiated: {function}"
    await manager.broadcast(f"[{timestamp}] {message}")
    return {"status": "success", "message": message}

# =====================
# 빔 제어 (BeamTab) API
# =====================
@app.post("/api/beam/control")
async def update_beam_control(control: ControlValue):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    message = f"Beam Control: {control.name} set to {control.value}"

    if hasattr(current_state["beam"], control.name):
        setattr(current_state["beam"], control.name, control.value)

    await manager.broadcast(f"[{timestamp}] {message}")
    return {"status": "success", "message": message}

@app.post("/api/beam/auto/{function}")
async def beam_auto_function(function: str):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    message = f"Beam Auto function initiated: {function}"
    await manager.broadcast(f"[{timestamp}] {message}")
    return {"status": "success", "message": message}

# ---------------------
# HV, Filament, Bias, Scintillator, SpotSize
# ---------------------
@app.post("/api/beam/hv")
async def set_beam_hv(hv: HVSetting):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    current_state["beam"].hvSetting = hv.hvSetting

    message = f"[set_beam_hv] hvSetting={hv.hvSetting}"
    await manager.broadcast(f"[{timestamp}] {message}")

    return {"message": "HV setting updated successfully"}

@app.post("/api/beam/filament")
async def set_beam_filament(filament_data: FilamentSetting):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    current_state["beam"].filament = filament_data.filament

    message = f"[set_beam_filament] filament={filament_data.filament}%"
    await manager.broadcast(f"[{timestamp}] {message}")

    return {"message": "Filament updated successfully"}

@app.post("/api/beam/bias")
async def set_beam_bias(bias_data: BiasSetting):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    current_state["beam"].bias = bias_data.bias

    message = f"[set_beam_bias] bias={bias_data.bias}%"
    await manager.broadcast(f"[{timestamp}] {message}")

    return {"message": "Bias updated successfully"}

@app.post("/api/beam/scintillator_hv")
async def set_scintillator_hv(state: ScintillatorState):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    current_state["beam"].scintillatorHV = state.on

    status_text = "ON" if state.on else "OFF"
    message = f"Scintillator HV set to {status_text}"
    await manager.broadcast(f"[{timestamp}] {message}")

    return {"message": message}

@app.post("/api/beam/filament_time_reset")
async def filament_time_reset():
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    current_state["beam"].filamentTime = 0

    message = "Filament Time Reset to 0"
    await manager.broadcast(f"[{timestamp}] {message}")

    return {"message": message}

@app.post("/api/beam/spot_size")
async def set_spot_size(spot: SpotSizeSetting):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    current_state["beam"].spotSize = spot.spotSize

    message = f"Spot Size changed to {spot.spotSize}"
    await manager.broadcast(f"[{timestamp}] {message}")

    return {"message": message}

# =====================
# 현재 상태 조회
# =====================
@app.get("/api/state")
async def get_current_state():
    """
    전체 상태 반환 (image, beam)
    """
    return {
        "image": current_state["image"],
        "beam": current_state["beam"]
    }

@app.get("/api/beam/status")
def get_beam_status():
    """
    Vacuum / Emission 값만 따로 반환 (리액트 폴링)
    """
    return {
        "vacuum": current_state["beam"].vacuum,
        "emission": current_state["beam"].emission
    }

# =====================
# 메인 실행 (스레드 시작 + uvicorn)
# =====================
if __name__ == "__main__":
    import uvicorn

    # 서버 시작 전, 스레드로 vacuum_emission_loop 구동
    t = threading.Thread(target=vacuum_emission_loop, daemon=True)
    t.start()

    uvicorn.run(app, host="0.0.0.0", port=8081)
import time
import threading
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from datetime import datetime
import asyncio

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite 기본 포트
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================
# WebSocket 관리
# =====================
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(f"[WS-Message] {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# =====================
# 데이터 모델 정의
# =====================
class ImageControl(BaseModel):
    coarseFocus: float = 2048
    fineFocus: float = 2048
    stigX: float = 2048
    stigY: float = 2048
    contrast: float = 2048
    brightness: float = 2048
    # 필요시 shiftX, shiftY, rotation 등 추가

class BeamControl(BaseModel):
    """
    vacuum / emission = 실시간(0~100) 오르내리는 값
    gunX, gunY, beamX, beamY, wobble = 하단 슬라이더
    hvSetting, filament, bias, etc = 상단 설정값들
    """
    # 1) 실시간으로 바뀌는 값(백그라운드 스레드)
    vacuum: float = 0.0      # 0~100
    emission: float = 0.0    # 0~100 µA

    # 2) High Voltage, Filament, Bias, SpotSize 등
    hvSetting: str = "1 kV"
    filament: float = 24
    bias: float = 24
    scintillatorHV: bool = False
    filamentTime: float = 0
    spotSize: int = 1        # 1,3,5,7,9,11,13,15 등

    # 3) Gun/Beam/Wobble 슬라이더
    gunX: float = 2048
    gunY: float = 2048
    beamX: float = 2048
    beamY: float = 2048
    wobble: float = 30

# 공통 컨트롤 모델
class ControlValue(BaseModel):
    name: str
    value: float

# HV/Bias/Filament 설정 모델
class HVSetting(BaseModel):
    hvSetting: str

class FilamentSetting(BaseModel):
    filament: float

class BiasSetting(BaseModel):
    bias: float

# Scintillator ON/OFF
class ScintillatorState(BaseModel):
    on: bool  # True -> ON, False -> OFF

# SpotSize
class SpotSizeSetting(BaseModel):
    spotSize: int

# =====================
# 현재 상태 (전역)
# =====================
current_state = {
    "image": ImageControl(),
    "beam": BeamControl()
}

# =====================
# 백그라운드 스레드: vacuum / emission 값을 0→100→0 반복
# =====================
def vacuum_emission_loop():
    while True:
        # 오르막 (0 -> 100) 약 5초
        for i in range(101):
            current_state["beam"].vacuum = i
            current_state["beam"].emission = i
            time.sleep(0.05)  # 100단계 × 0.05s = 5초

        # 내리막 (100 -> 0) 약 5초
        for i in range(100, -1, -1):
            current_state["beam"].vacuum = i
            current_state["beam"].emission = i
            time.sleep(0.05)

# =====================
# 이미지 제어 관련 API
# =====================
@app.post("/api/image/control")
async def update_image_control(control: ControlValue):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    message = f"Image Control: {control.name} set to {control.value}"

    if hasattr(current_state["image"], control.name):
        setattr(current_state["image"], control.name, control.value)

    await manager.broadcast(f"[{timestamp}] {message}")
    return {"status": "success", "message": message}

@app.post("/api/image/auto/{function}")
async def image_auto_function(function: str):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    message = f"Image Auto function initiated: {function}"
    await manager.broadcast(f"[{timestamp}] {message}")
    return {"status": "success", "message": message}

# =====================
# 빔 제어 (BeamTab) API
# =====================
@app.post("/api/beam/control")
async def update_beam_control(control: ControlValue):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    message = f"Beam Control: {control.name} set to {control.value}"

    if hasattr(current_state["beam"], control.name):
        setattr(current_state["beam"], control.name, control.value)

    await manager.broadcast(f"[{timestamp}] {message}")
    return {"status": "success", "message": message}

@app.post("/api/beam/auto/{function}")
async def beam_auto_function(function: str):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    message = f"Beam Auto function initiated: {function}"
    await manager.broadcast(f"[{timestamp}] {message}")
    return {"status": "success", "message": message}

# ---------------------
# HV, Filament, Bias, Scintillator, SpotSize
# ---------------------
@app.post("/api/beam/hv")
async def set_beam_hv(hv: HVSetting):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    current_state["beam"].hvSetting = hv.hvSetting

    message = f"[set_beam_hv] hvSetting={hv.hvSetting}"
    await manager.broadcast(f"[{timestamp}] {message}")

    return {"message": "HV setting updated successfully"}

@app.post("/api/beam/filament")
async def set_beam_filament(filament_data: FilamentSetting):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    current_state["beam"].filament = filament_data.filament

    message = f"[set_beam_filament] filament={filament_data.filament}%"
    await manager.broadcast(f"[{timestamp}] {message}")

    return {"message": "Filament updated successfully"}

@app.post("/api/beam/bias")
async def set_beam_bias(bias_data: BiasSetting):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    current_state["beam"].bias = bias_data.bias

    message = f"[set_beam_bias] bias={bias_data.bias}%"
    await manager.broadcast(f"[{timestamp}] {message}")

    return {"message": "Bias updated successfully"}

@app.post("/api/beam/scintillator_hv")
async def set_scintillator_hv(state: ScintillatorState):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    current_state["beam"].scintillatorHV = state.on

    status_text = "ON" if state.on else "OFF"
    message = f"Scintillator HV set to {status_text}"
    await manager.broadcast(f"[{timestamp}] {message}")

    return {"message": message}

@app.post("/api/beam/filament_time_reset")
async def filament_time_reset():
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    current_state["beam"].filamentTime = 0

    message = "Filament Time Reset to 0"
    await manager.broadcast(f"[{timestamp}] {message}")

    return {"message": message}

@app.post("/api/beam/spot_size")
async def set_spot_size(spot: SpotSizeSetting):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    current_state["beam"].spotSize = spot.spotSize

    message = f"Spot Size changed to {spot.spotSize}"
    await manager.broadcast(f"[{timestamp}] {message}")

    return {"message": message}

# =====================
# 현재 상태 조회
# =====================
@app.get("/api/state")
async def get_current_state():
    """
    전체 상태 반환 (image, beam)
    """
    return {
        "image": current_state["image"],
        "beam": current_state["beam"]
    }

@app.get("/api/beam/status")
def get_beam_status():
    """
    Vacuum / Emission 값만 따로 반환 (리액트 폴링)
    """
    return {
        "vacuum": current_state["beam"].vacuum,
        "emission": current_state["beam"].emission
    }

# =====================
# 메인 실행 (스레드 시작 + uvicorn)
# =====================
if __name__ == "__main__":
    import uvicorn

    # 서버 시작 전, 스레드로 vacuum_emission_loop 구동
    t = threading.Thread(target=vacuum_emission_loop, daemon=True)
    t.start()

    uvicorn.run(app, host="0.0.0.0", port=8081)
