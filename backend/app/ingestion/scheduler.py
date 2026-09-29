"""APScheduler registration for local/simple deployments."""
from collections.abc import Callable

from backend.app.ingestion.sources import BackhaulIngestion, CoastalWeatherIngestion, FreightRatesIngestion, PortInfrastructureIngestion, run_resilient

JOBS: dict[str, tuple[int, Callable]] = {}

def register(name: str, minutes: int, job: Callable) -> None:
    """A declarative schedule: weather 15–30m, rates daily, ports weekly."""
    JOBS[name] = (minutes, job)


def build_scheduler():
    """Create, but do not start, the scheduler so tests can use the registry alone."""
    from apscheduler.schedulers.background import BackgroundScheduler
    scheduler = BackgroundScheduler(timezone="UTC")
    for name, minutes, source in (
        ("weather", 20, CoastalWeatherIngestion()),
        ("rates", 24 * 60, FreightRatesIngestion()),
        ("ports", 7 * 24 * 60, PortInfrastructureIngestion()),
        ("backhaul", 24 * 60, BackhaulIngestion()),
    ):
        register(name, minutes, lambda source=source: run_resilient(source))
        scheduler.add_job(JOBS[name][1], "interval", minutes=minutes, id=name, replace_existing=True)
    return scheduler
