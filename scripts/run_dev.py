"""Start API and Vite together from the repository root."""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    os.chdir(ROOT)
    api = subprocess.Popen(
        [
            sys.executable,
            "-m",
            "uvicorn",
            "backend.main:app",
            "--reload",
            "--host",
            "0.0.0.0",
            "--port",
            "8000",
        ],
        cwd=ROOT,
    )
    ui = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=ROOT / "frontend",
        shell=os.name == "nt",
    )
    try:
        return api.wait()
    except KeyboardInterrupt:
        api.terminate()
        ui.terminate()
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
