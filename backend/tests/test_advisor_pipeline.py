import asyncio
from backend.app.orchestrator.advisor_pipeline import AdvisorPipeline
from backend.app.schemas.contracts import AdvisorRequest, VesselInput

def test_pipeline_returns_explainability():
    request = AdvisorRequest(vessel=VesselInput(lat=17.5, lon=85.5, draft_m=12), origin_region="East Asia", destination="Paradip", candidate_ports=["Paradip", "Chennai"], route="Paradip-East Asia", vessel_class="Panamax")
    response = asyncio.run(AdvisorPipeline().run(request))
    assert response.explainability
    assert response.recommendation["destination"] == "Paradip"
