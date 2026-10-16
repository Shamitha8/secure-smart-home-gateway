import { useEffect, useState } from "react";

function NetworkTraffic() {
  const [traffic, setTraffic] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTraffic = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:5001/api/traffic"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch network traffic");
        }

        const data = await response.json();
        setTraffic(data);
        setError("");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTraffic();

    const interval = setInterval(fetchTraffic, 3000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <p>Loading network traffic...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div style={{ padding: "30px" }}>
      <h1>Network Traffic</h1>

      <p>
        Live packet information captured by the smart home gateway.
      </p>

      <h3>Total displayed packets: {traffic.length}</h3>

      {traffic.length === 0 ? (
        <p>No packet records available.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "white",
            }}
          >
            <thead>
              <tr>
                {[
                  "Timestamp",
                  "Source IP",
                  "Destination IP",
                  "Source Port",
                  "Destination Port",
                  "Protocol",
                  "Packet Size",
                  "TCP Flags",
                ].map((heading) => (
                  <th
                    key={heading}
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #ddd",
                      textAlign: "left",
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {traffic.map((packet, index) => (
                <tr key={packet.id ?? index}>
                  <td style={cellStyle}>
                    {packet.timestamp ?? "-"}
                  </td>
                  <td style={cellStyle}>
                    {packet.source_ip ?? "-"}
                  </td>
                  <td style={cellStyle}>
                    {packet.destination_ip ?? "-"}
                  </td>
                  <td style={cellStyle}>
                    {packet.source_port ?? "-"}
                  </td>
                  <td style={cellStyle}>
                    {packet.destination_port ?? "-"}
                  </td>
                  <td style={cellStyle}>
                    {packet.protocol ?? "-"}
                  </td>
                  <td style={cellStyle}>
                    {packet.packet_size ?? "-"} bytes
                  </td>
                  <td style={cellStyle}>
                    {packet.tcp_flags ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const cellStyle = {
  padding: "12px",
  borderBottom: "1px solid #eee",
  fontSize: "14px",
};

export default NetworkTraffic;