from sqlalchemy import Column, Integer, String, Float

from app.core.database import Base


class Port(Base):
    __tablename__ = "ports"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(100), nullable=False)
    port_code = Column(String(20), unique=True, nullable=False)

    country = Column(String(100), nullable=False, default="India")
    state = Column(String(100), nullable=True)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)