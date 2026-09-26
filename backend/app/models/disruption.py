from sqlalchemy import Column, Integer, String, Float, Date

from app.core.database import Base


class Disruption(Base):
    __tablename__ = "disruptions"

    id = Column(Integer, primary_key=True, index=True)

    event_date = Column(Date, nullable=False)

    port_name = Column(String(150), nullable=False)
    country = Column(String(100), nullable=True)

    event_type = Column(String(100), nullable=False)
    impact_days = Column(Float, nullable=True)

    notes = Column(String(500), nullable=True)