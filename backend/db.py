"""
Yatra Now - Database Management & Cloud Sync Engine
Supports Free Online Database Backend (Supabase / PostgreSQL) + Local Embedded SQLite
"""

import sqlite3
import os
import json

DB_FILE = os.path.join(os.path.dirname(__file__), "yatranow.db")
# Optional Free Supabase / PostgreSQL Connection String
SUPABASE_DB_URL = os.getenv("SUPABASE_DATABASE_URL", None)

def get_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Users Table (Gov ID, 2FA, Role, License)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        mobile TEXT,
        gender TEXT,
        dob TEXT,
        role TEXT NOT NULL,
        address TEXT,
        license_number TEXT,
        license_url TEXT,
        two_factor_secret TEXT,
        is_verified INTEGER DEFAULT 0
    )
    """)

    # Depots Table (Government Depots & Fleet Owners)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS depots (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT,
        branch_code TEXT,
        is_government INTEGER DEFAULT 1,
        total_buses INTEGER DEFAULT 0,
        verified INTEGER DEFAULT 0
    )
    """)

    # Buses Table (Live Telemetry, Reg No, Route)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS buses (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        bus_number TEXT NOT NULL,
        registration_number TEXT UNIQUE NOT NULL,
        depot_id TEXT,
        origin TEXT,
        destination TEXT,
        status TEXT DEFAULT 'running',
        speed REAL DEFAULT 0,
        bearing REAL DEFAULT 0,
        delay_minutes INTEGER DEFAULT 0,
        driver_name TEXT,
        driver_mobile TEXT,
        conductor_name TEXT,
        conductor_mobile TEXT,
        current_lat REAL,
        current_lng REAL,
        FOREIGN KEY(depot_id) REFERENCES depots(id)
    )
    """)

    # Route Sequential Stops Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS route_stops (
        id TEXT PRIMARY KEY,
        bus_id TEXT,
        stop_name TEXT NOT NULL,
        lat REAL,
        lng REAL,
        stop_order INTEGER,
        scheduled_time TEXT,
        actual_time TEXT,
        delay_minutes INTEGER DEFAULT 0,
        FOREIGN KEY(bus_id) REFERENCES buses(id)
    )
    """)

    # Incident & Breakdown Reports
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS incident_reports (
        id TEXT PRIMARY KEY,
        bus_id TEXT,
        issue_type TEXT NOT NULL,
        description TEXT,
        reported_by TEXT,
        timestamp TEXT,
        status TEXT DEFAULT 'active',
        visible_to_public INTEGER DEFAULT 1,
        FOREIGN KEY(bus_id) REFERENCES buses(id)
    )
    """)

    conn.commit()
    seed_initial_data(cursor, conn)
    conn.close()

def seed_initial_data(cursor, conn):
    cursor.execute("SELECT COUNT(*) FROM depots")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO depots VALUES 
        ('depot_01', 'Central City State Transport Depot', 'Majestic Hub, Central Junction', 'CSTD-01', 1, 48, 1),
        ('depot_02', 'Metro Link Private Fleet Operators', 'North Bypass Highway Terminal', 'MLPF-09', 0, 24, 1),
        ('depot_03', 'Eastern Suburban Transport Depot', 'Tech Valley Ring Road Terminal', 'ESTD-04', 1, 30, 0)
        """)

        cursor.execute("""
        INSERT INTO buses VALUES
        ('bus_101', 'City Superfast Express', '104-A', 'KA-01-F-9821', 'depot_01', 'Central Bus Terminal', 'Tech Valley Metro Complex', 'running', 42.0, 65.0, 0, 'Ramesh Kumar', '+91 94451 12345', 'Suresh Babu', '+91 94451 12346', 12.9716, 77.5946),
        ('bus_102', 'Rapid Metro Rider', '204-B', 'DL-01-AB-4509', 'depot_02', 'Airport Gateway Terminal', 'Central Railway Station', 'running', 54.0, 185.0, 14, 'Vikas Deshmukh', '+91 98231 65432', 'Mohan Lal', '+91 98231 65433', 12.9980, 77.5920),
        ('bus_103', 'Suburban Green Cruiser', '302-C', 'MH-12-Q-7788', 'depot_01', 'University North Gate', 'South End Circle', 'running', 38.0, 140.0, 8, 'Jagdish Rao', '+91 97123 44556', 'Anand Verma', '+91 97123 44557', 12.9645, 77.5855),
        ('bus_104', 'Eastern Interstate Shuttle', '505-X', 'TN-09-BK-3312', 'depot_03', 'Silk Board Junction', 'Tech Valley Metro Complex', 'idle', 0.0, 0.0, 0, 'K. Balaji', '+91 98840 99881', 'Pradeep Chandran', '+91 98840 99882', 12.9175, 77.6235)
        """)

        cursor.execute("""
        INSERT INTO incident_reports VALUES
        ('inc_01', 'bus_102', 'Vehicle Breakdown', 'Radiator coolant overheating near Hebbal Flyover. Mechanic team requested.', 'Vikas Deshmukh (Driver)', '10 mins ago', 'investigating', 1)
        """)

        conn.commit()

if __name__ == "__main__":
    init_db()
    print("Database initialized and seeded successfully.")
