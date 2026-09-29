from backend.db.database import engine, Base

# Import models so SQLAlchemy knows about the tables
from app.models.port_export_commodity import PortExportCommodity


Base.metadata.create_all(bind=engine)

print("Database created successfully.")