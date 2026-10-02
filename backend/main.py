import sys
from pathlib import Path

# backend/ entry-point – makes this work when run as:
#   uvicorn main:app            (from inside backend/)
#   uvicorn backend.main:app    (from project root)

BACKEND_DIR = Path(__file__).resolve().parent          # .../PUHAR/backend
ROOT_DIR    = BACKEND_DIR.parent                       # .../PUHAR

# Project root must be first so `backend.*` absolute imports resolve.
# Backend dir must also be present so the fallback bare imports
# (vessel_optimization.*, freight_forecasting.*) inside app/main.py resolve.
for p in (str(ROOT_DIR), str(BACKEND_DIR)):
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.app.main import app  # noqa: E402

