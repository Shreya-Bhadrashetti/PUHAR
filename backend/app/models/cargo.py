from sqlalchemy import Column, Integer, String, Float

from app.core.database import Base


class Cargo(Base):
    __tablename__ = "cargo"

    id = Column(Integer, primary_key=True, index=True)

    port_name = Column(String(150), nullable=False)
    commodity = Column(String(100), nullable=False)

    annual_volume_mt = Column(Float, nullable=True)
    typical_vessel_size_dwt = Column(Float, nullable=True)

    primary_destinations = Column(String(500), nullable=True)