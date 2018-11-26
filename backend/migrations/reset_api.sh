psql jurispect_users -f migrations/drop_tables.sql -U jurispect
alembic -c alembic_users.ini upgrade head
python migrations/setup_api.py
