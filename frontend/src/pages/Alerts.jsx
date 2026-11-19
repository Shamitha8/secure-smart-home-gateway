
import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";

const API_URL = "http://127.0.0.1:5001";

export default function Alerts() {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchResponses() {
    try {
      const response = await fetch(`${API_URL}/api/response-logs`);

      if (!response.ok) {
        throw new Error("Unable to fetch response logs.");
      }

      const data = await response.json();
      setResponses(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchResponses();

    const interval = setInterval(fetchResponses, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <h1>Security Alerts</h1>
          <p>Automated security response activity.</p>
        </div>

        <button
          className="refresh-button"
          onClick={fetchResponses}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Automated Response Logs</h3>
            <p>{responses.length} responses recorded</p>
          </div>
        </div>

        {loading ? (
          <p className="empty-state">Loading alerts...</p>
        ) : responses.length === 0 ? (
          <p className="empty-state">No response records available.</p>
        ) : (
          <div className="table-container">
            <table className="security-table">
              <thead>
                <tr>
                  <th>Response ID</th>
                  <th>Incident ID</th>
                  <th>Attack Type</th>
                  <th>Source IP</th>
                  <th>Severity</th>
                  <th>Action</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                </tr>
              </thead>

              <tbody>
                {responses.map((item) => (
                  <tr key={item.response_id}>
                    <td>{item.response_id}</td>
                    <td>{item.incident_id}</td>
                    <td>{item.attack_type}</td>
                    <td>{item.source_ip}</td>
                    <td>
                      <span className={`severity ${item.severity?.toLowerCase()}`}>
                        {item.severity}
                      </span>
                    </td>
                    <td>{item.action}</td>
                    <td>{item.status}</td>
                    <td>
                      {item.timestamp
                        ? new Date(item.timestamp).toLocaleString()
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
