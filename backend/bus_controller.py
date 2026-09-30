"""
Yatra Now - Bus & Fleet Controller
Manages fleet telemetry, bus registration with stops, and incident reports
"""

import json
from db import get_connection
from crypto_utils import decrypt_payload, encrypt_payload

class BusController:
    def get_all_buses(self) -> dict:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM buses")
        rows = cursor.fetchall()
        
        buses = []
        for r in rows:
            bus = dict(r)
            bus["currentPosition"] = [bus["current_lat"], bus["current_lng"]]
            bus["driver"] = {"name": bus["driver_name"], "mobile": bus["driver_mobile"]}
            bus["conductor"] = {"name": bus["conductor_name"], "mobile": bus["conductor_mobile"]}
            
            # Fetch sequential stops
            cursor.execute("SELECT * FROM route_stops WHERE bus_id = ? ORDER BY stop_order ASC", (bus["id"],))
            stops = [dict(s) for s in cursor.fetchall()]
            bus["stops"] = stops
            buses.append(bus)

        conn.close()
        return encrypt_payload({"buses": buses})

    def get_all_depots(self) -> dict:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM depots")
        depots = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return encrypt_payload({"depots": depots})

    def get_incidents(self) -> dict:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM incident_reports ORDER BY timestamp DESC")
        incidents = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return encrypt_payload({"incidents": incidents})

    def add_bus(self, encrypted_body: dict) -> dict:
        data = decrypt_payload(encrypted_body)
        conn = get_connection()
        cursor = conn.cursor()

        bus_id = f"bus_{data.get('registration_number', '').replace('-', '_').lower()}"
        cursor.execute("""
        INSERT INTO buses (id, name, bus_number, registration_number, depot_id, origin, destination, status, speed, delay_minutes, driver_name, conductor_name, current_lat, current_lng)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, 12.9716, 77.5946)
        """, (
            bus_id, data.get("name"), data.get("bus_number"), data.get("registration_number"),
            data.get("depot_id", "depot_01"), data.get("origin"), data.get("destination"),
            "running", data.get("driver_name", "Assigned Driver"), data.get("conductor_name", "Assigned Conductor")
        ))

        # Add stops
        for idx, stop in enumerate(data.get("stops", [])):
            stop_id = f"st_{bus_id}_{idx}"
            cursor.execute("""
            INSERT INTO route_stops (id, bus_id, stop_name, lat, lng, stop_order, scheduled_time, actual_time, delay_minutes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
            """, (
                stop_id, bus_id, stop.get("name"), stop.get("lat", 12.9716), stop.get("lng", 77.5946),
                idx, stop.get("time"), stop.get("time")
            ))

        conn.commit()
        conn.close()
        return encrypt_payload({"success": True, "bus_id": bus_id})

    def report_incident(self, encrypted_body: dict) -> dict:
        data = decrypt_payload(encrypted_body)
        conn = get_connection()
        cursor = conn.cursor()

        inc_id = f"inc_{int(data.get('timestamp', 0))}"
        cursor.execute("""
        INSERT INTO incident_reports (id, bus_id, issue_type, description, reported_by, timestamp, status, visible_to_public)
        VALUES (?, ?, ?, ?, ?, 'Just now', 'active', 1)
        """, (
            inc_id, data.get("bus_id"), data.get("issue_type"), data.get("description"),
            data.get("reported_by")
        ))

        # Update bus status to delayed
        cursor.execute("UPDATE buses SET delay_minutes = 20 WHERE id = ?", (data.get("bus_id"),))
        conn.commit()
        conn.close()
        return encrypt_payload({"success": True, "incident_id": inc_id})

bus_controller = BusController()
