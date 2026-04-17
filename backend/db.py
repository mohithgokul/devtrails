"""
db.py — Shared database connection helper for SurakshaPay.

Railway injects DATABASE_URL as  postgres://user:pwd@host:port/db
but psycopg2 requires              postgresql://...

This module provides a single get_connection() function that all routers
import, so the URL normalisation, SSL and retry logic live in ONE place.
"""

import os
import time
import psycopg2
import psycopg2.extras


def _build_dsn() -> str:
    """
    Return a psycopg2-compatible connection string.

    Handles:
    - Railway's postgres:// prefix → postgresql://
    - Appends sslmode=require when running on Railway (DATABASE_URL set externally)
    - Falls back to localhost only when DATABASE_URL env var is absent (local dev)
    """
    raw = os.getenv("DATABASE_URL", "")

    if not raw:
        # Local dev fallback — only used when .env has no DATABASE_URL
        return "postgresql://postgres:postgres@localhost:5432/surakshapay"

    # Railway (and most cloud providers) give postgres:// — psycopg2 needs postgresql://
    if raw.startswith("postgres://"):
        raw = "postgresql://" + raw[len("postgres://"):]

    # Add SSL if not already specified (Railway requires it)
    if "sslmode" not in raw:
        separator = "&" if "?" in raw else "?"
        raw = raw + separator + "sslmode=require"

    return raw


# Module-level DSN — computed once at import time after dotenv is loaded
DATABASE_URL: str = _build_dsn()


def get_connection():
    """Return a new psycopg2 connection using the resolved DATABASE_URL."""
    return psycopg2.connect(DATABASE_URL)


def get_dict_connection():
    """Return a new psycopg2 connection with RealDictCursor factory."""
    return psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)
