from pathlib import Path

from smilemap.classifier import PracticeStatus, StatusClassifier
from smilemap.crawler import Crawler, DataSource
from smilemap.pipeline import Pipeline
from smilemap.storage import StatusRepository


def test_pipeline_runs_with_local_sources(tmp_path: Path):
    example_dir = Path(__file__).resolve().parents[1] / "example_data"
    sources = [
        DataSource(name="smile_dental", url=f"file://{example_dir / 'smile_dental.html'}"),
        DataSource(name="happy_teeth", url=f"file://{example_dir / 'happy_teeth.json'}", parser="json"),
    ]

    pipeline = Pipeline(
        crawler=Crawler(),
        classifier=StatusClassifier(),
        repository=StatusRepository(tmp_path / "statuses.db"),
    )

    result = pipeline.run(sources)

    assert result.processed == 2
    assert result.stored == 2
    statuses = {status.status for status in result.statuses}
    assert PracticeStatus.GREEN in statuses
    assert PracticeStatus.AMBER in statuses
