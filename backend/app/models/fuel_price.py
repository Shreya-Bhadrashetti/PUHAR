from sqlalchemy import Column, Integer, String, Float, Date

from app.core.database import Base


class FuelPrice(Base):
    __tablename__ = "fuel_prices"

    id = Column(Integer, primary_key=True, index=True)

    date = Column(Date, nullable=False)

    hub = Column(String(100), nullable=False)
    fuel_type = Column(String(100), nullable=False)

    price_usd_per_tonne = Column(Float, nullable=True)

    source_note = Column(String(255), nullable=True)