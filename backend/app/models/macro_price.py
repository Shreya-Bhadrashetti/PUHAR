from sqlalchemy import Column, Integer, String, Float, Date

from app.core.database import Base


class MacroPrice(Base):
    __tablename__ = "macro_prices"

    id = Column(Integer, primary_key=True, index=True)

    date = Column(Date, nullable=False)

    indicator = Column(String(100), nullable=False)

    price = Column(Float, nullable=True)
    open_price = Column(Float, nullable=True)
    high_price = Column(Float, nullable=True)
    low_price = Column(Float, nullable=True)

    volume = Column(Float, nullable=True)
    change_pct = Column(Float, nullable=True)