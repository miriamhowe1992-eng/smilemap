"""Rule-based classifier to translate text signals into SmileMap practice statuses."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Iterable, List


class PracticeStatus(Enum):
    """Possible statuses for an NHS dental practice."""

    GREEN = "green"
    AMBER = "amber"
    RED = "red"
    GREY = "grey"


@dataclass(frozen=True)
class ClassificationResult:
    """Represents the classifier output for a single text sample."""

    status: PracticeStatus
    confidence: float
    reasons: List[str]


class StatusClassifier:
    """Simple heuristic-based classifier."""

    positive_keywords = (
        "currently accepting nhs patients",
        "accepting nhs",
        "taking nhs patients",
        "open for nhs",
        "book now",
    )
    limited_keywords = (
        "limited nhs",
        "waiting list",
        "short waiting list",
        "register interest",
    )
    negative_keywords = (
        "not accepting nhs",
        "nhs list closed",
        "no nhs availability",
        "not taking nhs",
        "private only",
    )

    def classify(self, text: str) -> ClassificationResult:
        """Classify a single piece of text."""

        lowered = text.lower()
        score_green = self._score(lowered, self.positive_keywords)
        score_amber = self._score(lowered, self.limited_keywords)
        score_red = self._score(lowered, self.negative_keywords)

        if score_green == score_amber == score_red == 0:
            return ClassificationResult(
                PracticeStatus.GREY,
                0.2,
                ["No explicit information about NHS availability found."],
            )

        if score_green > max(score_amber, score_red):
            status = PracticeStatus.GREEN
            confidence = min(1.0, 0.5 + score_green * 0.3)
            reasons = ["Positive signals for NHS availability detected."]
        elif score_red >= max(score_green, score_amber):
            status = PracticeStatus.RED
            confidence = min(1.0, 0.5 + score_red * 0.3)
            reasons = ["Negative statements about NHS availability found."]
        else:
            status = PracticeStatus.AMBER
            confidence = min(1.0, 0.4 + score_amber * 0.2)
            reasons = ["Mixed or limited availability signals present."]

        return ClassificationResult(status, confidence, reasons)

    def classify_many(self, texts: Iterable[str]) -> List[ClassificationResult]:
        """Classify multiple samples, returning the highest-confidence result."""

        results = [self.classify(text) for text in texts]
        if not results:
            return [ClassificationResult(PracticeStatus.GREY, 0.0, ["No data provided."])]
        return results

    @staticmethod
    def _score(text: str, keywords: Iterable[str]) -> int:
        return sum(1 for keyword in keywords if keyword in text)
