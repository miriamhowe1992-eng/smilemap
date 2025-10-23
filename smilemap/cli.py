"""Command line entry point for running SmileMap pipeline."""
from __future__ import annotations

import argparse
import logging
from pathlib import Path

from .classifier import StatusClassifier
from .crawler import Crawler, DataSource, load_sources_from_file
from .pipeline import Pipeline
from .storage import StatusRepository


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run the SmileMap data pipeline")
    parser.add_argument("sources", type=Path, help="Path to JSON file containing data sources")
    parser.add_argument(
        "--database",
        type=Path,
        default=Path("smilemap.db"),
        help="Where to store the SQLite database",
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    logging.basicConfig(level=getattr(logging, args.log_level))

    sources = load_sources_from_file(args.sources)
    crawler = Crawler()
    classifier = StatusClassifier()
    repository = StatusRepository(args.database)
    pipeline = Pipeline(crawler=crawler, classifier=classifier, repository=repository)

    result = pipeline.run(sources)

    logging.info("Processed %s sources and stored %s records", result.processed, result.stored)
    for status in result.statuses:
        logging.info("Status: %s (confidence %.2f) - %s", status.status.value, status.confidence, status.reasons[0])

    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
