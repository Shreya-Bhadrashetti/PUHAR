from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class PortConstraint(Base):
    __tablename__ = "port_constraints"

    id = Column(Integer, primary_key=True, index=True)

    port_id = Column(Integer, ForeignKey("ports.id"), nullable=False)

    max_draft_m = Column(Float, nullable=True)
    max_loa_m = Column(Float, nullable=True)
    max_beam_m = Column(Float, nullable=True)
    max_dwt = Column(Float, nullable=True)

    handling_rate_tons_per_day = Column(Float, nullable=True)
    berth_count = Column(Integer, nullable=True)

    has_mechanized_handling = Column(Boolean, nullable=True)
    tidal_restriction = Column(String(255), nullable=True)

    port = relationship("Port")