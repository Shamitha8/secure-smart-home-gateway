
from ids import detector, analyze_incident, handle_incident

print("Starting IDS test...\n")

# Generate 20 simulated TCP SYN packets.
for i in range(20):

    event = {
        "src_ip": "192.168.1.100",
        "dst_ip": "192.168.1.200",
        "src_port": 45000 + i,
        "dst_port": 80,
        "protocol": "TCP",
        "packet_size": 60,
        "flags": "S"
    }

    detected = detector.analyze_packet(event)

    for item in detected:

        incident = analyze_incident(item)
        response = handle_incident(incident)

        print("INTRUSION DETECTED")
        print("Incident:", incident)
        print("Response:", response)
