import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, RefreshCw, ArrowUpRight, Cpu, Server, Lock } from 'lucide-react';

export default function NetworkTraffic() {
  const [trafficData, setTrafficData] = useState([]);
  const [stats, setStats] = useState({
    bandwidthKbps: 42.5,
    totalPackets: 1248,
    activeConnections: 6,
    anomalousPackets: 2,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Fallback demo data matching simulated smart home IoT devices
  const initialPackets = [
    { timestamp: '14:32:05', src_ip: '192.168.1.102', dst_ip: '10.0.0.1', protocol: 'MQTT', dst_port: 1883, packet_size: 64, is_threat: false },
    { timestamp: '14:32:03', src_ip: '192.168.1.105', dst_ip: '10.0.0.1', protocol: 'HTTP', dst_port: 80, packet_size: 512, is_threat: false },
    { timestamp: '14:31:58', src_ip: '45.33.32.156', dst_ip: '192.168.1.101', protocol: 'TCP', dst_port: 22, packet_size: 1024, is_threat: true, threat_type: 'Port Scan' },
    { timestamp: '14:31:55', src_ip: '192.168.1.108', dst_ip: '10.0.0.1', protocol: 'UDP', dst_port: 53, packet_size: 128, is_threat: false },
    { timestamp: '14:31:40', src_ip: '185.220.101.5', dst_ip: '192.168.1.100', protocol: 'TCP', dst_port: 8080, packet_size: 2048, is_threat: true, threat_type: 'DoS Spike' },
  ];

  const fetchTrafficData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/traffic/live');
      if (response.ok) {
        const data = await response.json();
        setTrafficData(data.packets && data.packets.length > 0 ? data.packets : initialPackets);
        setStats({
          bandwidthKbps: data.bandwidth_kbps || 42.5,
          totalPackets: data.total_packets || 1248,
          activeConnections: data.active_connections || 6,
          anomalousPackets: data.anomalous_packets || 2,
        });
      } else {
        setTrafficData(initialPackets);
      }
    } catch (error) {
      setTrafficData(initialPackets);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrafficData();
    const interval = setInterval(fetchTrafficData, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.container}>
      {/* Header Section */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            <Activity style={{ color: '#3b82f6', marginRight: '8px' }} />
            Real-Time Network Traffic Monitor
          </h1>
          <p style={styles.subtitle}>
            Live inspection of virtual IoT gateway communication & Scapy packet streams
          </p>
        </div>
        <button style={styles.refreshBtn} onClick={fetchTrafficData}>
          <RefreshCw className={isLoading ? 'spin' : ''} style={{ width: '16px', height: '16px', marginRight: '6px' }} />
          Refresh Feed
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>Throughput</span>
            <ArrowUpRight style={{ color: '#3b82f6', width: '18px', height: '18px' }} />
          </div>
          <div style={styles.cardValueContainer}>
            <span style={{ ...styles.cardValue, color: '#60a5fa' }}>{stats.bandwidthKbps}</span>
            <span style={styles.cardUnit}>Kbps</span>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>Total Packets (1m)</span>
            <Server style={{ color: '#10b981', width: '18px', height: '18px' }} />
          </div>
          <div style={styles.cardValueContainer}>
            <span style={{ ...styles.cardValue, color: '#34d399' }}>{stats.totalPackets}</span>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>Active IoT Connections</span>
            <Cpu style={{ color: '#a855f7', width: '18px', height: '18px' }} />
          </div>
          <div style={styles.cardValueContainer}>
            <span style={{ ...styles.cardValue, color: '#c084fc' }}>{stats.activeConnections}</span>
          </div>
        </div>

        <div style={{ ...styles.card, borderColor: stats.anomalousPackets > 0 ? '#b91c1c' : '#334155' }}>
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>Flagged Anomalies</span>
            <ShieldAlert style={{ color: '#f87171', width: '18px', height: '18px' }} />
          </div>
          <div style={styles.cardValueContainer}>
            <span style={{ ...styles.cardValue, color: '#f87171' }}>{stats.anomalousPackets}</span>
          </div>
        </div>
      </div>

      {/* Captured Packet Logs Table */}
      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <h3 style={styles.tableTitle}>Captured Packet Logs (Scapy Sniffer Feed)</h3>
          <span style={styles.badgeActive}>● Live Stream Active</span>
        </div>

        <table style={styles.table}>
          <thead>
            <tr style={styles.thRow}>
              <th style={styles.th}>Timestamp</th>
              <th style={styles.th}>Source IP</th>
              <th style={styles.th}>Destination IP</th>
              <th style={styles.th}>Protocol</th>
              <th style={styles.th}>Port</th>
              <th style={styles.th}>Size</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {trafficData.map((pkt, idx) => (
              <tr key={idx} style={pkt.is_threat ? styles.trThreat : styles.trNormal}>
                <td style={styles.tdMono}>{pkt.timestamp}</td>
                <td style={{ ...styles.tdMono, color: '#93c5fd' }}>{pkt.src_ip}</td>
                <td style={{ ...styles.tdMono, color: '#cbd5e1' }}>{pkt.dst_ip}</td>
                <td style={styles.td}>
                  <span style={styles.protoBadge}>{pkt.protocol}</span>
                </td>
                <td style={styles.tdMono}>{pkt.dst_port}</td>
                <td style={styles.td}>{pkt.packet_size} B</td>
                <td style={styles.td}>
                  {pkt.is_threat ? (
                    <span style={styles.threatBadge}>
                      ⚠️ Threat ({pkt.threat_type || 'Anomaly'})
                    </span>
                  ) : (
                    <span style={styles.normalBadge}>✓ Normal</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Inline Styles Object (Guarantees modern dark theme without needing extra CSS setup)
const styles = {
  container: {
    backgroundColor: '#0f172a',
    minHeight: '100vh',
    padding: '24px',
    color: '#f8fafc',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    borderBottom: '1px solid #1e293b',
    paddingBottom: '16px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    margin: 0,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: '14px',
    marginTop: '4px',
  },
  refreshBtn: {
    backgroundColor: '#1e293b',
    color: '#e2e8f0',
    border: '1px solid #334155',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    fontWeight: '500',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '28px',
  },
  card: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '16px 20px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  cardLabel: {
    color: '#94a3b8',
    fontSize: '13px',
    fontWeight: '500',
  },
  cardValueContainer: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px',
  },
  cardValue: {
    fontSize: '28px',
    fontWeight: '700',
  },
  cardUnit: {
    color: '#64748b',
    fontSize: '14px',
  },
  tableCard: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  tableHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #334155',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tableTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: 0,
    color: '#e2e8f0',
  },
  badgeActive: {
    color: '#34d399',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '14px',
  },
  thRow: {
    backgroundColor: '#0f172a',
    borderBottom: '1px solid #334155',
  },
  th: {
    padding: '12px 16px',
    color: '#64748b',
    fontWeight: '600',
    fontSize: '12px',
    textTransform: 'uppercase',
  },
  trNormal: {
    borderBottom: '1px solid #334155',
  },
  trThreat: {
    backgroundColor: 'rgba(185, 28, 28, 0.2)',
    borderBottom: '1px solid #991b1b',
  },
  td: {
    padding: '12px 16px',
    color: '#cbd5e1',
  },
  tdMono: {
    padding: '12px 16px',
    fontFamily: 'monospace',
    fontSize: '13px',
  },
  protoBadge: {
    backgroundColor: '#334155',
    color: '#e2e8f0',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
  },
  threatBadge: {
    color: '#fca5a5',
    backgroundColor: '#991b1b',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
  },
  normalBadge: {
    color: '#34d399',
    fontSize: '13px',
    fontWeight: '500',
  },
};