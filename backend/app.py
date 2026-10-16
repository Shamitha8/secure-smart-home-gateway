import json
from flask import Flask, jsonify
from flask_cors import CORS
from database import get_connection, initialize_database
import database
import docker
from flask import request

print("DATABASE MODULE:", database.__file__, flush=True)
print("DATABASE PATH:", database.DATABASE_PATH, flush=True)
from datetime import datetime, timezone
app = Flask(__name__)
CORS(app)

initialize_database()


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "online",
        "service": "Smart Home Security API"
    })


@app.route("/api/dashboard", methods=["GET"])
def dashboard():
    with get_connection() as connection:
        device_count = connection.execute(
            "SELECT COUNT(*) FROM devices"
        ).fetchone()[0]

        event_count = connection.execute(
            "SELECT COUNT(*) FROM traffic_events"
        ).fetchone()[0]

    return jsonify({
        "devices": device_count,
        "events": event_count,
        "alerts": 0
    })


@app.route("/api/devices", methods=["GET"])
def devices():
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT * FROM devices ORDER BY device_name"
        ).fetchall()

    return jsonify([dict(row) for row in rows])


@app.route("/api/traffic", methods=["GET"])
def traffic():
    print("TRAFFIC ENDPOINT CALLED", flush=True)

    with get_connection() as connection:
        count = connection.execute(
            "SELECT COUNT(*) FROM packet_events"
        ).fetchone()[0]

        rows = connection.execute(
            "SELECT * FROM packet_events ORDER BY id DESC LIMIT 5"
        ).fetchall()

        print("PACKET COUNT FROM ENDPOINT:", count, flush=True)
        print("ROWS RETURNED:", len(rows), flush=True)

        result = [dict(row) for row in rows]
        print("RESULT:", result, flush=True)

    return jsonify(result)

@app.route("/api/packet-events", methods=["POST"])
def record_packet():
    from flask import request

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON"}), 400

    required_fields = [
        "source_ip",
        "destination_ip",
        "protocol",
        "packet_size"
    ]

    if any(field not in data for field in required_fields):
        return jsonify({"error": "Missing packet fields"}), 400

    try:
        packet_size = int(data["packet_size"])

        if packet_size < 0:
            return jsonify({"error": "Invalid packet size"}), 400

        with get_connection() as connection:
            connection.execute(
                """
                INSERT INTO packet_events (
                    timestamp,
                    source_ip,
                    destination_ip,
                    source_port,
                    destination_port,
                    protocol,
                    packet_size,
                    tcp_flags
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    datetime.now(timezone.utc).isoformat(),
                    str(data["source_ip"]),
                    str(data["destination_ip"]),
                    data.get("source_port"),
                    data.get("destination_port"),
                    str(data["protocol"]),
                    packet_size,
                    str(data.get("tcp_flags", ""))
                )
            )
            connection.commit()

        return jsonify({"message": "Packet recorded"}), 201

    except (ValueError, TypeError):
        return jsonify({"error": "Invalid packet data"}), 400

@app.route("/api/devices/register", methods=["POST"])
def register_device():
    from flask import request

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON"}), 400

    device_name = data.get("device_name")
    device_type = data.get("device_type")
    source_ip = data.get("source_ip")
    reading = data.get("reading")
    timestamp = data.get("timestamp")

    if not device_name or not device_type:
        return jsonify({
            "error": "device_name and device_type are required"
        }), 400

    try:
        with get_connection() as connection:
            connection.execute(
                """
                INSERT INTO devices (
                    device_name,
                    device_type,
                    source_ip,
                    latest_reading,
                    last_seen
                )
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(device_name) DO UPDATE SET
                    device_type = excluded.device_type,
                    source_ip = excluded.source_ip,
                    latest_reading = excluded.latest_reading,
                    last_seen = excluded.last_seen
                """,
                (
                    device_name,
                    device_type,
                    source_ip,
                    json.dumps(reading),
                    timestamp or datetime.now(timezone.utc).isoformat()
                )
            )
            connection.commit()

        return jsonify({
            "message": "Device registered successfully",
            "device_name": device_name
        }), 201

    except Exception:
        app.logger.exception("Device registration failed")
        return jsonify({"error": "Device registration failed"}), 500


@app.route("/api/traffic/stats", methods=["GET"])
def traffic_stats():
    with get_connection() as connection:
        total_packets = connection.execute(
            "SELECT COUNT(*) FROM packet_events"
        ).fetchone()[0]

        protocol_rows = connection.execute("""
            SELECT protocol, COUNT(*) AS packet_count
            FROM packet_events
            GROUP BY protocol
        """).fetchall()

        total_bytes = connection.execute(
            "SELECT COALESCE(SUM(packet_size), 0) FROM packet_events"
        ).fetchone()[0]

        unique_sources = connection.execute(
            "SELECT COUNT(DISTINCT source_ip) FROM packet_events"
        ).fetchone()[0]

        unique_destinations = connection.execute(
            "SELECT COUNT(DISTINCT destination_ip) FROM packet_events"
        ).fetchone()[0]

        top_sources = connection.execute("""
            SELECT source_ip, COUNT(*) AS packet_count
            FROM packet_events
            WHERE source_ip IS NOT NULL
            GROUP BY source_ip
            ORDER BY packet_count DESC
            LIMIT 10
        """).fetchall()

    return jsonify({
        "total_packets": total_packets,
        "protocol_counts": {
            row["protocol"]: row["packet_count"]
            for row in protocol_rows
        },
        "total_bytes": total_bytes,
        "unique_source_ips": unique_sources,
        "unique_destination_ips": unique_destinations,
        "top_source_ips": [dict(row) for row in top_sources]
    })

# Docker client
docker_client = docker.from_env()

# Only these containers can be controlled through this API
DEVICE_CONTAINERS = {
    "camera": "smart-camera",
    "lock": "smart-lock",
    "temperature": "temperature-sensor",
}


@app.route("/api/devices/<device_id>/control", methods=["POST"])
def control_device(device_id):
    if device_id not in DEVICE_CONTAINERS:
        return jsonify({"error": "Unknown device"}), 404

    data = request.get_json(silent=True) or {}
    action = data.get("action")

    if action not in ["start", "stop"]:
        return jsonify({
            "error": "Action must be start or stop"
        }), 400

    try:
        container_name = DEVICE_CONTAINERS[device_id]
        container = docker_client.containers.get(container_name)

        if action == "stop":
            container.stop(timeout=3)
        else:
            container.start()

        container.reload()

        return jsonify({
            "device": device_id,
            "container": container_name,
            "status": container.status,
            "action": action
        }), 200

    except docker.errors.NotFound:
        return jsonify({"error": "Container not found"}), 404

    except docker.errors.APIError:
        app.logger.exception("Docker operation failed")
        return jsonify({
            "error": "Docker operation failed"
        }), 500
@app.route("/api/devices/status", methods=["GET"])
def get_device_status():
    try:
        client = docker.from_env()

        containers = {
            "camera": "smart-camera",
            "door_lock": "smart-lock",
            "sensor": "temperature-sensor",
        }

        statuses = {}

        for device_id, container_name in containers.items():
            try:
                container = client.containers.get(container_name)
                container.reload()
                statuses[device_id] = container.status == "running"

            except docker.errors.NotFound:
                statuses[device_id] = False

        return jsonify(statuses), 200

    except Exception:
        app.logger.exception("Unable to retrieve device statuses")
        return jsonify({
            "error": "Unable to retrieve device statuses"
        }), 500
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)