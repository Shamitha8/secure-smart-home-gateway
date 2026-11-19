
import { useLocation } from "react-router-dom";
import { Bell, ShieldCheck } from "lucide-react";

const pageTitles = {
  "/dashboard": "Security Dashboard",
  "/dashboard/devices": "IoT Device Management",
  "/dashboard/traffic": "Network Traffic",
  "/dashboard/alerts": "Security Alerts",
  "/dashboard/incidents": "Incident Response",
  "/dashboard/profile": "My Profile",
};

export default function Navbar() {
  const location = useLocation();

  const username = sessionStorage.getItem("username") || "User";
  const pageTitle = pageTitles[location.pathname] || "HomeGuard";

  return (
    <header className="navbar">
      <div className="navbar-heading">
        <div className="navbar-brand-icon">
          <ShieldCheck size={20} />
        </div>

        <div>
          <h2>{pageTitle}</h2>
          <p>Smart Home Security Management Platform</p>
        </div>
      </div>

      <div className="navbar-right">
        <div className="system-status">
          <span className="status-dot"></span>
          Monitoring System
        </div>

        <div className="navbar-divider"></div>

        <div className="navbar-user">
          <div className="navbar-avatar">
            {username.charAt(0).toUpperCase()}
          </div>

          <div className="navbar-user-info">
            <strong>{username}</strong>
            <span>Account</span>
          </div>
        </div>
      </div>
    </header>
  );
}
