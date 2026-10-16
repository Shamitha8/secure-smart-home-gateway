import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Cpu,
  Activity,
  ShieldAlert,
  Siren,
  ShieldCheck,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "IoT Devices", path: "/devices", icon: Cpu },
  { name: "Network Traffic", path: "/traffic", icon: Activity },
  { name: "Security Alerts", path: "/alerts", icon: ShieldAlert },
  { name: "Incident Response", path: "/incidents", icon: Siren },
];

export default function Sidebar() {
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

      <div className="menu-heading">MONITORING</div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
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

      <div className="sidebar-footer">
        <span className="status-dot"></span>
        Gateway monitoring enabled
      </div>
    </aside>
  );
}