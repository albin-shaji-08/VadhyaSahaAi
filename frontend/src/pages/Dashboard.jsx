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
  // Store transcript as array of chunks for modularity
  const [transcriptChunks, setTranscriptChunks] = React.useState([]);
  const [entities, setEntities] = React.useState({});
  const [suggestions, setSuggestions] = React.useState({});
  // Store all suggestions seen so far in the session
  const suggestionsRef = React.useRef({});
  const [recorder, setRecorder] = React.useState(null);
  const wsRef = React.useRef(null);
  const audioContextRef = React.useRef(null);
  const recIntervalRef = React.useRef(null);

  // Start audio recording and WebSocket
  const startSession = async () => {
  setTranscript("");
  setTranscriptChunks([]);
    setEntities({ diseases: [], drugs: [], symptoms: [] });
    setSuggestions({ tests: [], medicines: [] });
    setIsRecording(true);
    const ws = new window.WebSocket("ws://localhost:8000/ws/transcribe");
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Append new transcript chunk if present
        if (data.transcript && data.transcript.trim()) {
          setTranscriptChunks(prev => [...prev, data.transcript.trim()]);
        }
        // Optionally, also keep a joined string for backward compatibility
        setTranscript(prev => (data.transcript && data.transcript.trim()) ? prev + (prev ? " " : "") + data.transcript.trim() : prev);
        setEntities(data.entities || {});
        // Append new suggestions to previous ones, keeping all unique points
        setSuggestions(prev => {
          const newSugg = { ...prev };
          const incoming = data.suggestions || {};
          for (const key of Object.keys(incoming)) {
            if (Array.isArray(incoming[key])) {
              newSugg[key] = Array.from(new Set([...(prev[key] || []), ...incoming[key]]));
            } else {
              newSugg[key] = incoming[key];
            }
          }
          suggestionsRef.current = newSugg;
          return newSugg;
        });
      } catch {}
    };
    ws.onerror = (event) => { setIsRecording(false); };
    ws.onclose = () => { setIsRecording(false); };

    // Recorder.js setup
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const input = audioContextRef.current.createMediaStreamSource(stream);
    const rec = new window.Recorder(input, { numChannels: 1 });
    setRecorder(rec);
    rec.record();
    recIntervalRef.current = setInterval(() => {
      rec.exportWAV(blob => {
        blob.arrayBuffer().then(buf => {
          if (ws.readyState === 1) ws.send(buf);
        });
        rec.clear();
      });
  }, 5000); // 10 seconds per chunk
  };

  // Stop recording
  const stopSession = () => {
    if (recorder && isRecording) {
      recorder.stop();
      setIsRecording(false);
    }
    if (recIntervalRef.current) {
      clearInterval(recIntervalRef.current);
      recIntervalRef.current = null;
    }
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.close();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  // Use backend entities and suggestions for left panel
  return (
    <>
      {/* Header Bar */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          zIndex: 100,
          background: 'linear-gradient(90deg, #0f172a 60%, #2dd4bf 100%)',
          color: '#fff',
          padding: '2rem 4rem 2rem 4rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: 'Poppins, Segoe UI, Arial, sans-serif',
          boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
          letterSpacing: '0.04em',
        }}
      >
        <span style={{
          fontWeight: 800,
          fontSize: '2.1rem',
          background: 'linear-gradient(90deg, #2dd4bf 10%, #fff 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontFamily: 'Poppins, Segoe UI, Arial, sans-serif',
          letterSpacing: '0.08em',
          textShadow: '0 2px 8px #0f172a44',
        }}>
          VaidhyaSaha-<span style={{ color: '#2dd4bf', WebkitTextFillColor: 'unset', background: 'none' }}>AI</span>
        </span>
        <nav style={{ display: 'flex', gap: '2.2rem', alignItems: 'center', fontSize: '1.1rem', fontWeight: 500 }}>
          <a href="/" style={{ color: '#fff', textDecoration: 'none', transition: 'color 0.2s', fontFamily: 'Poppins, Segoe UI, Arial, sans-serif' }} onMouseOver={e => e.target.style.color = '#2dd4bf'} onMouseOut={e => e.target.style.color = '#fff'}>Home</a>
          <a href="/doctor" style={{ color: '#fff', textDecoration: 'none', transition: 'color 0.2s', fontFamily: 'Poppins, Segoe UI, Arial, sans-serif' }} onMouseOver={e => e.target.style.color = '#2dd4bf'} onMouseOut={e => e.target.style.color = '#fff'}>Doctor</a>
          <span style={{ cursor: 'pointer', color: '#fff', transition: 'color 0.2s', fontFamily: 'Poppins, Segoe UI, Arial, sans-serif' }} onClick={onLogout} onMouseOver={e => e.target.style.color = '#2dd4bf'} onMouseOut={e => e.target.style.color = '#fff'}>Logout</span>
        </nav>
      </header>

      <div
        className="dashboard-container"
        style={{
          marginTop: '8rem',
          width: '100vw',
          minHeight: 'calc(100vh - 8rem)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          gap: '4rem',
          background: 'linear-gradient(120deg, #0f172a 70%, #22223b 100%)',
          padding: '4rem 0',
          border: 'none',
        }}
      >
      {/* Left Panel - Dynamic from backend */}
      <div
        className="dashboard-left"
        style={{
          minWidth: 400,
          maxWidth: 440,
          flex: '0 0 420px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2.5rem',
          fontSize: '1.25rem',
        }}
      >
        {/* Dynamically render all entity fields */}
        {Object.entries(entities).map(([key, value]) => (
          <div className="dashboard-section" key={key}>
            <Collapsible>
              <CollapsibleTrigger className="dashboard-trigger" style={{ color: "#2DD4BF" }}>
                {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
              </CollapsibleTrigger>
              <CollapsibleContent style={{ display: "flex", gap: "0.75rem" }}>
                {Array.isArray(value) && value.length > 0
                  ? value.map((v, idx) => <span key={idx} className="dashboard-tag">{v}</span>)
                  : <span className="dashboard-tag">-</span>}
              </CollapsibleContent>
            </Collapsible>
          </div>
        ))}
        {/* Dynamically render all suggestion fields */}
        {Object.entries(suggestions).map(([key, value]) => (
          <div className="dashboard-section" key={key}>
            <Collapsible>
              <CollapsibleTrigger className="dashboard-trigger" style={{ color: "#2DD4BF" }}>
                {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
              </CollapsibleTrigger>
              <CollapsibleContent style={{ display: "flex", gap: "0.75rem" }}>
                {Array.isArray(value) && value.length > 0
                  ? value.map((v, idx) => <span key={idx} className="dashboard-tag">{v}</span>)
                  : <span className="dashboard-tag">-</span>}
              </CollapsibleContent>
            </Collapsible>
          </div>
        ))}
      </div>

      {/* Right Panel */}
      <div
        className="dashboard-right"
        style={{
          flex: '1 1 900px',
          maxWidth: 950,
          minWidth: 500,
          background: 'rgba(17,24,39,0.96)',
          borderRadius: 28,
          boxShadow: '0 8px 40px rgba(0,0,0,0.22)',
          padding: '3.5rem 3.5rem 2.5rem 3.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2.5rem',
          fontSize: '1.25rem',
          border: 'none',
        }}
      >
  <div className="live-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
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

  <div className="transcription-body" style={{ width: '100%' }}>
          <h3>Transcript</h3>
          {/* Modular text field for transcript */}
          <textarea
            value={transcriptChunks.join(" ")}
            onChange={e => {
              // Allow doctor to edit transcript, update both transcriptChunks and transcript
              const newText = e.target.value;
              setTranscript(newText);
              setTranscriptChunks(newText ? newText.split(/\s+/) : []);
            }}
            rows={16}
            style={{
              width: '100%',
              minHeight: 220,
              fontSize: '1.18rem',
              resize: 'vertical',
              background: '#222',
              color: '#fff',
              border: '1.5px solid #444',
              borderRadius: 10,
              padding: 16,
              marginTop: 8,
              marginBottom: 8,
              fontFamily: 'Poppins, Segoe UI, Arial, sans-serif',
            }}
            placeholder="No transcription yet."
          />
          {/* Entities and Suggestions are now rendered above dynamically */}
        </div>
      </div>
    </div>
    </>
  );
};

export default Dashboard;
