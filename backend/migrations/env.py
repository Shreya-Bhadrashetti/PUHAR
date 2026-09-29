from alembic import context
from backend.app.db import Base
target_metadata = Base.metadata

def run_migrations_online():
    connectable = context.config.attributes.get("connection")
    if connectable is None:
        from sqlalchemy import engine_from_config, pool
        connectable = engine_from_config(context.config.get_section(context.config.config_ini_section), prefix="sqlalchemy.", poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction(): context.run_migrations()

run_migrations_online()
