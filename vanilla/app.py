import streamlit as st
import pyaudio
import websocket
import json
import threading
import queue
import time
from urllib.parse import urlencode
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("ASSEMBLYAI_API_KEY")

st.set_page_config(page_title="Real-Time Transcription", page_icon="🎙️", layout="centered")

st.title("Real-Time Audio Transcription")
st.markdown("Powered by AssemblyAI")

if not API_KEY:
    st.error("Please set your ASSEMBLYAI_API_KEY in the `.env` file.")
    st.stop()

# AssemblyAI Connection Params
CONNECTION_PARAMS = {
    "sample_rate": 16000,
    "speech_model": "u3-rt-pro"
}
API_ENDPOINT = f"wss://streaming.assemblyai.com/v3/ws?{urlencode(CONNECTION_PARAMS)}"

# Audio Params
FRAMES_PER_BUFFER = 800
SAMPLE_RATE = 16000
CHANNELS = 1
FORMAT = pyaudio.paInt16

# Session initialization
if 'recording' not in st.session_state:
    st.session_state.recording = False
if 'transcript' not in st.session_state:
    st.session_state.transcript = ""
if 'current_turn' not in st.session_state:
    st.session_state.current_turn = ""
if 'msg_queue' not in st.session_state:
    st.session_state.msg_queue = queue.Queue()
if 'stop_event' not in st.session_state:
    st.session_state.stop_event = threading.Event()

def on_open(ws):
    def stream_audio():
        audio = pyaudio.PyAudio()
        try:
            stream = audio.open(
                input=True,
                frames_per_buffer=FRAMES_PER_BUFFER,
                channels=CHANNELS,
                format=FORMAT,
                rate=SAMPLE_RATE,
            )
            while not st.session_state.stop_event.is_set():
                try:
                    data = stream.read(FRAMES_PER_BUFFER, exception_on_overflow=False)
                    ws.send(data, websocket.ABNF.OPCODE_BINARY)
                except Exception as e:
                    st.session_state.msg_queue.put({"type": "Error", "text": f"Audio stream error: {e}"})
                    break
        except Exception as e:
            st.session_state.msg_queue.put({"type": "Error", "text": f"Microphone error: {e}"})
        finally:
            if 'stream' in locals() and stream.is_active():
                stream.stop_stream()
                stream.close()
            audio.terminate()

    audio_thread = threading.Thread(target=stream_audio)
    audio_thread.daemon = True
    audio_thread.start()

def on_message(ws, message):
    try:
        data = json.loads(message)
        msg_type = data.get('type')

        if msg_type == "Turn":
            text = data.get('transcript', '')
            formatted = data.get('turn_is_formatted', False)
            st.session_state.msg_queue.put({
                "type": "Turn",
                "text": text,
                "formatted": formatted
            })
    except json.JSONDecodeError:
        pass

def on_error(ws, error):
    st.session_state.msg_queue.put({"type": "Error", "text": f"WebSocket Error: {str(error)}"})
    st.session_state.stop_event.set()

def on_close(ws, close_status_code, close_msg):
    st.session_state.stop_event.set()

def start_recording():
    st.session_state.recording = True
    st.session_state.transcript = ""
    st.session_state.current_turn = ""
    st.session_state.stop_event.clear()
    
    # Drain old queue
    while not st.session_state.msg_queue.empty():
        try:
            st.session_state.msg_queue.get_nowait()
        except queue.Empty:
            break
            
    ws_app = websocket.WebSocketApp(
        API_ENDPOINT,
        header={"Authorization": API_KEY},
        on_open=on_open,
        on_message=on_message,
        on_error=on_error,
        on_close=on_close,
    )
    
    ws_thread = threading.Thread(target=ws_app.run_forever)
    ws_thread.daemon = True
    ws_thread.start()
    st.session_state.ws_app = ws_app

def stop_recording():
    st.session_state.recording = False
    st.session_state.stop_event.set()
    if 'ws_app' in st.session_state and st.session_state.ws_app is not None:
        try:
            st.session_state.ws_app.send(json.dumps({"type": "Terminate"}))
        except Exception:
            pass
        st.session_state.ws_app.close()
        st.session_state.ws_app = None

# UI Controls
col1, col2 = st.columns(2)
with col1:
    st.button("🟢 Start Recording", use_container_width=True, disabled=st.session_state.recording, on_click=start_recording)

with col2:
    st.button("🛑 Stop Recording", use_container_width=True, disabled=not st.session_state.recording, on_click=stop_recording)

st.divider()

# UI Display
st.markdown("### Transcript")
transcript_container = st.empty()

# Process Queue and Update UI
if st.session_state.recording:
    while not st.session_state.msg_queue.empty():
        try:
            msg = st.session_state.msg_queue.get_nowait()
            if msg["type"] == "Turn":
                if msg["formatted"]:
                    st.session_state.transcript += msg["text"] + " "
                    st.session_state.current_turn = ""
                else:
                    st.session_state.current_turn = msg["text"]
            elif msg["type"] == "Error":
                st.error(msg["text"])
        except queue.Empty:
            break
            
    transcript_container.info(f"{st.session_state.transcript} *{st.session_state.current_turn}*")
    
    time.sleep(0.3)
    st.rerun()

else:
    # Final state when not recording
    transcript_container.info(f"{st.session_state.transcript}")
