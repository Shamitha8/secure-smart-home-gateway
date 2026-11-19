
# backend/ids/incident_analyzer.py

from datetime import datetime, timezone

from . import rules


def analyze_incident(detected_event):
    """
    Convert a detected event into a structured security incident.
    """

    attack_type = detected_event.get("attack_type")

    severity = rules.SEVERITY_LEVELS.get(
        attack_type, "LOW"
    )

    incident = {
        "source_ip": detected_event.get("source_ip"),
        "destination_ip": detected_event.get("destination_ip"),
        "attack_type": attack_type,
        "severity": severity,
        "description": detected_event.get("description"),
        "evidence_count": detected_event.get("evidence_count", 0),
        "status": "NEW",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    return incident
