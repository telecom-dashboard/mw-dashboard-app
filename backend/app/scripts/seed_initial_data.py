import os
import sys

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User


def main() -> int:
    username = os.getenv("SEED_ADMIN_USERNAME", "").strip()
    email = os.getenv("SEED_ADMIN_EMAIL", "").strip()
    password = os.getenv("SEED_ADMIN_PASSWORD", "").strip()

    provided_values = [bool(username), bool(email), bool(password)]
    if not any(provided_values):
        print("[seed] SEED_ADMIN_* values not set. Skipping admin seed.")
        return 0

    if not all(provided_values):
        print(
            "[seed] SEED_ADMIN_USERNAME, SEED_ADMIN_EMAIL, and SEED_ADMIN_PASSWORD must all be set.",
            file=sys.stderr,
        )
        return 1

    session = SessionLocal()
    try:
        existing_user = session.execute(
            select(User).where(
                (User.username == username) | (User.email == email)
            )
        ).scalar_one_or_none()

        if existing_user:
            print(f"[seed] Admin user already exists for username={username} or email={email}.")
            return 0

        session.add(
            User(
                username=username,
                email=email,
                hashed_password=get_password_hash(password),
                role="admin",
                is_active=True,
            )
        )
        session.commit()
        print(f"[seed] Created admin user {username}.")
        return 0
    finally:
        session.close()


if __name__ == "__main__":
    raise SystemExit(main())
