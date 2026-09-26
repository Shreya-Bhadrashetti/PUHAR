from sqlalchemy import Column, Integer, String, Float

from app.core.database import Base


class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)

    origin_port = Column(String(150), nullable=False)
    destination_port = Column(String(150), nullable=False)

    distance_nm = Column(Float, nullable=False)

    route_type = Column(String(50), nullable=True)