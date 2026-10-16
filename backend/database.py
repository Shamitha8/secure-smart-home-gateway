import sqlite3
from pathlib import Path

DATABASE_PATH = Path(__file__).resolve().parent / "smart_home.db"


def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    with get_connection() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS devices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_name TEXT NOT NULL UNIQUE,
                device_type TEXT NOT NULL,
                source_ip TEXT,
                latest_reading TEXT,
                last_seen TEXT
            )
        """)

        connection.execute("""
            CREATE TABLE IF NOT EXISTS traffic_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_ip TEXT,
                source_port INTEGER,
                device_name TEXT,
                device_type TEXT,
                reading TEXT,
                timestamp TEXT NOT NULL
            )
        """)
        connection.execute("""
    CREATE TABLE IF NOT EXISTS packet_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        source_ip TEXT,
        destination_ip TEXT,
        source_port INTEGER,
        destination_port INTEGER,
        protocol TEXT,
        packet_size INTEGER,
        tcp_flags TEXT
    )
""")

        connection.commit()


if __name__ == "__main__":
    initialize_database()
    print(f"Database initialized at: {DATABASE_PATH}")