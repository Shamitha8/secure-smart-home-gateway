import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:5001";

const DEVICE_CONTROLS = {
  camera: "camera",
  door_lock: "lock",
  sensor: "temperature",
};

const styles = {
  page: {
    padding: "30px",
    background: "#f4f7fc",
    minHeight: "100vh",
    color: "#192338",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e3eaf5",
    borderRadius: "22px",
    padding: "30px 44px",
    boxShadow: "0 4px 16px rgba(20, 40, 80, 0.03)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
    marginBottom: "35px",
  },
  title: {
    margin: 0,
    fontSize: "28px",
    fontWeight: 700,
  },
  subtitle: {
    marginTop: "12px",
    color: "#94a3b8",
    fontSize: "18px",
  },
  count: {
    background: "#f3f0ff",
    color: "#713cff",
    borderRadius: "12px",
    padding: "14px 18px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
    padding: "30px 0",
    borderBottom: "1px solid #e5ebf4",
  },
  icon: {
    width: "80px",
    height: "80px",
    minWidth: "80px",
    borderRadius: "20px",
    background: "#eef2ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "35px",
  },
  details: {
    flex: 1,
    minWidth: 0,
  },
  deviceName: {
    fontSize: "22px",
    fontWeight: 700,
    margin: "0 0 10px",
  },
  deviceType: {
    fontSize: "17px",
    color: "#647895",
    marginBottom: "14px",
  },
  description: {
    fontSize: "17px",
    lineHeight: 1.5,
    color: "#94a3b8",
    margin: 0,
  },
  rightSide: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "14px",
    minWidth: "145px",
  },
  status: {
    fontSize: "15px",
    fontWeight: 600,
    textAlign: "right",
  },
  typeBadge: {
    background: "#f1f5f9",
    color: "#647895",
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: "15px",
  },
  toggle: {
    width: "76px",
    height: "38px",
    borderRadius: "24px",
    border: "none",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    transition: "background 0.2s",
  },
  toggleKnob: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: 700,
    color: "#374151",
  },
  message: {
    padding: "20px",
    borderRadius: "12px",
    marginTop: "20px",
    background: "#ffffff",
    color: "#64748b",
  },
};

const DEVICES = [
  {
    id: "camera",
    name: "Living Room Camera",
    type: "Security Camera",
    description: "Simulates camera activity and motion events.",
    badge: "camera",
    icon: "📷",
  },
  {
    id: "door_lock",
    name: "Main Door Lock",
    type: "Smart Door Lock",
    description: "Simulates door lock status and access events.",
    badge: "door_lock",
    icon: "🔒",
  },
  {
    id: "sensor",
    name: "Living Room Temperature Sensor",
    type: "Environmental Sensor",
    description: "Simulates temperature readings.",
    badge: "sensor",
    icon: "🌡️",
  },
];

function DeviceToggle({ isOn, busy, onToggle, deviceName }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      aria-label={`${deviceName}: ${isOn ? "ON" : "OFF"}`}
      disabled={busy || isOn === null}
      onClick={onToggle}
      title={
        isOn === null
          ? "Checking device status"
          : `Turn ${isOn ? "OFF" : "ON"}`
      }
      style={{
        width: "76px",
        height: "38px",
        borderRadius: "24px",
        border: "none",
        padding: "4px",
        cursor: busy || isOn === null ? "wait" : "pointer",
        background:
          isOn === null ? "#cbd5e1" : isOn ? "#16a34a" : "#9ca3af",
        display: "flex",
        alignItems: "center",
        justifyContent: isOn ? "flex-end" : "flex-start",
        transition: "background 0.2s ease",
        opacity: busy ? 0.7 : 1,
      }}
    >
      <span
        style={{
          width: "30px",
          height: "30px",
          borderRadius: "50%",
          background: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "10px",
          fontWeight: "bold",
          color: "#374151",
        }}
      >
        {busy ? "..." : isOn === null ? "?" : isOn ? "ON" : "OFF"}
      </span>
    </button>
  );
}

export default function Devices() {
  const [registeredDevices, setRegisteredDevices] = useState([]);
  const [deviceStates, setDeviceStates] = useState({});
  const [busyDevices, setBusyDevices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Retrieve registered devices from the existing Flask API.
  const fetchDevices = async () => {
    try {
      const response = await fetch(`${API_URL}/api/devices`);

      if (!response.ok) {
        throw new Error("Unable to retrieve registered devices.");
      }

      const data = await response.json();
      setRegisteredDevices(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Retrieve actual Docker container states.
  // This endpoint is added in the backend step below.
  const fetchDeviceStates = async () => {
    try {
      const response = await fetch(`${API_URL}/api/devices/status`);

      if (!response.ok) {
        throw new Error("Device status endpoint is unavailable.");
      }

      const data = await response.json();
      setDeviceStates(data);
    } catch (err) {
      console.error("Could not retrieve device states:", err.message);
    }
  };

  useEffect(() => {
    fetchDevices();
    fetchDeviceStates();

    const interval = setInterval(() => {
      fetchDevices();
      fetchDeviceStates();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Start or stop the selected Docker container.
  const toggleDevice = async (deviceId) => {
    const isOn = deviceStates[deviceId];

    if (typeof isOn !== "boolean") {
      setError("Device status is not available yet. Please try again.");
      return;
    }

    const action = isOn ? "stop" : "start";
    const controlId = DEVICE_CONTROLS[deviceId];

    setBusyDevices((previous) => ({
      ...previous,
      [deviceId]: true,
    }));
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/devices/${controlId}/control`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Device control failed.");
      }

      // Fetch the real state after Docker processes the request.
      await fetchDeviceStates();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyDevices((previous) => ({
        ...previous,
        [deviceId]: false,
      }));
    }
  };

  const onlineCount = DEVICES.filter(
    (device) => deviceStates[device.id] === true
  ).length;

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>Registered Devices</h1>
            <p style={styles.subtitle}>
              Device information retrieved from the backend
            </p>
          </div>

          <span style={styles.count}>
            {registeredDevices.length} registered
          </span>
        </header>

        {loading ? (
          <p style={styles.message}>Loading devices...</p>
        ) : (
          DEVICES.map((device, index) => {
            const isOn = deviceStates[device.id];
            const busy = Boolean(busyDevices[device.id]);

            return (
              <article
                key={device.id}
                style={{
                  ...styles.row,
                  borderBottom:
                    index === DEVICES.length - 1
                      ? "none"
                      : styles.row.borderBottom,
                }}
              >
                <div style={styles.icon} aria-hidden="true">
                  {device.icon}
                </div>

                <div style={styles.details}>
                  <h2 style={styles.deviceName}>{device.name}</h2>

                  <div style={styles.deviceType}>{device.type}</div>

                  <p style={styles.description}>
                    {device.description}
                  </p>
                </div>

                <div style={styles.rightSide}>
                  <span
                    style={{
                      ...styles.status,
                      color:
                        isOn === true
                          ? "#16a34a"
                          : isOn === false
                            ? "#dc2626"
                            : "#64748b",
                    }}
                  >
                    {isOn === true
                      ? "● Online"
                      : isOn === false
                        ? "● Offline"
                        : "● Status unavailable"}
                  </span>

                  <span style={styles.typeBadge}>{device.badge}</span>

                  <DeviceToggle
                    deviceName={device.name}
                    isOn={typeof isOn === "boolean" ? isOn : null}
                    busy={busy}
                    onToggle={() => toggleDevice(device.id)}
                  />
                </div>
              </article>
            );
          })
        )}

        {error && (
          <div
            role="alert"
            style={{
              ...styles.message,
              color: "#b91c1c",
              background: "#fef2f2",
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            marginTop: "20px",
            padding: "18px",
            background: "#f8fafc",
            borderRadius: "12px",
            color: "#64748b",
            fontSize: "15px",
          }}
        >
          <strong>Device status:</strong> {onlineCount} of 3 devices online.
          <br />
          Use the switches to start or stop individual device containers.
        </div>
      </section>
    </main>
  );
}