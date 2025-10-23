"""Crawler definitions for SmileMap."""
from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, Iterable, Iterator, List, Optional
from urllib.error import URLError
from urllib.request import Request, urlopen


LOGGER = logging.getLogger(__name__)


@dataclass
class DataSource:
    """Represents a single target to crawl."""

    name: str
    url: str
    parser: str = "generic"


@dataclass
class CrawledEntry:
    """Single crawled result."""

    practice_id: str
    fetched_at: datetime
    content: str
    source: DataSource


class Crawler:
    """Very lightweight crawler that supports HTTP and local file sources."""

    def __init__(self, timeout: float = 10.0, user_agent: str = "SmileMapBot/0.1") -> None:
        self.timeout = timeout
        self.user_agent = user_agent

    def fetch(self, source: DataSource) -> Optional[str]:
        """Fetch the raw content for a source."""

        if source.url.startswith("file://"):
            path = Path(source.url[len("file://") :])
            if not path.exists():
                LOGGER.warning("Local file %s missing", path)
                return None
            return path.read_text(encoding="utf-8")

        request = Request(source.url, headers={"User-Agent": self.user_agent})
        try:
            with urlopen(request, timeout=self.timeout) as response:
                return response.read().decode("utf-8", errors="ignore")
        except URLError as exc:  # pragma: no cover - defensive logging
            LOGGER.error("Failed to fetch %s: %s", source.url, exc)
            return None

    def crawl(self, sources: Iterable[DataSource]) -> Iterator[CrawledEntry]:
        """Iterate over crawl results."""

        for source in sources:
            raw = self.fetch(source)
            if raw is None:
                continue
            practice_id, content = self._parse(source, raw)
            yield CrawledEntry(practice_id=practice_id, fetched_at=datetime.utcnow(), content=content, source=source)

    def _parse(self, source: DataSource, raw: str) -> tuple[str, str]:
        if source.parser == "json":
            data = json.loads(raw)
            practice_id = data.get("practice_id", source.name)
            content = data.get("content", "")
        else:
            practice_id = source.name
            content = raw
        return practice_id, content


def load_sources_from_file(path: Path) -> List[DataSource]:
    """Load data sources from a JSON file."""

    data: Dict[str, Dict[str, str]] = json.loads(path.read_text(encoding="utf-8"))
    return [DataSource(name=name, **config) for name, config in data.items()]
