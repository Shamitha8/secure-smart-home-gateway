
from ids import IntrusionDetector, analyze_incident, handle_incident

# Create a fresh detector for this test.
test_detector = IntrusionDetector()

print("Starting Port Scanning Detection Test...\n")

for port in range(20, 31):

    event = {
        "src_ip": "192.168.1.150",
        "dst_ip": "192.168.1.200",
        "src_port": 45000 + port,
        "dst_port": port,
        "protocol": "TCP",
        "packet_size": 60,
        "flags": "S"
    }

    detected = test_detector.analyze_packet(event)

    for item in detected:

        incident = analyze_incident(item)
        response = handle_incident(incident)

        print("PORT SCANNING DETECTED")
        print("Incident:", incident)
        print("Response:", response)
