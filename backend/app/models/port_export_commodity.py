from sqlalchemy import Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from backend.db.database import Base


class PortExportCommodity(Base):
    __tablename__ = "port_export_commodities"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    port_name: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    export_commodity: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    annual_export_volume_documented: Mapped[str | None] = mapped_column(
        Text
    )

    typical_destination_region: Mapped[str | None] = mapped_column(
        Text
    )

    source_confidence: Mapped[str | None] = mapped_column(
        Text
    )

    notes: Mapped[str | None] = mapped_column(
        Text
    )