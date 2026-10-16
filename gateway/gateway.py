import json
import socket
import threading
import logging
from datetime import datetime, timezone
from urllib.request import Request, urlopen

from scapy.all import sniff, IP, TCP, UDP

import json
from urllib.request import Request, urlopen

DEVICE_API_URL = "http://host.docker.internal:5001/api/devices/register"
# Configuration
GATEWAY_HOST = "0.0.0.0"
GATEWAY_PORT = 9000

API_URL = "http://host.docker.internal:5001/api/packet-events"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)


# --------------------------------------------------
# NETWORK TRAFFIC MONITORING
# --------------------------------------------------

def process_packet(packet):
    """Extract metadata from an observed IP packet."""

    if IP not in packet:
        return

    source_ip = packet[IP].src
    destination_ip = packet[IP].dst

    source_port = None
    destination_port = None
    protocol = "OTHER"
    tcp_flags = ""

    if TCP in packet:
        source_port = packet[TCP].sport
        destination_port = packet[TCP].dport
        protocol = "TCP"
        tcp_flags = str(packet[TCP].flags)

    elif UDP in packet:
        source_port = packet[UDP].sport
        destination_port = packet[UDP].dport
        protocol = "UDP"

    # Ignore packets used to report packet records to the Flask API.
    if source_port == 5001 or destination_port == 5001:
        return

    event = {
        "source_ip": source_ip,
        "destination_ip": destination_ip,
        "source_port": source_port,
        "destination_port": destination_port,
        "protocol": protocol,
        "packet_size": len(packet),
        "tcp_flags": tcp_flags
    }

    logging.info(
        "PACKET | %s:%s -> %s:%s | Protocol=%s | Size=%s bytes",
        source_ip,
        source_port,
        destination_ip,
        destination_port,
        protocol,
        len(packet)
    )

    try:
        body = json.dumps(event).encode("utf-8")

        request = Request(
            API_URL,
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST"
        )

        with urlopen(request, timeout=2) as response:
            if response.status != 201:
                logging.warning(
                    "Packet API returned HTTP %s",
                    response.status
                )

    except Exception as error:
        logging.warning("Packet storage failed: %s", error)


def start_packet_monitor():
    """Capture IP traffic visible on the gateway interface."""

    logging.info("Starting packet monitor on eth0")

    try:
        sniff(
            iface="eth0",
            filter="ip and (tcp or udp)",
            prn=process_packet,
            store=False
        )

    except Exception:
        logging.exception("Packet monitor stopped unexpectedly")


# --------------------------------------------------
# IOT GATEWAY
# --------------------------------------------------

def handle_device_connection(client_socket, client_address):
    """Receive newline-delimited JSON messages from IoT devices."""

    source_ip, source_port = client_address

    logging.info(
        "DEVICE CONNECTION | Source=%s:%s",
        source_ip,
        source_port
    )

    try:
        buffer = b""

        while True:
            data = client_socket.recv(4096)

            if not data:
                break

            buffer += data

            while b"\n" in buffer:
                line, buffer = buffer.split(b"\n", 1)

                if not line.strip():
                    continue

                try:
                    message = json.loads(line.decode("utf-8"))
                    register_device(message, source_ip)

                    logging.info(
                        "DEVICE EVENT | Source IP=%s | Data=%s",
                        source_ip,
                        message
                    )

                except (json.JSONDecodeError, UnicodeDecodeError):
                    logging.warning(
                        "Invalid JSON received from %s:%s",
                        source_ip,
                        source_port
                    )

        # Handle a final message if the sender closes without a newline.
        if buffer.strip():
            try:
                message = json.loads(buffer.decode("utf-8"))

                logging.info(
                    "DEVICE EVENT | Source IP=%s | Data=%s",
                    source_ip,
                    message
                )

            except (json.JSONDecodeError, UnicodeDecodeError):
                logging.warning(
                    "Invalid final message from %s:%s",
                    source_ip,
                    source_port
                )

    except OSError:
        logging.exception(
            "Connection error for %s:%s",
            source_ip,
            source_port
        )

    finally:
        client_socket.close()
        logging.info(
            "DEVICE DISCONNECTED | Source=%s:%s",
            source_ip,
            source_port
        )


def start_gateway_server():
    """Accept incoming TCP connections from simulated IoT devices."""

    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

    server.bind((GATEWAY_HOST, GATEWAY_PORT))
    server.listen()

    logging.info(
        "Smart Home Gateway listening on %s:%s",
        GATEWAY_HOST,
        GATEWAY_PORT
    )

    try:
        while True:
            client_socket, client_address = server.accept()

            threading.Thread(
                target=handle_device_connection,
                args=(client_socket, client_address),
                daemon=True
            ).start()

    finally:
        server.close()

def register_device(message, source_ip):
    payload = {
        "device_name": message.get("device_name"),
        "device_type": message.get("device_type"),
        "source_ip": source_ip,
        "reading": message.get("reading"),
        "timestamp": message.get("timestamp")
    }

    try:
        body = json.dumps(payload).encode("utf-8")

        request = Request(
            DEVICE_API_URL,
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST"
        )

        with urlopen(request, timeout=3) as response:
            print(
                f"Device registration response: {response.status}",
                flush=True
            )

    except Exception as error:
        print(
            f"Device registration failed: {error}",
            flush=True
        )
# --------------------------------------------------
# APPLICATION ENTRY POINT
# --------------------------------------------------

if __name__ == "__main__":
    threading.Thread(
        target=start_packet_monitor,
        daemon=True
    ).start()

    start_gateway_server()