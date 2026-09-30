from sqlalchemy import Column, Integer, String, Float, Date

from app.core.database import Base


class CommodityPrice(Base):
    __tablename__ = "commodity_prices"

    id = Column(Integer, primary_key=True, index=True)

    date = Column(Date, nullable=False)
    commodity = Column(String(100), nullable=False)

    price_usd = Column(Float, nullable=True)
    unit = Column(String(50), nullable=True)

    source = Column(String(255), nullable=True)