"""Vessel optimization stub module.

This module provides vessel selection and cost optimization functions.
The core ML logic is pending implementation; this stub returns structured
placeholder results so the rest of the app can boot and route correctly.
"""
from __future__ import annotations


def optimize_vessel(
    cargo_quantity_mt: float,
    origin_port: str,
    destination_port: str,
) -> dict:
    """Return a vessel optimization recommendation for the given cargo and route.

    Args:
        cargo_quantity_mt: Cargo quantity in metric tonnes.
        origin_port: Loading port name.
        destination_port: Discharge port name.

    Returns:
        A dict with status, recommended vessel class, and reasoning.
    """
    return {
        "status": "stub",
        "message": "Vessel optimizer not yet implemented.",
        "cargo_quantity_mt": cargo_quantity_mt,
        "origin_port": origin_port,
        "destination_port": destination_port,
        "recommended_vessel_class": None,
        "estimated_voyage_cost_usd": None,
    }


def optimize_vessel_with_reference(
    cargo_quantity_mt: float,
    vessel_class: str,
    dwt: float,
    origin_port: str,
    destination_port: str,
    reference: dict,
) -> dict:
    """Return a vessel optimization recommendation given explicit vessel specs and market reference data.

    Args:
        cargo_quantity_mt: Cargo quantity in metric tonnes.
        vessel_class: Vessel class string (e.g. 'Panamax', 'Supramax').
        dwt: Vessel deadweight tonnage.
        origin_port: Loading port name.
        destination_port: Discharge port name.
        reference: Market/port reference data dict from optimization_reference().

    Returns:
        A dict with status and cost/recommendation fields.
    """
    return {
        "status": "stub",
        "message": "Vessel optimizer with reference not yet implemented.",
        "cargo_quantity_mt": cargo_quantity_mt,
        "vessel_class": vessel_class,
        "dwt": dwt,
        "origin_port": origin_port,
        "destination_port": destination_port,
        "estimated_voyage_cost_usd": None,
    }
