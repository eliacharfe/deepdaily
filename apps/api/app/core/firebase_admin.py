#apps/api/app/core/firebase_admin.py

from pathlib import Path

import firebase_admin
from firebase_admin import auth, credentials

from app.core.config import settings


def init_firebase_admin():
    if firebase_admin._apps:
        return firebase_admin.get_app()

    credentials_path = settings.firebase_admin_credentials_path.strip()

    if not credentials_path:
        raise ValueError("FIREBASE_ADMIN_CREDENTIALS_PATH is not configured")

    path = Path(credentials_path)

    if not path.is_absolute():
        path = Path.cwd() / path

    if not path.exists():
        raise FileNotFoundError(f"Firebase service account file not found: {path}")

    cred = credentials.Certificate(str(path))
    return firebase_admin.initialize_app(cred)


def verify_firebase_token(id_token: str):
    init_firebase_admin()
    return auth.verify_id_token(id_token)