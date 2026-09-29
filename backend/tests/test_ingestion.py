import pytest

from backend.app.ingestion.base import SourceIngestion
from backend.app.ingestion.sources import LastGoodSnapshots, run_resilient


class DownSource(SourceIngestion):
    source_name = "down"
    def fetch(self): raise RuntimeError("provider down")
    def normalize(self, raw): return raw
    def save(self, records): pass


def test_source_outage_returns_last_good_snapshot_time():
    LastGoodSnapshots.save("down", [{"data": "last-good"}])
    assert run_resilient(DownSource()) == LastGoodSnapshots.get("down")[0]


def test_source_outage_without_snapshot_is_visible():
    with pytest.raises(RuntimeError, match="provider down"):
        run_resilient(type("FreshDown", (DownSource,), {"source_name": "fresh-down"})())
