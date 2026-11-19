
# backend/ids/rules.py

# Time window used for traffic analysis (seconds)
TIME_WINDOW = 60

# Repeated connection attempts
CONNECTION_ATTEMPT_THRESHOLD = 20

# Number of different destination ports indicating possible port scanning
PORT_SCAN_THRESHOLD = 10

# Unusually high traffic volume (1 MB within the time window)
HIGH_TRAFFIC_THRESHOLD = 1_000_000

# Minimum time between repeated alerts for the same source and attack type
ALERT_COOLDOWN = 60

# Default severity levels
SEVERITY_LEVELS = {
    "repeated_connection_attempts": "MEDIUM",
    "port_scan": "HIGH",
    "high_traffic": "MEDIUM"
}
