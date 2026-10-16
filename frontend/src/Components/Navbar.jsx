import { Bell, ShieldCheck } from "lucide-react";

export default function Navbar() {
  return (
    <header className="navbar">
      <div>
        <h2>Smart Home Security</h2>
        <p>Intrusion Detection & Incident Response</p>
      </div>

      <div className="navbar-right">
        <div className="system-status">
          <ShieldCheck size={17} />
          <span>Gateway Online</span>
        </div>

        <button className="notification-button" aria-label="Notifications">
          <Bell size={20} />
        </button>
      </div>
    </header>
  );
}