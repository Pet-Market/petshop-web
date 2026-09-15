"""Telegram Mini App helpers: initData validation + bot chat delivery.

The shop bot (set via ``settings.TELEGRAM_BOT_TOKEN``) is used for two jobs:

1. **Validate TMA initData** so a client can log in automatically with the
   hash Telegram signs (HMAC-SHA256 over ``WebAppData``).
2. **Send the generated login password** to the user's private chat, so they
   can sign in later on the plain web site with phone + password.

Without a configured bot token the hash is *not* verified (demo mode) and the
password is logged instead of sent — this keeps local development working.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import logging
import secrets
import string
import urllib.parse
import urllib.request

from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

# Unambiguous alphabet for one-time passwords (no O/0, I/1, S/5).
PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def bot_token() -> str:
    return getattr(settings, "TELEGRAM_BOT_TOKEN", "") or ""


def generate_password(length: int = 8) -> str:
    """Generate a readable, secure one-time login password."""
    return "".join(secrets.choice(PASSWORD_ALPHABET) for _ in range(length))


def build_password_message(password: str) -> str:
    return (
        "🔐 Pet Market — sizning kirish parolingiz\n\n"
        f"Parol: <b>{password}</b>\n\n"
        "Buni hech kimga bermang. Saytda telefon raqamingiz va shu parol bilan "
        "kirasiz. Parol faqat sizning hisobingiz uchun."
    )


def _parse_init_data(init_data: str) -> dict:
    return {k: v for k, v in urllib.parse.parse_qsl(init_data, keep_blank_values=True)}


def validate_init_data(init_data: str | None) -> dict:
    """Validate Telegram ``initData`` and return ``{"user": {...}, "verified": bool}``.

    Raises ``ValueError`` when the payload is missing or tampered with.
    """
    if not init_data:
        raise ValueError("missing_init_data")

    token = bot_token()
    params = _parse_init_data(init_data)
    received_hash = params.pop("hash", None)
    if not received_hash:
        raise ValueError("missing_hash")

    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(params.items()))

    if token:
        secret_key = hmac.new(b"WebAppData", token.encode(), hashlib.sha256).digest()
        computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(computed_hash, received_hash):
            raise ValueError("invalid_hash")

        auth_date = params.get("auth_date")
        try:
            ts = int(auth_date)
        except (TypeError, ValueError):
            raise ValueError("invalid_auth_date")
        if timezone.now().timestamp() - ts > getattr(settings, "TELEGRAM_AUTH_MAX_AGE", 86400):
            raise ValueError("auth_date_expired")
    else:
        logger.warning("TELEGRAM_BOT_TOKEN not configured — initData hash NOT verified (demo mode).")

    user: dict = {}
    raw_user = params.get("user")
    if raw_user:
        try:
            user = json.loads(raw_user)
        except (TypeError, ValueError):
            raise ValueError("invalid_user")

    return {"user": user, "verified": bool(token)}


def send_message(chat_id: int, text: str) -> bool:
    """Send a message to a Telegram chat via the shop bot.

    When testing or when no bot token is configured the message is logged
    instead of sent (demo mode).
    """
    token = bot_token()
    if not token:
        logger.warning("[telegram:mock] chat=%s — password demoda jo'natilmaydi:\n%s", chat_id, text)
        return False

    if getattr(settings, "TESTING", False):
        return False

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = urllib.parse.urlencode(
        {"chat_id": chat_id, "text": text, "parse_mode": "HTML", "disable_web_page_preview": "true"}
    ).encode()
    request = urllib.request.Request(url, data=payload)
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            return response.status == 200
    except Exception:
        logger.exception("Telegram sendMessage failed for chat %s", chat_id)
        return False