import React from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [currentPage, setCurrentPage] = React.useState("login");

  const handleLogin = () => {
    setCurrentPage("dashboard");
    console.log("LOGIN SUCCESSFUL. Navigating to Dashboard.");
  };

  const handleLogout = () => {
    setCurrentPage("login");
    console.log("LOGOUT. Returning to Login page.");
  };

  return currentPage === "dashboard" ? (
    <Dashboard onLogout={handleLogout} />
  ) : (
    <Login onLogin={handleLogin} />
  );
}
