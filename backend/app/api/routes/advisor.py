from fastapi import APIRouter, Depends
from backend.app.core.security import require_role
from backend.app.orchestrator.advisor_pipeline import AdvisorPipeline
from backend.app.schemas.contracts import AdvisorRequest, AdvisorResponse

router = APIRouter(prefix="/advisor", tags=["advisor"])

@router.post("/recommend", response_model=AdvisorResponse)
async def recommend(payload: AdvisorRequest, _=Depends(require_role("charterer", "admin"))):
    return await AdvisorPipeline().run(payload)
