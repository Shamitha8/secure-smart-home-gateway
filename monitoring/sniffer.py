from scapy.all import sniff, IP, TCP, UDP
from datetime import datetime


def process_packet(packet):
    if IP not in packet:
        return

    source_ip = packet[IP].src
    destination_ip = packet[IP].dst
    protocol = packet[IP].proto
    packet_size = len(packet)

    source_port = None
    destination_port = None
    protocol_name = "OTHER"

    if TCP in packet:
        protocol_name = "TCP"
        source_port = packet[TCP].sport
        destination_port = packet[TCP].dport

    elif UDP in packet:
        protocol_name = "UDP"
        source_port = packet[UDP].sport
        destination_port = packet[UDP].dport

    print(
        f"Time: {datetime.now().isoformat()} | "
        f"Source: {source_ip}:{source_port} | "
        f"Destination: {destination_ip}:{destination_port} | "
        f"Protocol: {protocol_name} | "
        f"IP Protocol Number: {protocol} | "
        f"Size: {packet_size} bytes",
        flush=True
    )


print("Starting Smart Home Network Traffic Monitor...")
print("Monitoring IP packets. Press Ctrl+C to stop.")

sniff(
    filter="ip",
    prn=process_packet,
    store=False
)