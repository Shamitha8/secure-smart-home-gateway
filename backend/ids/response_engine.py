
# backend/ids/response_engine.py

from datetime import datetime, timezone


def handle_incident(incident):
    """
    Select a response based on incident severity.

    This initial version only generates response decisions.
    It does not perform actual IP blocking.
    """

    severity = incident.get("severity")
    attack_type = incident.get("attack_type")

    if severity == "HIGH":
        action = "ADMIN_ALERT"
        message = (
            "High-severity incident detected. "
            "Administrator investigation is required."
        )

    elif severity == "MEDIUM":
        action = "SECURITY_ALERT"
        message = (
            "Suspicious network activity detected. "
            "Administrator should review the incident."
        )

    else:
        action = "LOG_ONLY"
        message = "Security event recorded for monitoring."

    response = {
        "source_ip": incident.get("source_ip"),
        "attack_type": attack_type,
        "severity": severity,
        "action": action,
        "message": message,
        "status": "GENERATED",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    return response
