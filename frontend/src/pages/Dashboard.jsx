import { useEffect, useState } from "react";

import {
  Cpu,
  Activity,
  ShieldAlert,
  ShieldCheck,
  Thermometer,
  Camera,
  LockKeyhole,
  RefreshCw,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import StatCard from "../Components/StatCard";

const API_URL = "http://127.0.0.1:5001";

const deviceConfig = [
  {
    name: "Living Room Camera",
    type: "Security Camera",
    deviceType: "camera",
    detail: "Simulated camera activity",
    icon: Camera,
  },
  {
    name: "Main Door Lock",
    type: "Smart Door Lock",
    deviceType: "door_lock",
    detail: "Simulated door lock status",
    icon: LockKeyhole,
  },
  {
    name: "Living Room Temperature Sensor",
    type: "Environmental Sensor",
    deviceType: "sensor",
    detail: "Simulated temperature readings",
    icon: Thermometer,
  },
];

export default function Dashboard() {
  const [apiConnected, setApiConnected] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [devices, setDevices] = useState([]);
  const [traffic, setTraffic] = useState([]);
  const [deviceStatuses, setDeviceStatuses] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch dashboard data from Flask.
  async function fetchDashboardData() {
    setError("");

    try {
      const healthResponse = await fetch(`${API_URL}/api/health`);

      if (!healthResponse.ok) {
        throw new Error("The backend health check failed.");
      }

      setApiConnected(true);

      const [
        dashboardResponse,
        devicesResponse,
        trafficResponse,
        statusResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/api/dashboard`),
        fetch(`${API_URL}/api/devices`),
        fetch(`${API_URL}/api/traffic`),
        fetch(`${API_URL}/api/devices/status`),
      ]);

      if (
        !dashboardResponse.ok ||
        !devicesResponse.ok ||
        !trafficResponse.ok ||
        !statusResponse.ok
      ) {
        throw new Error(
          "The backend could not return all dashboard data."
        );
      }

      const dashboardJson = await dashboardResponse.json();
      const devicesJson = await devicesResponse.json();
      const trafficJson = await trafficResponse.json();
      const statusJson = await statusResponse.json();

      setDashboardData(dashboardJson);
      setDevices(
        Array.isArray(devicesJson) ? devicesJson : []
      );
      setTraffic(
        Array.isArray(trafficJson) ? trafficJson : []
      );
      setDeviceStatuses(statusJson);
    } catch (err) {
      console.error("Dashboard API error:", err);

      setApiConnected(false);
      setError(
        err.message || "Unable to connect to the backend."
      );

      setDashboardData(null);
      setDevices([]);
      setTraffic([]);
      setDeviceStatuses(null);
    } finally {
      setLoading(false);
    }
  }

  // Load data on startup and refresh every five seconds.
  useEffect(() => {
    fetchDashboardData();

    const interval = setInterval(fetchDashboardData, 5000);

    return () => clearInterval(interval);
  }, []);

  // Group recent packet records by source IP.
 // Prepare packet records using their timestamps.
const trafficChartData = [...traffic]
  .reverse()
  .map((event, index) => {
    const timestamp = event.timestamp
      ? new Date(
          event.timestamp.includes("Z") ||
          /[+-]\d{2}:\d{2}$/.test(event.timestamp)
            ? event.timestamp
            : event.timestamp.replace(" ", "T") + "Z"
        )
      : null;

    return {
      time: timestamp && !Number.isNaN(timestamp.getTime())
        ? timestamp.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        : `Packet ${index + 1}`,
      packets: index + 1,
      source: event.source_ip || "Unknown",
      size: event.packet_size ?? 0,
    };
  });


  // Match configured devices with database records.
  const registeredDevices = deviceConfig.map((config) => {
    const actualDevice = devices.find(
      (device) =>
        device.device_name === config.name ||
        device.device_type === config.deviceType
    );

    return {
      ...config,
      actualDevice,
    };
  });

  // Show only configured devices whose containers are running.
  const activeDevices =
    deviceStatuses === null
      ? []
      : deviceConfig.filter(
          (device) =>
            deviceStatuses[device.deviceType] === true
        );

  return (
    <div className="page-content">
      {/* Dashboard heading */}
      <div className="page-heading">
        <div>
          <h1>Security Dashboard</h1>
          <p>
            Monitor your simulated smart home network.
          </p>
        </div>

        <span className="live-badge">
          <span className="status-dot"></span>
          {loading
            ? "Checking"
            : apiConnected
              ? "API Connected"
              : "API Disconnected"}
        </span>

        <button
          className="refresh-button"
          onClick={fetchDashboardData}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Backend connection error */}
      {error && (
        <div className="demo-notice">
          <ShieldAlert size={18} />

          <p>
            <strong>Backend connection issue:</strong>{" "}
            {error} Check that Flask is running on port 5001.
          </p>
        </div>
      )}

      {/* Dashboard statistics */}
      <div className="stats-grid">
        <StatCard
          title="Registered Devices"
          value={
            loading
              ? "..."
              : dashboardData?.devices ?? 0
          }
          description="Records stored in SQLite"
          icon={Cpu}
          color="blue"
        />

        <StatCard
          title="Active Devices"
          value={
            deviceStatuses === null
              ? "..."
              : activeDevices.length
          }
          description="Docker containers currently running"
          icon={Activity}
          color="green"
        />

        <StatCard
          title="Network Packets"
          value={loading ? "..." : traffic.length}
          description="Recent packet records returned"
          icon={ShieldAlert}
          color="purple"
        />

        <StatCard
          title="API Status"
          value={
            loading
              ? "Checking"
              : apiConnected
                ? "Online"
                : "Offline"
          }
          description="Flask backend health check"
          icon={ShieldCheck}
          color="green"
        />
      </div>

    

      {/* System Status */}
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>System Status</h3>
            <p>Backend and device monitoring</p>
          </div>
        </div>

        <div className="alert-list">
          <div className="alert-item">
            <div className="alert-symbol info">i</div>

            <div className="alert-description">
              <h4>Flask API</h4>

              <p>
                {apiConnected
                  ? "Backend reachable"
                  : "Connection unavailable"}
              </p>
            </div>
          </div>

          <div className="alert-item">
            <div className="alert-symbol info">i</div>

            <div className="alert-description">
              <h4>Device Database</h4>

              <p>
                {devices.length} device records retrieved
              </p>
            </div>
          </div>

          <div className="alert-item">
            <div className="alert-symbol info">i</div>

            <div className="alert-description">
              <h4>Running Devices</h4>

              <p>
                {deviceStatuses === null
                  ? "Status unavailable"
                  : `${activeDevices.length} of ${deviceConfig.length} configured devices running`}
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* Active Devices */}
      <section className="panel devices-panel">
        <div className="panel-heading">
          <div>
            <h3>Active Devices</h3>
            <p>
              Devices whose Docker containers are currently running
            </p>
          </div>

          <span className="device-count">
            {deviceStatuses === null
              ? "Checking..."
              : `${activeDevices.length} active`}
          </span>
        </div>

        {deviceStatuses === null ? (
          <p className="empty-state">
            Device status is unavailable. Check the Flask
            backend and Docker Desktop.
          </p>
        ) : activeDevices.length === 0 ? (
          <p className="empty-state">
            No devices are currently running.
          </p>
        ) : (
          <div className="device-grid">
            {activeDevices.map((device) => {
              const Icon = device.icon;

              return (
                <div
                  className="device-card"
                  key={device.deviceType}
                >
                  <div className="device-card-top">
                    <div className="device-icon">
                      <Icon size={22} />
                    </div>

                    <span className="device-status">
                      <span className="status-dot"></span>
                      Active
                    </span>
                  </div>

                  <h4>{device.name}</h4>

                  <p className="device-type">
                    {device.type}
                  </p>

                  <p className="device-detail">
                    {device.detail}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Registered Devices */}
      <section className="panel devices-panel">
        <div className="panel-heading">
          <div>
            <h3>Registered Devices</h3>
            <p>
              All configured devices recorded in the database
            </p>
          </div>

          <span className="device-count">
            {devices.length} registered
          </span>
        </div>

        <div className="device-grid">
          {registeredDevices.map((device) => {
            const Icon = device.icon;

            const isRunning =
              deviceStatuses?.[device.deviceType] === true;

            return (
              <div
                className="device-card"
                key={device.deviceType}
              >
                <div className="device-card-top">
                  <div className="device-icon">
                    <Icon size={22} />
                  </div>

                  <span className="device-status">
                    <span className="status-dot"></span>

                    {deviceStatuses === null
                      ? "Status unknown"
                      : isRunning
                        ? "Running"
                        : "Stopped"}
                  </span>
                </div>

                <h4>{device.name}</h4>

                <p className="device-type">
                  {device.type}
                </p>

                <p className="device-detail">
                  {device.detail}
                </p>

                <p className="device-detail">
                  Database:{" "}
                  {device.actualDevice
                    ? "Registered"
                    : "Not registered"}
                </p>

                {device.actualDevice?.latest_reading && (
                  <p className="device-detail">
                    Latest reading:{" "}
                    {typeof device.actualDevice.latest_reading ===
                    "string"
                      ? device.actualDevice.latest_reading
                      : JSON.stringify(
                          device.actualDevice.latest_reading
                        )}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Implementation information */}
      <div className="demo-notice">
        <ShieldCheck size={18} />

        <p>
          <strong>Current implementation:</strong>{" "}
          Active status is retrieved from Docker container
          states. Registered devices are displayed separately.
          Network traffic reflects the packet records returned
          by the backend. Intrusion detection and automated
          incident response are separate features and are not
          represented as operational here.
        </p>
      </div>
    </div>
  );
}