#!/usr/bin/env bash
alembic -c alembic_users.ini upgrade head
python migrations/setup_api.py
