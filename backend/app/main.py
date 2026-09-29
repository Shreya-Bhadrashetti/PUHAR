from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi import Limiter
from slowapi.util import get_remote_address
from backend.app.api.routes import advisor, alerts, auth, models
from backend.app.core.config import get_settings
from backend.app.db import Base, engine
from backend.app.ingestion.scheduler import build_scheduler
from backend.app.active_voyages import check_active_voyages

@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)
    scheduler = build_scheduler()
    scheduler.add_job(lambda: __import__("asyncio").run(check_active_voyages()), "interval", minutes=20, id="active-voyage-risk", replace_existing=True)
    scheduler.start()
    try: yield
    finally: scheduler.shutdown(wait=False)

limiter = Limiter(key_func=get_remote_address, default_limits=[f"{get_settings().rate_limit_per_minute}/minute"])
app = FastAPI(title=get_settings().app_name, lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(CORSMiddleware, allow_origins=get_settings().cors_origin_list, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(auth.router); app.include_router(models.router); app.include_router(advisor.router); app.include_router(alerts.router)

@app.exception_handler(Exception)
async def unexpected_error(_: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"error": "internal_error", "detail": str(exc) if get_settings().environment == "development" else "Unexpected server error"})

@app.exception_handler(RequestValidationError)
async def validation_error(_: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"error": "validation_error", "detail": exc.errors()})

@app.get("/health")
async def health(): return {"status": "ok"}
