from sqlalchemy import Column, Integer, String, Float, Date

from app.core.database import Base


class Forecast(Base):
    __tablename__ = "forecasts"

    id = Column(Integer, primary_key=True, index=True)

    forecast_date = Column(Date, nullable=False)
    target_date = Column(Date, nullable=False)

    route = Column(String(255), nullable=False)
    vessel_type = Column(String(50), nullable=False)

    predicted_freight_rate = Column(Float, nullable=False)

    lower_bound = Column(Float, nullable=True)
    upper_bound = Column(Float, nullable=True)

    confidence_score = Column(Float, nullable=True)

    model_name = Column(String(100), nullable=True)