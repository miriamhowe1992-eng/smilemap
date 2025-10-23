"""End-to-end pipeline orchestration."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterable, List

from .classifier import ClassificationResult, PracticeStatus, StatusClassifier
from .crawler import CrawledEntry, Crawler, DataSource
from .storage import StatusRecord, StatusRepository


@dataclass
class PipelineResult:
    """Holds the summary for a pipeline run."""

    processed: int
    stored: int
    statuses: List[ClassificationResult]


class Pipeline:
    """Simple orchestrator that ties together the crawler, classifier, and storage."""

    def __init__(
        self,
        crawler: Crawler,
        classifier: StatusClassifier,
        repository: StatusRepository,
    ) -> None:
        self.crawler = crawler
        self.classifier = classifier
        self.repository = repository

    def run(self, sources: Iterable[DataSource]) -> PipelineResult:
        crawled: List[CrawledEntry] = list(self.crawler.crawl(sources))
        statuses: List[ClassificationResult] = []
        records: List[StatusRecord] = []

        for entry in crawled:
            classification = self.classifier.classify(entry.content)
            statuses.append(classification)
            records.append(
                StatusRecord(
                    practice_id=entry.practice_id,
                    status=classification.status,
                    confidence=classification.confidence,
                    source=entry.source.url,
                    fetched_at=entry.fetched_at,
                    content=entry.content,
                )
            )

        if records:
            self.repository.add_records(records)

        return PipelineResult(
            processed=len(crawled),
            stored=len(records),
            statuses=statuses,
        )

    def manual_override(
        self,
        practice_id: str,
        status: PracticeStatus,
        confidence: float,
        note: str,
        timestamp: datetime | None = None,
    ) -> None:
        """Allow humans to override a status."""

        record = StatusRecord(
            practice_id=practice_id,
            status=status,
            confidence=confidence,
            source="manual-override",
            fetched_at=timestamp or datetime.utcnow(),
            content=note,
        )
        self.repository.add_records([record])
