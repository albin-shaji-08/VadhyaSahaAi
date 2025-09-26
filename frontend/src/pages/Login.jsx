import React from "react";

// --- 1. Shared Helper Components ---
// Base Card component for Login and Dashboard sections
const Card = ({ children, customStyle = {} }) => (
  <div
    style={{
      backgroundColor: "#111827",
      padding: "2rem",
      width: "100%",
      maxWidth: "400px",
      borderRadius: "16px",
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
      border: "1px solid #374151",
      ...customStyle,
    }}
  >
    {children}
  </div>
);

const CardContent = ({ children }) => <div>{children}</div>;

const LoginButton = ({ children, onClick, customStyle = {} }) => (
  <button
    onClick={onClick}
    style={{
      width: "100%",
      padding: "0.75rem",
      backgroundColor: "#14B8A6",
      color: "white",
      fontWeight: "600",
      borderRadius: "8px",
      border: "none",
      cursor: "pointer",
      transition: "background-color 0.2s",
      boxShadow: "0 4px 10px rgba(20, 184, 166, 0.4)",
      ...customStyle,
    }}
    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#0F9683")}
    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#14B8A6")}
  >
    {children}
  </button>
);

const Input = ({ id, type, placeholder }) => (
  <input
    id={id}
    type={type}
    placeholder={placeholder}
    style={{
      width: "100%",
      padding: "0.75rem 1rem",
      border: "1px solid #4B5563",
      backgroundColor: "rgba(55, 65, 81, 0.5)",
      color: "white",
      borderRadius: "8px",
      outline: "none",
    }}
  />
);

const Label = ({ htmlFor, children }) => (
  <label
    htmlFor={htmlFor}
    style={{
      display: "block",
      marginBottom: "0.5rem",
      fontSize: "0.875rem",
      fontWeight: "500",
      color: "#E5E7EB",
    }}
  >
    {children}
  </label>
);

const LoginView = ({ onLogin }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "linear-gradient(to bottom right, #1A1A2E, #0F0F1A)",
        padding: "1rem",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <Card>
        <h1
          style={{
            fontSize: "2.25rem",
            fontWeight: "800",
            textAlign: "center",
            marginBottom: "2rem",
            color: "#2DD4BF",
            letterSpacing: "0.05em",
          }}
        >
          VAIDHYA SAHA-AI
        </h1>
        <CardContent>
          <div style={{ marginBottom: "1.5rem" }}>
            <Label htmlFor="email">Email / Username</Label>
            <Input id="email" type="text" placeholder="Enter your email" />
          </div>
          <div style={{ marginBottom: "2rem" }}>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Enter your password" />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              fontSize: "0.875rem",
              marginBottom: "1.5rem",
            }}
          >
            <a
              href="#"
              style={{ color: "#2DD4BF", textDecoration: "none" }}
              onClick={(e) => {
                e.preventDefault();
                console.log("Forgot Password clicked");
              }}
            >
              Forgot Password?
            </a>
          </div>

          <LoginButton onClick={onLogin}>Log In</LoginButton>
        </CardContent>

        <p
          style={{
            textAlign: "center",
            color: "#9CA3AF",
            fontSize: "0.875rem",
            marginTop: "1.5rem",
          }}
        >
          Need an account?
          <a
            href="#"
            style={{ color: "#2DD4BF", textDecoration: "none", marginLeft: "0.25rem" }}
            onClick={(e) => {
              e.preventDefault();
              console.log("Sign Up clicked");
            }}
          >
            Sign Up
          </a>
        </p>
      </Card>
    </div>
  );
};

export default LoginView;
