import React from "react";
import "../styles/dashboard.css"; // Make sure this path is correct

const Card = ({ children, customStyle = {} }) => (
  <div
    style={{
      backgroundColor: '#111827', // Dark background matching login
      padding: '2rem',
      width: '100%',
      maxWidth: '400px',
      borderRadius: '16px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
      border: '1px solid #374151',
      ...customStyle
    }}
  >
    {children}
  </div>
);

const Collapsible = ({ children }) => <div>{children}</div>;
const CollapsibleTrigger = ({ children, className, style }) => <div className={className} style={style}>{children}</div>;
const CollapsibleContent = ({ children, style }) => <div style={style}>{children}</div>;
const DashboardButton = ({ children, className, onClick, style }) => (
    <button className={className} onClick={onClick} style={{ cursor: 'pointer', ...style }}>{children}</button>
);

const Dashboard = ({ onLogout }) => {
  const [isRecording, setIsRecording] = React.useState(false);
  const [transcript, setTranscript] = React.useState("");
  const [entities, setEntities] = React.useState({ diseases: [], drugs: [], symptoms: [] });
  const [suggestions, setSuggestions] = React.useState({ tests: [], medicines: [] });
  const [mediaRecorder, setMediaRecorder] = React.useState(null);
  const wsRef = React.useRef(null);

  // Start audio recording and WebSocket
  const startSession = async () => {
    setTranscript("");
    setEntities({ diseases: [], drugs: [], symptoms: [] });
    setSuggestions({ tests: [], medicines: [] });
    setIsRecording(true);
    const ws = new window.WebSocket("ws://localhost:8000/ws/audio");
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;
    ws.onmessage = (event) => {
      let data = event.data;
      try { data = JSON.parse(event.data); } catch (e) {}
      setTranscript(data.transcript || "");
      setEntities(data.entities || { diseases: [], drugs: [], symptoms: [] });
      setSuggestions(data.suggestions || { tests: [], medicines: [] });
      setIsRecording(false);
      if (mediaRecorder) mediaRecorder.stream.getTracks().forEach(track => track.stop());
    };
    ws.onerror = (event) => { setIsRecording(false); };
    ws.onclose = () => { setIsRecording(false); };

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    let mimeType = 'audio/webm;codecs=opus';
    if (!window.MediaRecorder.isTypeSupported(mimeType)) mimeType = 'audio/webm';
    const recorder = new window.MediaRecorder(stream, { mimeType });
    setMediaRecorder(recorder);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0 && ws.readyState === window.WebSocket.OPEN) {
        e.data.arrayBuffer().then(buffer => ws.send(buffer));
      }
    };
    recorder.onstop = () => {
      if (ws.readyState === window.WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'end' }));
      }
    };
    recorder.start(250);
  };

  // Stop recording
  const stopSession = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  // Use backend entities and suggestions for left panel
  return (
    <div className="dashboard-container">

      {/* Left Panel - Dynamic from backend */}
      <div className="dashboard-left">
        <div className="dashboard-section">
          <Collapsible>
            <CollapsibleTrigger className="dashboard-trigger" style={{ color: "#2DD4BF" }}>
              Diseases �
            </CollapsibleTrigger>
            <CollapsibleContent style={{ display: "flex", gap: "0.75rem" }}>
              {entities.diseases.length ? entities.diseases.map((d, idx) => (
                <span key={idx} className="dashboard-tag">{d}</span>
              )) : <span className="dashboard-tag">-</span>}
            </CollapsibleContent>
          </Collapsible>
        </div>
        <div className="dashboard-section">
          <Collapsible>
            <CollapsibleTrigger className="dashboard-trigger" style={{ color: "#2DD4BF" }}>
              Drugs �
            </CollapsibleTrigger>
            <CollapsibleContent style={{ display: "flex", gap: "0.75rem" }}>
              {entities.drugs.length ? entities.drugs.map((d, idx) => (
                <span key={idx} className="dashboard-tag">{d}</span>
              )) : <span className="dashboard-tag">-</span>}
            </CollapsibleContent>
          </Collapsible>
        </div>
        <div className="dashboard-section">
          <Collapsible>
            <CollapsibleTrigger className="dashboard-trigger" style={{ color: "#2DD4BF" }}>
              Symptoms 🩺
            </CollapsibleTrigger>
            <CollapsibleContent style={{ display: "flex", gap: "0.75rem" }}>
              {entities.symptoms.length ? entities.symptoms.map((s, idx) => (
                <span key={idx} className="dashboard-tag">{s}</span>
              )) : <span className="dashboard-tag">-</span>}
            </CollapsibleContent>
          </Collapsible>
        </div>
        <div className="dashboard-section">
          <Collapsible>
            <CollapsibleTrigger className="dashboard-trigger" style={{ color: "#2DD4BF" }}>
              Suggested Tests 🧪
            </CollapsibleTrigger>
            <CollapsibleContent style={{ display: "flex", gap: "0.75rem" }}>
              {suggestions.tests.length ? suggestions.tests.map((t, idx) => (
                <span key={idx} className="dashboard-tag">{t}</span>
              )) : <span className="dashboard-tag">-</span>}
            </CollapsibleContent>
          </Collapsible>
        </div>
        <div className="dashboard-section">
          <Collapsible>
            <CollapsibleTrigger className="dashboard-trigger" style={{ color: "#2DD4BF" }}>
              Suggested Medicines 💊
            </CollapsibleTrigger>
            <CollapsibleContent style={{ display: "flex", gap: "0.75rem" }}>
              {suggestions.medicines.length ? suggestions.medicines.map((m, idx) => (
                <span key={idx} className="dashboard-tag">{m}</span>
              )) : <span className="dashboard-tag">-</span>}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Right Panel */}
      <div className="dashboard-right">
        <div className="live-header">
          <h2>Live Transcription</h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <DashboardButton className="dashboard-button start-session-button" onClick={startSession} disabled={isRecording}>
              {isRecording ? "Recording..." : "Start Session"}
            </DashboardButton>
            <DashboardButton className="dashboard-button logout-button" onClick={onLogout}>Logout</DashboardButton>
            {isRecording && (
              <DashboardButton className="dashboard-button stop-session-button" onClick={stopSession} style={{ background: '#ef4444', color: 'white' }}>
                Stop
              </DashboardButton>
            )}
          </div>
        </div>

        <div className="transcription-body">
          <h3>Transcript</h3>
          <div>{transcript || <span style={{ color: '#888' }}>No transcription yet.</span>}</div>
          <h3>Entities</h3>
          <div style={{ display: 'flex', gap: '2em' }}>
            <div><strong>Diseases</strong><br />{entities.diseases.length ? entities.diseases.join(', ') : '-'}</div>
            <div><strong>Drugs</strong><br />{entities.drugs.length ? entities.drugs.join(', ') : '-'}</div>
            <div><strong>Symptoms</strong><br />{entities.symptoms.length ? entities.symptoms.join(', ') : '-'}</div>
          </div>
          <h3>Suggestions</h3>
          <div style={{ display: 'flex', gap: '2em' }}>
            <div><strong>Tests</strong><br />{suggestions.tests.length ? suggestions.tests.join(', ') : '-'}</div>
            <div><strong>Medicines</strong><br />{suggestions.medicines.length ? suggestions.medicines.join(', ') : '-'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
