"""
Incremental migration runner for SQLite.

Usage:
    python migrate.py              # Apply all pending migrations
    python migrate.py --up         # Apply the next pending migration only
    python migrate.py --down       # Rollback the last applied migration
    python migrate.py --status     # Show migration status
"""

import os
import sys
import sqlite3
from db import get_connection

MIGRATIONS_DIR = os.path.join(os.path.dirname(__file__), "migrations")


def ensure_migrations_table(conn: sqlite3.Connection) -> None:
    conn.execute("""
        CREATE TABLE IF NOT EXISTS _migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT UNIQUE NOT NULL,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()


def get_applied_migrations(conn: sqlite3.Connection) -> list[str]:
    """Return applied migration filenames in sorted order."""
    rows = conn.execute("SELECT filename FROM _migrations ORDER BY filename").fetchall()
    return [row["filename"] for row in rows]


def get_all_migration_files() -> list[str]:
    """Return all up-migration filenames sorted."""
    return sorted(
        f for f in os.listdir(MIGRATIONS_DIR)
        if f.endswith(".sql") and not f.endswith(".down.sql")
    )


def get_pending_migrations(conn: sqlite3.Connection) -> list[str]:
    applied = set(get_applied_migrations(conn))
    return [f for f in get_all_migration_files() if f not in applied]


def apply_migration(conn: sqlite3.Connection, filename: str) -> None:
    filepath = os.path.join(MIGRATIONS_DIR, filename)
    with open(filepath, "r") as f:
        sql = f.read()

    print(f"  Applying {filename}...")
    conn.executescript(sql)
    conn.execute(
        "INSERT INTO _migrations (filename) VALUES (?)",
        (filename,),
    )
    conn.commit()
    print(f"  Done.")


def rollback_migration(conn: sqlite3.Connection, filename: str) -> None:
    # Look for a corresponding .down.sql file
    down_filename = filename.replace(".sql", ".down.sql")
    down_filepath = os.path.join(MIGRATIONS_DIR, down_filename)

    if not os.path.exists(down_filepath):
        print(f"  ERROR: No down migration found ({down_filename})")
        print(f"  Create {down_filename} with the rollback SQL and retry.")
        sys.exit(1)

    with open(down_filepath, "r") as f:
        sql = f.read()

    print(f"  Rolling back {filename}...")
    conn.executescript(sql)
    conn.execute("DELETE FROM _migrations WHERE filename = ?", (filename,))
    conn.commit()
    print(f"  Done.")


def run_all() -> None:
    """Apply all pending migrations."""
    conn = get_connection()
    try:
        ensure_migrations_table(conn)
        pending = get_pending_migrations(conn)

        if not pending:
            print("No pending migrations.")
            return

        print(f"Found {len(pending)} pending migration(s):")
        for filename in pending:
            apply_migration(conn, filename)

        print("All migrations applied successfully.")
    finally:
        conn.close()


def run_up() -> None:
    """Apply the next pending migration only."""
    conn = get_connection()
    try:
        ensure_migrations_table(conn)
        pending = get_pending_migrations(conn)

        if not pending:
            print("No pending migrations.")
            return

        apply_migration(conn, pending[0])
    finally:
        conn.close()


def run_down() -> None:
    """Rollback the last applied migration."""
    conn = get_connection()
    try:
        ensure_migrations_table(conn)
        applied = get_applied_migrations(conn)

        if not applied:
            print("No applied migrations to rollback.")
            return

        last = applied[-1]
        rollback_migration(conn, last)
    finally:
        conn.close()


def show_status() -> None:
    conn = get_connection()
    try:
        ensure_migrations_table(conn)
        applied = set(get_applied_migrations(conn))
        all_files = get_all_migration_files()

        print("Migration status:")
        for f in all_files:
            status = "APPLIED" if f in applied else "PENDING"
            print(f"  [{status}] {f}")

        if not all_files:
            print("  No migration files found.")
    finally:
        conn.close()


if __name__ == "__main__":
    if "--status" in sys.argv:
        show_status()
    elif "--up" in sys.argv:
        run_up()
    elif "--down" in sys.argv:
        run_down()
    else:
        run_all()
