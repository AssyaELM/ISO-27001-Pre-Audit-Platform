from __future__ import annotations

import smtplib
from datetime import datetime
from email.message import EmailMessage

from app.core.config import Settings, settings


class EmailDeliveryError(RuntimeError):
    """Raised when an e-mail cannot be delivered."""


class EmailService:
    async def send_verification_email(
        self,
        recipient: str,
        verification_url: str,
        expires_at: datetime,
        first_name: str | None = None,
        organization_name: str | None = None,
    ) -> None:
        raise NotImplementedError


class SMTPEmailService(EmailService):
    def __init__(self, app_settings: Settings = settings) -> None:
        self._settings = app_settings

    async def send_verification_email(
        self,
        recipient: str,
        verification_url: str,
        expires_at: datetime,
        first_name: str | None = None,
        organization_name: str | None = None,
    ) -> None:
        if not self._settings.smtp_host:
            raise EmailDeliveryError("SMTP is not configured")

        greeting = f"Bonjour {first_name}," if first_name else "Bonjour,"
        workspace_line = (
            f"Votre compte CapISO et l'espace de travail {organization_name} ont ete crees."
            if organization_name
            else "Votre compte CapISO a ete cree."
        )
        body = (
            f"{greeting}\n\n"
            f"{workspace_line}\n\n"
            "Confirmez votre adresse e-mail en utilisant le lien suivant :\n\n"
            f"{verification_url}\n\n"
            f"Ce lien expire le {expires_at.isoformat()} et ne peut etre utilise qu'une seule fois.\n\n"
            "Si vous n'etes pas a l'origine de cette demande, vous pouvez ignorer ce message."
        )

        message = EmailMessage()
        message["Subject"] = "Confirmez votre adresse e-mail CapISO"
        message["From"] = self._settings.email_from
        message["To"] = recipient
        message.set_content(body)

        try:
            with smtplib.SMTP(self._settings.smtp_host, self._settings.smtp_port, timeout=10) as smtp:
                if self._settings.smtp_use_tls:
                    smtp.starttls()
                if self._settings.smtp_username and self._settings.smtp_password:
                    smtp.login(self._settings.smtp_username, self._settings.smtp_password)
                smtp.send_message(message)
        except Exception as exc:
            raise EmailDeliveryError("Verification e-mail could not be sent") from exc


def get_email_service() -> EmailService:
    return SMTPEmailService()
