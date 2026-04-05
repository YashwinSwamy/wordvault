"""Shared email sending utility using Resend."""

import resend
from flask import current_app

FRONTEND_URL = "https://wordvault-eight.vercel.app"


def _send(to_email, subject, html_body):
    """Send an HTML email via Resend."""
    resend.api_key = current_app.config["RESEND_API_KEY"]
    resend.Emails.send({
        "from"   : current_app.config["RESEND_FROM"],
        "to"     : [to_email],
        "subject": subject,
        "html"   : html_body,
    })


def send_verify_email(to_email, verify_link):
    html = f"""
    <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;background:#1a1a1c;padding:40px;border-radius:12px;color:#f0ece3;">
      <h1 style="color:#c9a96e;margin:0 0 8px;">WordVault</h1>
      <p style="color:#8a8070;margin:0 0 28px;">Verify your email address</p>
      <p style="line-height:1.6;">Thanks for signing up! Click the button below to verify your email and activate your account.</p>
      <a href="{verify_link}"
         style="display:inline-block;background:#c9a96e;color:#0e0e0f;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;margin:20px 0;">
        Verify Email
      </a>
      <p style="color:#4a4640;font-size:12px;margin-top:28px;">
        If you didn't create a WordVault account, you can safely ignore this email.
      </p>
    </div>
    """
    _send(to_email, "Verify your WordVault email", html)


def send_reset_email(to_email, reset_link):
    html = f"""
    <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;background:#1a1a1c;padding:40px;border-radius:12px;color:#f0ece3;">
      <h1 style="color:#c9a96e;margin:0 0 8px;">WordVault</h1>
      <p style="color:#8a8070;margin:0 0 28px;">Reset your password</p>
      <p style="line-height:1.6;">Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
      <a href="{reset_link}"
         style="display:inline-block;background:#c9a96e;color:#0e0e0f;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;margin:20px 0;">
        Reset Password
      </a>
      <p style="color:#4a4640;font-size:12px;margin-top:28px;">
        If you didn't request a password reset, you can safely ignore this email.
      </p>
    </div>
    """
    _send(to_email, "Reset your WordVault password", html)


def send_pending_invite_email(to_email, collection_name, inviter_username, register_link):
    html = f"""
    <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;background:#1a1a1c;padding:40px;border-radius:12px;color:#f0ece3;">
      <h1 style="color:#c9a96e;margin:0 0 8px;">WordVault</h1>
      <p style="color:#8a8070;margin:0 0 28px;">You've been invited to a collection</p>
      <p style="line-height:1.6;">
        <strong>{inviter_username}</strong> has invited you to join the
        <strong>&ldquo;{collection_name}&rdquo;</strong> collection on WordVault —
        a collaborative vocabulary tracker.
      </p>
      <p style="line-height:1.6;">Create your free account to accept the invitation and start exploring the collection.</p>
      <a href="{register_link}"
         style="display:inline-block;background:#c9a96e;color:#0e0e0f;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;margin:20px 0;">
        Accept Invitation
      </a>
      <p style="color:#4a4640;font-size:12px;margin-top:28px;">
        This invitation expires in 7 days. If you don't want to join, you can safely ignore this email.
      </p>
    </div>
    """
    _send(to_email, f"{inviter_username} invited you to \"{collection_name}\" on WordVault", html)


def send_invite_email(to_email, collection_name, inviter_username):
    login_url = f"{FRONTEND_URL}/login"
    html = f"""
    <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;background:#1a1a1c;padding:40px;border-radius:12px;color:#f0ece3;">
      <h1 style="color:#c9a96e;margin:0 0 8px;">WordVault</h1>
      <p style="color:#8a8070;margin:0 0 28px;">You've been added to a collection</p>
      <p style="line-height:1.6;">
        <strong>{inviter_username}</strong> has added you to the
        <strong>&ldquo;{collection_name}&rdquo;</strong> collection on WordVault.
        Log in to start exploring it.
      </p>
      <a href="{login_url}"
         style="display:inline-block;background:#c9a96e;color:#0e0e0f;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;margin:20px 0;">
        Open WordVault
      </a>
    </div>
    """
    _send(to_email, f"{inviter_username} added you to \"{collection_name}\" on WordVault", html)
