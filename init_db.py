#!/usr/bin/env python3
"""
Database initialization script for RFID Attendance System
"""
import sqlite3
from datetime import datetime

def init_database():
    """Initialize the SQLite database with required tables"""

    # Connect to database
    conn = sqlite3.connect('attendance.db')
    cursor = conn.cursor()

    try:
        # Create students table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                rfid_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                course_year TEXT NOT NULL
            )
        ''')

        # Create events table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS events (
                event_id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_name TEXT NOT NULL,
                event_date TEXT NOT NULL
            )
        ''')

        # Create attendance_logs table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS attendance_logs (
                log_id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                event_id INTEGER NOT NULL,
                scan_timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(id),
                FOREIGN KEY (event_id) REFERENCES events(event_id)
            )
        ''')

        # Insert default event if none exists
        cursor.execute("SELECT COUNT(*) FROM events")
        if cursor.fetchone()[0] == 0:
            cursor.execute(
                "INSERT INTO events (event_name, event_date) VALUES (?, ?)",
                ("Default Event", datetime.now().strftime("%Y-%m-%d"))
            )

        # Commit changes
        conn.commit()
        print("✅ Database initialized successfully!")

        # Show table info
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        print(f"📋 Created tables: {[table[0] for table in tables]}")

    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    init_database()
