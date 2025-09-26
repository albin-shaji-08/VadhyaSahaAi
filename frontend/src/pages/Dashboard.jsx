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
  const transcription = [
    { speaker: "Doctor", text: "How are you feeling today? I recommend taking Paracetamol." },
    { speaker: "Patient", text: "I have been experiencing a dull Headache and a slight Fever." },
    { speaker: "Doctor", text: "Noted. Any medications currently?" },
    { speaker: "Patient", text: "Yes, I’ve been taking Paracetamol." },
  ];

  const symptoms = ["Headache", "Fever"];
  const conditions = ["Migraine", "Viral"];
  const prescriptions = [{ name: "Paracetamol", dosage: "500mg", frequency: "Twice a day" }];

  return (
    <div className="dashboard-container">
      {/* Left Panel */}
      <div className="dashboard-left">
        <div className="dashboard-section">
          <Collapsible>
            <CollapsibleTrigger className="dashboard-trigger" style={{ color: "#2DD4BF" }}>
              Symptoms 🩺
            </CollapsibleTrigger>
            <CollapsibleContent style={{ display: "flex", gap: "0.75rem" }}>
              {symptoms.map((s, idx) => (
                <span key={idx} className="dashboard-tag">{s}</span>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="dashboard-section">
          <Collapsible>
            <CollapsibleTrigger className="dashboard-trigger" style={{ color: "#2DD4BF" }}>
              Conditions 🔎
            </CollapsibleTrigger>
            <CollapsibleContent style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {conditions.map((c, idx) => (
                <div key={idx} className="dashboard-item">{c}</div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="dashboard-section">
          <Collapsible>
            <CollapsibleTrigger className="dashboard-trigger" style={{ color: "#2DD4BF" }}>
              Prescriptions 💊
            </CollapsibleTrigger>
            <CollapsibleContent style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {prescriptions.map((p, idx) => (
                <div key={idx} className="dashboard-item">
                  <strong>{p.name}</strong><br />
                  <span style={{ fontSize: "0.85rem", color: "#9CA3AF" }}>{p.dosage}, {p.frequency}</span>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Right Panel */}
      <div className="dashboard-right">
        <div className="live-header">
          <h2>Live Transcription</h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
             <DashboardButton className="dashboard-button start-session-button">Start Session</DashboardButton>
             <DashboardButton className="dashboard-button logout-button" onClick={onLogout}>Logout</DashboardButton>
          </div>
        </div>

        <div className="transcription-body">
          {transcription.map((line, idx) => (
            <p key={idx} className="transcription-text">
              <span className={line.speaker === "Doctor" ? "transcription-speaker-doctor" : "transcription-speaker-patient"}>
                {line.speaker}:
              </span>{" "}
              {line.text.split(" ").map((word, wIdx) => {
                const cleanWord = word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");
                const isMedicalTerm = symptoms.includes(cleanWord) || conditions.includes(cleanWord) || prescriptions.some((p) => p.name === cleanWord);
                return (
                  <span key={wIdx} className={isMedicalTerm ? "medical-term" : ""}>{word} </span>
                );
              })}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
