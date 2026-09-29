"""Common resilient ingestion contract for live-data providers."""
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any

class SourceIngestion(ABC):
    source_name: str
    @abstractmethod
    def fetch(self) -> Any: ...
    @abstractmethod
    def normalize(self, raw: Any) -> list[dict]: ...
    @abstractmethod
    def save(self, records: list[dict]) -> None: ...
    def run(self) -> datetime:
        self.save(self.normalize(self.fetch()))
        return datetime.now(timezone.utc)
