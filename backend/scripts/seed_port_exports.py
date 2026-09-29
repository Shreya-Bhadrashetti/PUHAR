import csv
from pathlib import Path

from sqlalchemy.orm import Session

from backend.db.database import engine
from app.models.port_export_commodity import PortExportCommodity


BASE_DIR = Path(__file__).resolve().parents[2]

CSV_PATH = (
    BASE_DIR
    / "data"
    / "cleaned"
    / "port_export_commodities.csv"
)


def seed_port_exports():

    with Session(engine) as session:

        with open(
            CSV_PATH,
            "r",
            encoding="utf-8-sig"
        ) as file:

            reader = csv.DictReader(file)

            records = []

            for row in reader:

                record = PortExportCommodity(
                    port_name=row["port_name"],
                    export_commodity=row["export_commodity"],
                    annual_export_volume_documented=
                        row["annual_export_volume_documented"],
                    typical_destination_region=
                        row["typical_destination_region"],
                    source_confidence=
                        row["source_confidence"],
                    notes=row["notes"]
                )

                records.append(record)

            session.add_all(records)
            session.commit()

            print(
                f"Inserted {len(records)} records."
            )


if __name__ == "__main__":
    seed_port_exports()