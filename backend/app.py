
import json
import sqlite3
import docker
import os

from pathlib import Path
from dotenv import load_dotenv

from datetime import datetime, timezone
from flask import Flask, jsonify, request, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

from database import get_connection, initialize_database
import database

from ids import detector, analyze_incident, handle_incident


# --------------------------------------------------
# DATABASE INFORMATION
# --------------------------------------------------

print("DATABASE MODULE:", database.__file__, flush=True)
print("DATABASE PATH:", database.DATABASE_PATH, flush=True)


# --------------------------------------------------
# FLASK INITIALIZATION
# --------------------------------------------------

app = Flask(__name__)

load_dotenv(Path(__file__).resolve().parent / ".env")
app.secret_key = os.getenv("FLASK_SECRET_KEY")

if not app.secret_key:
    raise RuntimeError("FLASK_SECRET_KEY is missing from backend/.env")

CORS(
    app,
    origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    supports_credentials=True
)

app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=False,
    PERMANENT_SESSION_LIFETIME=60 * 60 * 24
)

initialize_database()


# --------------------------------------------------
# SECURITY DATABASE TABLES
# --------------------------------------------------

def initialize_security_tables():

    with get_connection() as connection:

        connection.execute("""
            CREATE TABLE IF NOT EXISTS security_incidents (
                incident_id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_ip TEXT,
                destination_ip TEXT,
                attack_type TEXT,
                severity TEXT,
                description TEXT,
                evidence_count INTEGER,
                status TEXT DEFAULT 'NEW',
                timestamp TEXT
            )
        """)

        connection.execute("""
            CREATE TABLE IF NOT EXISTS response_logs (
                response_id INTEGER PRIMARY KEY AUTOINCREMENT,
                incident_id INTEGER,
                source_ip TEXT,
                attack_type TEXT,
                severity TEXT,
                action TEXT,
                message TEXT,
                status TEXT,
                timestamp TEXT,
                FOREIGN KEY (incident_id)
                    REFERENCES security_incidents(incident_id)
            )
        """)

        connection.commit()


initialize_security_tables()


# --------------------------------------------------
# ASSIGN EXISTING SHARED DEVICES TO EXISTING USERS
# --------------------------------------------------

def assign_existing_devices_to_users():

    with get_connection() as connection:

        users = connection.execute(
            "SELECT id FROM users"
        ).fetchall()

        devices = connection.execute(
            "SELECT id FROM devices"
        ).fetchall()

        assigned_at = datetime.now(timezone.utc).isoformat()

        for user in users:
            for device in devices:
                connection.execute("""
                    INSERT OR IGNORE INTO user_devices
                    (user_id, device_id, access_role, assigned_at)
                    VALUES (?, ?, 'owner', ?)
                """, (user["id"], device["id"], assigned_at))

        connection.commit()


assign_existing_devices_to_users()


# --------------------------------------------------
# USER REGISTRATION
# --------------------------------------------------

@app.route("/api/auth/register", methods=["POST"])
def register_user():

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON"}), 400

    username = str(data.get("username", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = data.get("password")

    if not username or not email or not isinstance(password, str) or not password:
        return jsonify({
            "error": "Username, email and password are required"
        }), 400

    if len(username) < 3:
        return jsonify({
            "error": "Username must contain at least 3 characters"
        }), 400

    if len(password) < 8:
        return jsonify({
            "error": "Password must contain at least 8 characters"
        }), 400

    password_hash = generate_password_hash(password)

    try:
        with get_connection() as connection:

            cursor = connection.execute("""
                INSERT INTO users (
                    username, email, password_hash, created_at
                )
                VALUES (?, ?, ?, ?)
            """, (
                username,
                email,
                password_hash,
                datetime.now(timezone.utc).isoformat()
            ))

            user_id = cursor.lastrowid

            existing_devices = connection.execute(
                "SELECT id FROM devices ORDER BY id"
            ).fetchall()

            assigned_at = datetime.now(timezone.utc).isoformat()

            connection.executemany("""
                INSERT INTO user_devices (
                    user_id, device_id, access_role, assigned_at
                )
                VALUES (?, ?, ?, ?)
            """, [
                (user_id, device["id"], "owner", assigned_at)
                for device in existing_devices
            ])

            connection.commit()

        return jsonify({
            "message": "Registration successful",
            "user_id": user_id,
            "username": username,
            "assigned_devices": len(existing_devices)
        }), 201

    except sqlite3.IntegrityError:
        return jsonify({
            "error": "Username or email already exists"
        }), 409

    except Exception:
        app.logger.exception("Registration failed")
        return jsonify({"error": "Registration failed"}), 500


# --------------------------------------------------
# USER LOGIN
# --------------------------------------------------

@app.route("/api/auth/login", methods=["POST"])
def login_user():

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON"}), 400

    email = str(data.get("email", "")).strip().lower()
    password = data.get("password")

    if not email or not isinstance(password, str) or not password:
        return jsonify({
            "error": "Email and password are required"
        }), 400

    with get_connection() as connection:

        user = connection.execute("""
            SELECT id, username, email, password_hash
            FROM users
            WHERE email = ?
        """, (email,)).fetchone()

    if user is None or not check_password_hash(
        user["password_hash"], password
    ):
        return jsonify({
            "error": "Invalid email or password"
        }), 401

    session.clear()
    session["user_id"] = user["id"]
    session["username"] = user["username"]
    session.permanent = True

    return jsonify({
        "message": "Login successful",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"]
        }
    }), 200


# --------------------------------------------------
# CHECK LOGGED-IN USER
# --------------------------------------------------

@app.route("/api/auth/me", methods=["GET"])
def current_user():

    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"error": "Please log in"}), 401

    with get_connection() as connection:

        user = connection.execute("""
            SELECT id, username, email, created_at
            FROM users
            WHERE id = ?
        """, (user_id,)).fetchone()

    if user is None:
        session.clear()
        return jsonify({"error": "User not found"}), 401

    return jsonify(dict(user)), 200


# --------------------------------------------------
# LOGOUT
# --------------------------------------------------

@app.route("/api/auth/logout", methods=["POST"])
def logout_user():

    session.clear()

    return jsonify({
        "message": "Logged out successfully"
    }), 200


# --------------------------------------------------
# SESSION AUTHENTICATION HELPER
# --------------------------------------------------

def get_logged_in_user_id():

    return session.get("user_id")

# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.route("/api/health", methods=["GET"])
def health():

    return jsonify({
        "status": "online",
        "service": "Smart Home Security API"
    })


# --------------------------------------------------
# DASHBOARD
# --------------------------------------------------

@app.route("/api/dashboard", methods=["GET"])
def dashboard():

    with get_connection() as connection:

        device_count = connection.execute(
            "SELECT COUNT(*) FROM devices"
        ).fetchone()[0]

        event_count = connection.execute(
            "SELECT COUNT(*) FROM traffic_events"
        ).fetchone()[0]

        alert_count = connection.execute(
            "SELECT COUNT(*) FROM security_incidents"
        ).fetchone()[0]

    return jsonify({
        "devices": device_count,
        "events": event_count,
        "alerts": alert_count
    })


# --------------------------------------------------
# GET ALL DEVICES (EXISTING API)
# --------------------------------------------------

@app.route("/api/devices", methods=["GET"])
def devices():

    with get_connection() as connection:

        rows = connection.execute("""
            SELECT * FROM devices
            ORDER BY device_name
        """).fetchall()

    return jsonify([dict(row) for row in rows])


# --------------------------------------------------
# GET DEVICES ASSIGNED TO LOGGED-IN USER
# --------------------------------------------------

@app.route("/api/my/devices", methods=["GET"])
def get_my_devices():

    user_id = get_logged_in_user_id()

    if not user_id:
        return jsonify({"error": "Please log in"}), 401

    with get_connection() as connection:

        rows = connection.execute("""
            SELECT
                d.*,
                ud.access_role,
                ud.assigned_at
            FROM devices d
            INNER JOIN user_devices ud
                ON d.id = ud.device_id
            WHERE ud.user_id = ?
            ORDER BY d.device_name
        """, (user_id,)).fetchall()

    return jsonify([dict(row) for row in rows])


# --------------------------------------------------
# NETWORK TRAFFIC
# --------------------------------------------------

@app.route("/api/traffic", methods=["GET"])
def traffic():

    with get_connection() as connection:

        rows = connection.execute("""
            SELECT *
            FROM packet_events
            ORDER BY id DESC
            LIMIT 100
        """).fetchall()

    return jsonify([dict(row) for row in rows])


# --------------------------------------------------
# PACKET EVENTS + INTRUSION DETECTION
# --------------------------------------------------

@app.route("/api/packet-events", methods=["POST"])
def record_packet():

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

        source_ip = str(data["source_ip"])
        destination_ip = str(data["destination_ip"])
        protocol = str(data["protocol"]).upper()
        tcp_flags = str(data.get("tcp_flags", ""))

        source_port = data.get("source_port")
        destination_port = data.get("destination_port")

        timestamp = datetime.now(timezone.utc).isoformat()

        # Store packet event.

        with get_connection() as connection:

            cursor = connection.execute("""
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
            """, (
                timestamp,
                source_ip,
                destination_ip,
                source_port,
                destination_port,
                protocol,
                packet_size,
                tcp_flags
            ))

            packet_id = cursor.lastrowid
            connection.commit()

        # Prepare packet for IDS.

        packet_data = {
            "timestamp": timestamp,
            "src_ip": source_ip,
            "dst_ip": destination_ip,
            "src_port": source_port,
            "dst_port": destination_port,
            "protocol": protocol,
            "packet_size": packet_size,
            "flags": tcp_flags
        }

        # Detect suspicious activity.

        detected_events = detector.analyze_packet(packet_data)

        saved_incidents = []

        for detected_event in detected_events:

            incident = analyze_incident(detected_event)
            response = handle_incident(incident)

            with get_connection() as connection:

                cursor = connection.execute("""
                    INSERT INTO security_incidents (
                        source_ip,
                        destination_ip,
                        attack_type,
                        severity,
                        description,
                        evidence_count,
                        status,
                        timestamp
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    incident["source_ip"],
                    incident["destination_ip"],
                    incident["attack_type"],
                    incident["severity"],
                    incident["description"],
                    incident["evidence_count"],
                    incident["status"],
                    incident["timestamp"]
                ))

                incident_id = cursor.lastrowid

                connection.execute("""
                    INSERT INTO response_logs (
                        incident_id,
                        source_ip,
                        attack_type,
                        severity,
                        action,
                        message,
                        status,
                        timestamp
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    incident_id,
                    response["source_ip"],
                    response["attack_type"],
                    response["severity"],
                    response["action"],
                    response["message"],
                    response["status"],
                    response["timestamp"]
                ))

                connection.commit()

            saved_incidents.append({
                "incident_id": incident_id,
                "incident": incident,
                "response": response
            })

        return jsonify({
            "message": "Packet recorded and analyzed",
            "packet_id": packet_id,
            "detected_incidents": saved_incidents
        }), 201

    except (ValueError, TypeError):
        return jsonify({"error": "Invalid packet data"}), 400

    except Exception:
        app.logger.exception("Packet processing failed")
        return jsonify({
            "error": "Packet processing failed"
        }), 500

# --------------------------------------------------
# DEVICE REGISTRATION
# --------------------------------------------------

@app.route("/api/devices/register", methods=["POST"])
def register_device():

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

            connection.execute("""
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
            """, (
                device_name,
                device_type,
                source_ip,
                json.dumps(reading),
                timestamp or datetime.now(timezone.utc).isoformat()
            ))

            connection.commit()

        return jsonify({
            "message": "Device registered successfully",
            "device_name": device_name
        }), 201

    except Exception:
        app.logger.exception("Device registration failed")
        return jsonify({
            "error": "Device registration failed"
        }), 500


# --------------------------------------------------
# TRAFFIC STATISTICS
# --------------------------------------------------

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


# --------------------------------------------------
# SECURITY INCIDENT APIs
# --------------------------------------------------

@app.route("/api/incidents", methods=["GET"])
def get_incidents():

    with get_connection() as connection:

        rows = connection.execute("""
            SELECT *
            FROM security_incidents
            ORDER BY incident_id DESC
        """).fetchall()

    return jsonify([dict(row) for row in rows])


@app.route("/api/incidents/<int:incident_id>", methods=["GET"])
def get_incident(incident_id):

    with get_connection() as connection:

        row = connection.execute("""
            SELECT *
            FROM security_incidents
            WHERE incident_id = ?
        """, (incident_id,)).fetchone()

    if row is None:
        return jsonify({"error": "Incident not found"}), 404

    return jsonify(dict(row))


# --------------------------------------------------
# RESPONSE LOG APIs
# --------------------------------------------------

@app.route("/api/response-logs", methods=["GET"])
def get_response_logs():

    with get_connection() as connection:

        rows = connection.execute("""
            SELECT *
            FROM response_logs
            ORDER BY response_id DESC
        """).fetchall()

    return jsonify([dict(row) for row in rows])


# --------------------------------------------------
# DOCKER CLIENT
# --------------------------------------------------

docker_client = docker.from_env()

DEVICE_CONTAINERS = {
    "camera": "smart-camera",
    "lock": "smart-lock",
    "temperature": "temperature-sensor"
}


# --------------------------------------------------
# DEVICE CONTROL
# --------------------------------------------------

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
        return jsonify({"error": "Docker operation failed"}), 500


# --------------------------------------------------
# DEVICE STATUS
# --------------------------------------------------

@app.route("/api/devices/status", methods=["GET"])
def get_device_status():

    try:

        containers = {
            "camera": "smart-camera",
            "door_lock": "smart-lock",
            "sensor": "temperature-sensor"
        }

        statuses = {}

        for device_id, container_name in containers.items():

            try:
                container = docker_client.containers.get(container_name)
                container.reload()

                statuses[device_id] = (
                    container.status == "running"
                )

            except docker.errors.NotFound:
                statuses[device_id] = False

        return jsonify(statuses), 200

    except Exception:
        app.logger.exception("Unable to retrieve device statuses")
        return jsonify({
            "error": "Unable to retrieve device statuses"
        }), 500

# --------------------------------------------------
# RUN FLASK APPLICATION
# --------------------------------------------------

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5001,
        debug=True
    )
