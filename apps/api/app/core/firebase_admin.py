#apps/api/app/core/firebase_admin.py

import json
from pathlib import Path

import firebase_admin
from firebase_admin import auth, credentials

from app.core.config import settings


def init_firebase_admin():
    if firebase_admin._apps:
        return firebase_admin.get_app()

    credentials_json = settings.firebase_admin_credentials_json.strip()
    credentials_path = settings.firebase_admin_credentials_path.strip()

    if credentials_json:
        cred_dict = json.loads(credentials_json)
        cred = credentials.Certificate(cred_dict)
        return firebase_admin.initialize_app(cred)

    if credentials_path:
        path = Path(credentials_path)

        if not path.is_absolute():
            path = Path.cwd() / path

        if not path.exists():
            raise FileNotFoundError(f"Firebase service account file not found: {path}")

        cred = credentials.Certificate(str(path))
        return firebase_admin.initialize_app(cred)

    raise ValueError(
        "Firebase Admin credentials are not configured. "
        "Set FIREBASE_ADMIN_CREDENTIALS_JSON or FIREBASE_ADMIN_CREDENTIALS_PATH."
    )


def verify_firebase_token(id_token: str):
    init_firebase_admin()
    return auth.verify_id_token(id_token)