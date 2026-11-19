
from ids.detector import IntrusionDetector
from ids.incident_analyzer import analyze_incident
from ids.response_engine import handle_incident

detector = IntrusionDetector()

print("Starting High Traffic Detection Test...\n")

for i in range(11):
    packet = {
        "src_ip": "192.168.1.170",
        "dst_ip": "192.168.1.200",
        "src_port": 5000 + i,
        "dst_port": 80,
        "protocol": "UDP",
        "packet_size": 100000,
        "flags": ""
    }

    detections = detector.analyze_packet(packet)

    for detection in detections:
        incident = analyze_incident(detection)
        response = handle_incident(incident)

        print("HIGH TRAFFIC DETECTED")
        print("\nIncident:", incident)
        print("\nResponse:", response)
