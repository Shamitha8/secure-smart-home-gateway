
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Cpu,
  Activity,
  ShieldAlert,
  Siren,
  ShieldCheck,
  UserRound,
  LogOut,
  Settings,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, end: true },
  { name: "IoT Devices", path: "/dashboard/devices", icon: Cpu },
  { name: "Network Traffic", path: "/dashboard/traffic", icon: Activity },
  { name: "Security Alerts", path: "/dashboard/alerts", icon: ShieldAlert },
  { name: "Incident Response", path: "/dashboard/incidents", icon: Siren },
];

export default function Sidebar() {
  const navigate = useNavigate();

  const username = sessionStorage.getItem("username") || "User";
  const email = sessionStorage.getItem("email") || "";
  const initial = username.charAt(0).toUpperCase();

  const handleLogout = async () => {
    try {
      await fetch("http://127.0.0.1:5001/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      sessionStorage.clear();
      navigate("/login", { replace: true });
    }
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <ShieldCheck size={25} />
        </div>

        <div>
          <h2>HomeGuard</h2>
          <p>SECURITY GATEWAY</p>
        </div>
      </div>

      <div className="menu-heading">MAIN MENU</div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <Icon size={19} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-section-label">ACCOUNT</div>

        <NavLink
          to="/dashboard/profile"
          className={({ isActive }) =>
            `profile-link ${isActive ? "active" : ""}`
          }
        >
          <div className="profile-avatar">{initial}</div>

          <div className="profile-details">
            <strong>{username}</strong>
            <span>{email}</span>
          </div>

          <Settings size={16} className="profile-settings-icon" />
        </NavLink>

        <button className="sidebar-logout" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Sign out</span>
        </button>

        <div className="sidebar-footer">
          <span className="status-dot"></span>
          Gateway monitoring enabled
        </div>
      </div>
    </aside>
  );
}
