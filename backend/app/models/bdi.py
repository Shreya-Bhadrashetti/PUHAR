from sqlalchemy import Column, Integer, Float, Date, String

from app.core.database import Base


class BDIHistory(Base):
    __tablename__ = "bdi_history"

    id = Column(Integer, primary_key=True, index=True)

    date = Column(Date, nullable=False)
    bdi_index = Column(Float, nullable=False)

    source = Column(String(255), nullable=True)