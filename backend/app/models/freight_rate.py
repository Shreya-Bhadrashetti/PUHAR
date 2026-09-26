from sqlalchemy import Column, Integer, String, Float, Date

from app.core.database import Base


class FreightRate(Base):
    __tablename__ = "freight_rates"

    id = Column(Integer, primary_key=True, index=True)

    date = Column(Date, nullable=False)

    route = Column(String(255), nullable=False)
    vessel_type = Column(String(50), nullable=False)

    rate_usd_per_ton = Column(Float, nullable=True)
    bdi_index = Column(Float, nullable=True)

    source = Column(String(255), nullable=True)