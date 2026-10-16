import os
import time
import random
import json
import socket
from datetime import datetime

# Device configuration
DEVICE_NAME = os.getenv("DEVICE_NAME", "Smart Device")
DEVICE_TYPE = os.getenv("DEVICE_TYPE", "sensor")
GATEWAY_HOST = os.getenv("GATEWAY_HOST", "gateway")
GATEWAY_PORT = int(os.getenv("GATEWAY_PORT", "9000"))

# Time between device readings
SEND_INTERVAL = 5


def create_device_data():
    """Generate simulated IoT device readings."""

    if DEVICE_TYPE == "camera":
        reading = random.choice([
            "idle",
            "motion_detected"
        ])

    elif DEVICE_TYPE == "door_lock":
        reading = random.choice([
            "locked",
            "unlocked"
        ])

    else:
        reading = round(
            random.uniform(20.0, 35.0),
            2
        )

    return {
        "device_name": DEVICE_NAME,
        "device_type": DEVICE_TYPE,
        "reading": reading,
        "timestamp": datetime.now().isoformat()
    }


def send_data_to_gateway(data):
    """Send one JSON reading to the smart home gateway."""

    with socket.create_connection(
        (GATEWAY_HOST, GATEWAY_PORT),
        timeout=5
    ) as connection:

        message = json.dumps(data) + "\n"

        connection.sendall(
            message.encode("utf-8")
        )


def main():
    """Continuously simulate the IoT device."""

    print(
        f"Starting device: {DEVICE_NAME}",
        flush=True
    )

    print(
        f"Device type: {DEVICE_TYPE}",
        flush=True
    )

    print(
        f"Gateway: {GATEWAY_HOST}:{GATEWAY_PORT}",
        flush=True
    )

    while True:
        data = create_device_data()

        try:
            send_data_to_gateway(data)

            print(
                f"Data sent successfully: {data}",
                flush=True
            )

        except OSError as error:
            print(
                f"Gateway connection failed: {error}",
                flush=True
            )

        time.sleep(SEND_INTERVAL)


if __name__ == "__main__":
    main()