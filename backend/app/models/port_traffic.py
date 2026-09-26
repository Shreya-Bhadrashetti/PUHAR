from sqlalchemy import Column, Integer, String, Float, Date

from app.core.database import Base


class PortTraffic(Base):
    __tablename__ = "port_traffic"

    id = Column(Integer, primary_key=True, index=True)

    date = Column(Date, nullable=False)
    port_name = Column(String(150), nullable=False)
    country = Column(String(100), nullable=True)
    port_type = Column(String(50), nullable=True)

    waiting_days_at_anchorage = Column(Float, nullable=True)
    waiting_days_at_berth = Column(Float, nullable=True)
    turn_around_time_days = Column(Float, nullable=True)

    berth_occupancy_pct = Column(Float, nullable=True)
    vessels_at_anchorage = Column(Integer, nullable=True)

    source_note = Column(String(255), nullable=True)