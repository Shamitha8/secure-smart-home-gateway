
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  ShieldAlert,
  AlertTriangle,
  Activity,
  Eye,
  X,
} from "lucide-react";

const API_URL = "http://127.0.0.1:5001";

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [selectedIncident, setSelectedIncident] = useState(null);

  async function fetchIncidents() {
    try {
      const response = await fetch(`${API_URL}/api/incidents`);

      if (!response.ok) {
        throw new Error("Unable to retrieve security incidents.");
      }

      const data = await response.json();
      setIncidents(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 10000);

    return () => clearInterval(interval);
  }, []);

  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      const query = search.toLowerCase();

      const matchesSearch =
        (incident.attack_type || "").toLowerCase().includes(query) ||
        (incident.source_ip || "").toLowerCase().includes(query) ||
        (incident.destination_ip || "").toLowerCase().includes(query);

      const matchesSeverity =
        severity === "ALL" || incident.severity === severity;

      const matchesStatus =
        status === "ALL" || incident.status === status;

      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [incidents, search, severity, status]);

  const highCount = incidents.filter(
    (item) => item.severity === "HIGH"
  ).length;

  const mediumCount = incidents.filter(
    (item) => item.severity === "MEDIUM"
  ).length;

  const newCount = incidents.filter(
    (item) => item.status === "NEW"
  ).length;

  function formatDate(value) {
    if (!value) return "N/A";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleString();
  }

  return (
    <div className="page-content incidents-page">

      <div className="incident-heading">
        <div>
          <span className="section-eyebrow">SECURITY OPERATIONS</span>
          <h1>Incident Response</h1>
          <p>Investigate and monitor detected network threats.</p>
        </div>

        <button
          className="incident-refresh"
          onClick={fetchIncidents}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="incident-error">
          {error}
        </div>
      )}

      <div className="incident-stats">

        <div className="incident-stat-card">
          <div className="incident-stat-icon total">
            <ShieldAlert size={21} />
          </div>
          <div>
            <span>Total Incidents</span>
            <h2>{incidents.length}</h2>
          </div>
        </div>

        <div className="incident-stat-card">
          <div className="incident-stat-icon high">
            <AlertTriangle size={21} />
          </div>
          <div>
            <span>High Severity</span>
            <h2>{highCount}</h2>
          </div>
        </div>

        <div className="incident-stat-card">
          <div className="incident-stat-icon medium">
            <Activity size={21} />
          </div>
          <div>
            <span>Medium Severity</span>
            <h2>{mediumCount}</h2>
          </div>
        </div>

        <div className="incident-stat-card">
          <div className="incident-stat-icon new">
            <Eye size={21} />
          </div>
          <div>
            <span>New Incidents</span>
            <h2>{newCount}</h2>
          </div>
        </div>

      </div>

      <section className="incident-panel">

        <div className="incident-panel-heading">
          <div>
            <h3>Detected Security Incidents</h3>
            <p>Review suspicious activity detected by the IDS.</p>
          </div>

          <span className="incident-total">
            {filteredIncidents.length} records
          </span>
        </div>

        <div className="incident-filters">

          <div className="incident-search">
            <Search size={17} />
            <input
              type="text"
              placeholder="Search attack type or IP address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
          >
            <option value="ALL">All Severities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="RESOLVED">Resolved</option>
          </select>

        </div>

        {loading ? (
          <div className="incident-empty">Loading incidents...</div>
        ) : filteredIncidents.length === 0 ? (
          <div className="incident-empty">
            No matching security incidents found.
          </div>
        ) : (
          <div className="incident-list">

            {filteredIncidents.map((incident) => (
              <div className="incident-record" key={incident.incident_id}>

                <div className={`incident-severity-line ${incident.severity?.toLowerCase()}`} />

                <div className="incident-record-main">

                  <div className="incident-record-top">
                    <div>
                      <span className="incident-id">
                        INCIDENT #{incident.incident_id}
                      </span>
                      <h4>
                        {(incident.attack_type || "Unknown attack")
                          .replaceAll("_", " ")
                          .replace(/\b\w/g, (char) => char.toUpperCase())}
                      </h4>
                    </div>

                    <span className={`incident-severity-badge ${incident.severity?.toLowerCase()}`}>
                      {incident.severity || "UNKNOWN"}
                    </span>
                  </div>

                  <div className="incident-record-info">
                    <span>Source: {incident.source_ip || "N/A"}</span>
                    <span>Target: {incident.destination_ip || "N/A"}</span>
                    <span>Evidence: {incident.evidence_count ?? 0}</span>
                  </div>

                  <div className="incident-record-bottom">
                    <span className={`incident-status ${incident.status?.toLowerCase()}`}>
                      {incident.status || "UNKNOWN"}
                    </span>

                    <span className="incident-date">
                      {formatDate(incident.timestamp)}
                    </span>

                    <button
                      className="incident-view-button"
                      onClick={() => setSelectedIncident(incident)}
                    >
                      <Eye size={15} />
                      View Details
                    </button>
                  </div>

                </div>
              </div>
            ))}

          </div>
        )}

      </section>

      {selectedIncident && (
        <div
          className="incident-modal-backdrop"
          onClick={() => setSelectedIncident(null)}
        >
          <div
            className="incident-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="incident-modal-heading">
              <div>
                <span className="section-eyebrow">
                  INCIDENT #{selectedIncident.incident_id}
                </span>
                <h2>Incident Details</h2>
              </div>

              <button
                className="incident-close"
                onClick={() => setSelectedIncident(null)}
                aria-label="Close incident details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="incident-detail-grid">
              <div>
                <span>Attack Type</span>
                <strong>{selectedIncident.attack_type}</strong>
              </div>

              <div>
                <span>Severity</span>
                <strong>{selectedIncident.severity}</strong>
              </div>

              <div>
                <span>Source IP</span>
                <strong>{selectedIncident.source_ip}</strong>
              </div>

              <div>
                <span>Destination IP</span>
                <strong>{selectedIncident.destination_ip}</strong>
              </div>

              <div>
                <span>Evidence Count</span>
                <strong>{selectedIncident.evidence_count}</strong>
              </div>

              <div>
                <span>Incident Status</span>
                <strong>{selectedIncident.status}</strong>
              </div>
            </div>

            <div className="incident-description">
              <span>Detection Evidence</span>
              <p>{selectedIncident.description || "No description available."}</p>
            </div>

            <div className="incident-description">
              <span>Detected At</span>
              <p>{formatDate(selectedIncident.timestamp)}</p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
