
# backend/ids/detector.py

from collections import defaultdict, deque
from datetime import datetime, timezone
from threading import Lock
import time

from . import rules


class IntrusionDetector:

    def __init__(self):
        self.events = defaultdict(deque)
        self.last_alert = {}
        self.lock = Lock()

    def _get_value(self, event, *keys, default=None):
        """Read a field using any supported key name."""
        for key in keys:
            if event.get(key) is not None:
                return event[key]
        return default

    def _get_timestamp(self, event):
        """Use the event timestamp when available."""
        value = event.get("timestamp")

        if isinstance(value, (int, float)):
            return float(value)

        if isinstance(value, str):
            try:
                return datetime.fromisoformat(
                    value.replace("Z", "+00:00")
                ).timestamp()
            except ValueError:
                pass

        return time.time()

    def _should_alert(self, source_ip, attack_type, now):
        """Prevent repeated alerts for the same rule."""
        key = (source_ip, attack_type)
        previous = self.last_alert.get(key, 0)

        if now - previous < rules.ALERT_COOLDOWN:
            return False

        self.last_alert[key] = now
        return True

    def analyze_packet(self, event):
        """
        Analyze one packet event.

        Returns a list of detected incidents.
        An empty list means no configured rule was triggered.
        """

        source_ip = self._get_value(
            event, "src_ip", "source_ip"
        )

        if not source_ip:
            return []

        destination_ip = self._get_value(
            event, "dst_ip", "destination_ip"
        )

        destination_port = self._get_value(
            event, "dst_port", "destination_port"
        )

        packet_size = self._get_value(
            event, "packet_size", "size", default=0
        )

        protocol = self._get_value(
            event, "protocol", default=""
        )

        flags = self._get_value(
            event, "flags", default=""
        )

        try:
            packet_size = max(0, int(packet_size))
        except (ValueError, TypeError):
            packet_size = 0

        try:
            destination_port = (
                int(destination_port)
                if destination_port is not None
                else None
            )
        except (ValueError, TypeError):
            destination_port = None

        now = self._get_timestamp(event)

        with self.lock:
            history = self.events[source_ip]

            history.append({
                "time": now,
                "dst_ip": destination_ip,
                "dst_port": destination_port,
                "size": packet_size,
                "protocol": str(protocol).upper(),
                "flags": str(flags).upper()
            })

            # Remove events older than the configured time window.
            while history and now - history[0]["time"] > rules.TIME_WINDOW:
                history.popleft()

            recent_events = list(history)

            incidents = []

            # RULE 1: Repeated TCP SYN connection attempts.
            syn_attempts = [
                item for item in recent_events
                if item["protocol"] == "TCP"
                and "S" in item["flags"]
                and "A" not in item["flags"]
            ]

            if (
                len(syn_attempts)
                >= rules.CONNECTION_ATTEMPT_THRESHOLD
                and self._should_alert(
                    source_ip,
                    "repeated_connection_attempts",
                    now
                )
            ):
                incidents.append({
                    "source_ip": source_ip,
                    "destination_ip": destination_ip,
                    "attack_type": "repeated_connection_attempts",
                    "description": (
                        f"{len(syn_attempts)} TCP SYN attempts "
                        f"observed within {rules.TIME_WINDOW} seconds."
                    ),
                    "evidence_count": len(syn_attempts)
                })

            # RULE 2: Possible port scanning.
            unique_ports = {
                item["dst_port"]
                for item in recent_events
                if item["dst_port"] is not None
            }

            if (
                len(unique_ports) >= rules.PORT_SCAN_THRESHOLD
                and self._should_alert(
                    source_ip,
                    "port_scan",
                    now
                )
            ):
                incidents.append({
                    "source_ip": source_ip,
                    "destination_ip": destination_ip,
                    "attack_type": "port_scan",
                    "description": (
                        f"Connections to {len(unique_ports)} "
                        f"different destination ports observed "
                        f"within {rules.TIME_WINDOW} seconds."
                    ),
                    "evidence_count": len(unique_ports)
                })

            # RULE 3: High traffic volume.
            total_bytes = sum(
                item["size"] for item in recent_events
            )

            if (
                total_bytes >= rules.HIGH_TRAFFIC_THRESHOLD
                and self._should_alert(
                    source_ip,
                    "high_traffic",
                    now
                )
            ):
                incidents.append({
                    "source_ip": source_ip,
                    "destination_ip": destination_ip,
                    "attack_type": "high_traffic",
                    "description": (
                        f"{total_bytes} bytes observed from "
                        f"this source within {rules.TIME_WINDOW} seconds."
                    ),
                    "evidence_count": total_bytes
                })

            return incidents


# Shared detector instance for the Flask application.
detector = IntrusionDetector()
