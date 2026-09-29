"""Adapter bridge for the existing vessel-cost optimizer."""
from datetime import datetime, timezone
from backend.app.reference_data import optimization_reference
from backend.app.schemas.contracts import VesselOptimizationInput, ServiceOutput


class VesselOptimizationAdapter:
    def run(self, request: VesselOptimizationInput) -> ServiceOutput:
        if request.vessel.dwt is None:
            return ServiceOutput(result={"status": "input_incomplete"}, confidence=0, reasons=["Vessel DWT is required; market proxy series are not vessel capacity data."], data_as_of=None)
        reference, error = optimization_reference(request.origin_port, request.destination_port)
        if error:
            return ServiceOutput(result={"status": "reference_data_unavailable"}, confidence=0, reasons=[error], data_as_of=None)
        from backend.vessel_optimization.vessel_optimizer import optimize_vessel_with_reference
        output = optimize_vessel_with_reference(request.cargo_quantity_mt, request.vessel.vessel_class or "", request.vessel.dwt, request.origin_port, request.destination_port, reference)
        if output["status"] != "success":
            return ServiceOutput(result=output, confidence=0, reasons=[output["message"]], data_as_of=None)
        return ServiceOutput(result=output, confidence=0.7, reasons=["Vessel cost uses the optimizer's class assumptions and the supplied vessel DWT.", f"Physical constraints use {reference['sources']['port']}.", f"Fuel and congestion observations are as of {reference['fuel_as_of']} and {reference['congestion']['as_of']}."], data_as_of=datetime.now(timezone.utc))
