# SmileMap Data Pipeline Prototype

This repository contains a minimal end-to-end pipeline that demonstrates how
SmileMap can fetch NHS dental practice updates, classify their NHS availability
into a red/amber/green (RAG) status, and persist the results for downstream use.

## Features

- Load practice sources from a JSON configuration file.
- Crawl HTTP or local file sources with a configurable user agent.
- Apply a transparent rule-based classifier to derive RAG statuses.
- Store status history in a SQLite database with manual override support.
- Command-line interface to run the pipeline and inspect logged output.

## Quickstart

1. **Install dependencies**

   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Create a sources file** (example `sources.json`):

   ```json
   {
     "smile_dental": {
       "url": "file://./example_data/smile_dental.html",
       "parser": "generic"
     },
     "happy_teeth": {
       "url": "file://./example_data/happy_teeth.json",
       "parser": "json"
     }
   }
   ```

3. **Run the pipeline**

   ```bash
   python -m smilemap.cli sources.json --database smilemap.db --log-level INFO
   ```

   The command logs the processed sources and stores the classification results
   in the specified SQLite database.

## Project Structure

- `smilemap/crawler.py` – Source definitions and fetch logic.
- `smilemap/classifier.py` – Explainable heuristic classifier for NHS status.
- `smilemap/storage.py` – SQLite repository for status history.
- `smilemap/pipeline.py` – Orchestration tying together the crawler, classifier,
  and storage layers.
- `smilemap/cli.py` – Command line interface for running the pipeline.

## Next Steps

- Expand the crawler to respect robots.txt, handle pagination, and extract
  structured content with BeautifulSoup.
- Replace heuristics with a trainable model and confidence calibration.
- Build a dashboard to visualise trends and allow practice feedback loops.
- Integrate alerting and monetisation hooks (lead generation, subscriptions).
