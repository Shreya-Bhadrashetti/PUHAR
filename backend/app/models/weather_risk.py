from sqlalchemy import Column, Integer, String, Float, Date

from app.core.database import Base


class WeatherRisk(Base):
    __tablename__ = "weather_risk"

    id = Column(Integer, primary_key=True, index=True)

    date = Column(Date, nullable=False)
    port_name = Column(String(150), nullable=False)
    country = Column(String(100), nullable=True)
    region_cluster = Column(String(100), nullable=True)

    monsoon_risk_level = Column(String(50), nullable=True)
    cyclone_risk_level = Column(String(50), nullable=True)

    typical_disruption_days = Column(Float, nullable=True)
    notes = Column(String(500), nullable=True)