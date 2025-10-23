"""Persistence helpers for SmileMap statuses."""
from __future__ import annotations

import sqlite3
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterable, List, Optional

from .classifier import PracticeStatus


@dataclass
class StatusRecord:
    practice_id: str
    status: PracticeStatus
    confidence: float
    source: str
    fetched_at: datetime
    content: str


class StatusRepository:
    """SQLite-backed repository for storing practice statuses."""

    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        self._ensure_schema()

    def _ensure_schema(self) -> None:
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS practice_status (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    practice_id TEXT NOT NULL,
                    status TEXT NOT NULL,
                    confidence REAL NOT NULL,
                    source TEXT NOT NULL,
                    fetched_at TEXT NOT NULL,
                    content TEXT
                )
                """
            )
            conn.commit()

    def add_records(self, records: Iterable[StatusRecord]) -> None:
        with sqlite3.connect(self.db_path) as conn:
            conn.executemany(
                """
                INSERT INTO practice_status (
                    practice_id, status, confidence, source, fetched_at, content
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                [
                    (
                        record.practice_id,
                        record.status.value,
                        record.confidence,
                        record.source,
                        record.fetched_at.isoformat(),
                        record.content,
                    )
                    for record in records
                ],
            )
            conn.commit()

    def latest_status(self, practice_id: str) -> Optional[StatusRecord]:
        with sqlite3.connect(self.db_path) as conn:
            row = conn.execute(
                """
                SELECT practice_id, status, confidence, source, fetched_at, content
                FROM practice_status
                WHERE practice_id = ?
                ORDER BY datetime(fetched_at) DESC
                LIMIT 1
                """,
                (practice_id,),
            ).fetchone()
        if row is None:
            return None
        return StatusRecord(
            practice_id=row[0],
            status=PracticeStatus(row[1]),
            confidence=row[2],
            source=row[3],
            fetched_at=datetime.fromisoformat(row[4]),
            content=row[5],
        )

    def list_statuses(self) -> List[StatusRecord]:
        with sqlite3.connect(self.db_path) as conn:
            rows = conn.execute(
                """
                SELECT practice_id, status, confidence, source, fetched_at, content
                FROM practice_status
                ORDER BY datetime(fetched_at) DESC
                """
            ).fetchall()
        return [
            StatusRecord(
                practice_id=row[0],
                status=PracticeStatus(row[1]),
                confidence=row[2],
                source=row[3],
                fetched_at=datetime.fromisoformat(row[4]),
                content=row[5],
            )
            for row in rows
        ]
