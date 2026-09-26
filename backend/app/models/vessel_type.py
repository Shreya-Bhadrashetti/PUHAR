from sqlalchemy import Column, Integer, String, Float

from app.core.database import Base


class VesselType(Base):
    __tablename__ = "vessel_types"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(50), unique=True, nullable=False)

    min_dwt = Column(Float, nullable=True)
    max_dwt = Column(Float, nullable=True)

    description = Column(String(255), nullable=True)