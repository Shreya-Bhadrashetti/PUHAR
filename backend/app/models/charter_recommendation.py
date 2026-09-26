from sqlalchemy import Column, Integer, String, Float, Date

from app.core.database import Base


class CharterRecommendation(Base):
    __tablename__ = "charter_recommendations"

    id = Column(Integer, primary_key=True, index=True)

    recommendation_date = Column(Date, nullable=False)

    origin_port = Column(String(150), nullable=False)
    destination_port = Column(String(150), nullable=False)

    vessel_type = Column(String(50), nullable=False)
    cargo_type = Column(String(100), nullable=True)

    forecast_freight_rate = Column(Float, nullable=True)

    estimated_freight_cost = Column(Float, nullable=True)
    estimated_fuel_cost = Column(Float, nullable=True)
    estimated_port_cost = Column(Float, nullable=True)
    estimated_total_cost = Column(Float, nullable=True)

    expected_transit_days = Column(Float, nullable=True)
    expected_idle_days = Column(Float, nullable=True)

    market_entry_score = Column(Float, nullable=True)
    risk_score = Column(Float, nullable=True)

    recommendation = Column(String(100), nullable=True)