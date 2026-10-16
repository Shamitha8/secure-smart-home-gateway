FROM python:3.12-slim

WORKDIR /app

# Install libpcap and packet-capture dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpcap0.8 && \
    rm -rf /var/lib/apt/lists/*

# Install Scapy
RUN pip install --no-cache-dir scapy

# Copy the monitoring program
COPY monitoring/sniffer.py /app/sniffer.py

CMD ["python", "-u", "sniffer.py"]