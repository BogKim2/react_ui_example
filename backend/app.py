from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from datetime import datetime

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite 기본 포트
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------
# WebSocket 연결 관리
# ---------------------
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

# ---------------------
# 데이터 모델
# ---------------------
class ImageControl(BaseModel):
    coarseFocus: float = 2048
    fineFocus: float = 2048
    stigX: float = 2048
    stigY: float = 2048
    contrast: float = 2048
    brightness: float = 2048
    # 추가로 shiftX, shiftY, rotation 등을 사용한다면 여기에도 정의

class BeamControl(BaseModel):
    gunX: float = 2048
    gunY: float = 2048
    beamX: float = 2048
    beamY: float = 2048
    wobble: float = 30
    # 새로 추가한 항목들
    hvSetting: str = "1 kV"     # High Voltage Setting
    filament: float = 24       # Filament(%) 값
    bias: float = 24           # Bias(%) 값
    emission: float = 0        # Emission 값(µA 등)
    scintillatorHV: bool = False   # ON/OFF 상태
    filamentTime: float = 0       # Filament 경과시간 등
    spotSize: int = 1             # Spot Size (1,3,5,7,9,11,13,15 중 택1)

# 모델용 (공통 컨트롤 값)
class ControlValue(BaseModel):
    name: str
    value: float

# HV/Bias/Filament 등 세부 설정용
class HVSetting(BaseModel):
    hvSetting: str

class FilamentSetting(BaseModel):
    filament: float

class BiasSetting(BaseModel):
    bias: float

# Scintillator HV ON/OFF
class ScintillatorState(BaseModel):
    on: bool  # True -> ON, False -> OFF

# Spot Size
class SpotSizeSetting(BaseModel):
    spotSize: int

# ---------------------
# 현재 상태를 저장할 딕셔너리
# ---------------------
current_state = {
    "image": ImageControl(),
    "beam": BeamControl()
}

# ---------------------
# WebSocket 엔드포인트
# ---------------------
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(
                f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {data}"
            )
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# ---------------------
# 이미지 제어 관련
# ---------------------
@app.post("/api/image/control")
async def update_image_control(control: ControlValue):
    """ 예: ImageTab에서 넘겨주는 (name, value)를 업데이트 """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    message = f"Image Control: {control.name} set to {control.value}"

    if hasattr(current_state["image"], control.name):
        setattr(current_state["image"], control.name, control.value)

    await manager.broadcast(f"[{timestamp}] {message}")
    return {"status": "success", "message": message}

@app.post("/api/image/auto/{function}")
async def image_auto_function(function: str):
    """ 예: Auto Focus, Auto Stig, Auto Contrast/Brightness 등 """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    message = f"Image Auto function initiated: {function}"
    await manager.broadcast(f"[{timestamp}] {message}")
    return {"status": "success", "message": message}

# ---------------------
# 빔 제어 (BeamTab)
# ---------------------
@app.post("/api/beam/control")
async def update_beam_control(control: ControlValue):
    """ 기존 Gun/Beam/Wobble 슬라이더를 업데이트 """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    message = f"Beam Control: {control.name} set to {control.value}"

    if hasattr(current_state["beam"], control.name):
        setattr(current_state["beam"], control.name, control.value)

    await manager.broadcast(f"[{timestamp}] {message}")
    return {"status": "success", "message": message}

@app.post("/api/beam/auto/{function}")
async def beam_auto_function(function: str):
    """ Gun Auto / Beam Auto / Wobble ON ... """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    message = f"Beam Auto function initiated: {function}"
    await manager.broadcast(f"[{timestamp}] {message}")
    return {"status": "success", "message": message}

# ---------------------
# 세부 항목 API (HV, Filament, Bias 등)
# ---------------------
@app.post("/api/beam/hv")
async def set_beam_hv(hv: HVSetting):
    """
    예: High Voltage Setting 변경 (e.g. "1 kV", "5 kV")
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    current_state["beam"].hvSetting = hv.hvSetting

    message = f"[set_beam_hv] hvSetting={hv.hvSetting}"
    await manager.broadcast(f"[{timestamp}] {message}")

    return {"message": "HV setting updated successfully"}

@app.post("/api/beam/filament")
async def set_beam_filament(filament_data: FilamentSetting):
    """
    Filament(%) 값 설정
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    current_state["beam"].filament = filament_data.filament

    message = f"[set_beam_filament] filament={filament_data.filament}%"
    await manager.broadcast(f"[{timestamp}] {message}")

    return {"message": "Filament updated successfully"}

@app.post("/api/beam/bias")
async def set_beam_bias(bias_data: BiasSetting):
    """
    Bias(%) 값 설정
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    current_state["beam"].bias = bias_data.bias

    message = f"[set_beam_bias] bias={bias_data.bias}%"
    await manager.broadcast(f"[{timestamp}] {message}")

    return {"message": "Bias updated successfully"}

# ---------------------
# Scintillator HV, Filament Time, Spot Size
# ---------------------
@app.post("/api/beam/scintillator_hv")
async def set_scintillator_hv(state: ScintillatorState):
    """
    Scintillator HV ON/OFF
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    current_state["beam"].scintillatorHV = state.on

    status_text = "ON" if state.on else "OFF"
    message = f"Scintillator HV set to {status_text}"
    await manager.broadcast(f"[{timestamp}] {message}")

    return {"message": message}

@app.post("/api/beam/filament_time_reset")
async def filament_time_reset():
    """
    Filament Time을 0으로 리셋
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    current_state["beam"].filamentTime = 0

    message = "Filament Time Reset to 0"
    await manager.broadcast(f"[{timestamp}] {message}")

    return {"message": message}

@app.post("/api/beam/spot_size")
async def set_spot_size(spot: SpotSizeSetting):
    """
    Spot Size (1,3,5,7,9,11,13,15 중 하나)
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    current_state["beam"].spotSize = spot.spotSize

    message = f"Spot Size changed to {spot.spotSize}"
    await manager.broadcast(f"[{timestamp}] {message}")

    return {"message": message}

# ---------------------
# 현재 상태 조회
# ---------------------
@app.get("/api/state")
async def get_current_state():
    """ 전체 상태 반환 """
    return {
        "image": current_state["image"],
        "beam": current_state["beam"]
    }


# ---------------------
# 메인 실행
# ---------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8081)
