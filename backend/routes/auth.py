"""Authentication routes for handling user registration and login."""

import os
import secrets

from datetime           import datetime, timedelta
from flask              import Blueprint, request, jsonify, redirect, url_for
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from extensions         import db, bcrypt
from models             import User, Collection, CollectionMember, Invitation
from email_service      import send_verify_email, send_reset_email, send_invite_email

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://wordvault-eight.vercel.app")

auth_bp = Blueprint("auth", __name__)


# ── Register ──────────────────────────────────────────────────────────────────
# POST /api/auth/register
@auth_bp.route("/register", methods=["POST"])
def register():
    """Registers a new user, creates a default personal collection, and returns a JWT token."""
    data = request.get_json()

    if not data or not all(k in data for k in ("email", "password", "username")):
        return jsonify({"error": "email, password and username are required"}), 400

    if len(data["password"]) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already registered"}), 409

    hashed = bcrypt.generate_password_hash(data["password"]).decode("utf-8")

    verify_token = secrets.token_urlsafe(32)

    user = User(
        email         = data["email"],
        password_hash = hashed,
        username      = data["username"],
        is_verified   = False,
        verify_token  = verify_token,
    )
    db.session.add(user)
    db.session.flush()

    personal_collection = Collection(
        name      = "Personal",
        is_shared = False,
        owner_id  = user.id
    )
    db.session.add(personal_collection)
    db.session.commit()

    # auto-join any pending invitations for this email
    pending = Invitation.query.filter_by(email=data["email"]).filter(
        Invitation.expires_at > datetime.utcnow()
    ).all()
    for inv in pending:
        db.session.add(CollectionMember(
            collection_id = inv.collection_id,
            user_id       = user.id,
            role          = "member"
        ))
        db.session.delete(inv)
    if pending:
        db.session.commit()

    # send verification email (non-blocking: failure doesn't abort registration)
    try:
        verify_link = f"{FRONTEND_URL}/api/auth/verify-email?token={verify_token}"
        verify_link = f"https://wordvault-backend-xl0w.onrender.com/api/auth/verify-email?token={verify_token}"
        send_verify_email(user.email, verify_link)
    except Exception as e:
        print(f"send verification Email error: {str(e)}", flush=True)

    token = create_access_token(identity=str(user.id))

    return jsonify({
        "message" : "Account created successfully",
        "token"   : token,
        "user"    : user.to_dict()
    }), 201


# ── Login ─────────────────────────────────────────────────────────────────────
# POST /api/auth/login
@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticates a user and returns a JWT token if successful."""
    data = request.get_json()

    if not data or not all(k in data for k in ("email", "password")):
        return jsonify({"error": "email and password are required"}), 400

    user = User.query.filter_by(email=data["email"]).first()

    if not user or not user.password_hash:
        return jsonify({"error": "Invalid email or password"}), 401

    if not bcrypt.check_password_hash(user.password_hash, data["password"]):
        return jsonify({"error": "Invalid email or password"}), 401

    token = create_access_token(identity=str(user.id))

    return jsonify({
        "message" : "Logged in successfully",
        "token"   : token,
        "user"    : user.to_dict()
    }), 200


# ── Me ────────────────────────────────────────────────────────────────────────
# GET /api/auth/me
@auth_bp.route("/me", methods=["GET"])
def me():
    """Returns the current logged-in user's information."""
    @jwt_required()
    def inner():
        user_id = get_jwt_identity()
        user    = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        return jsonify({"user": user.to_dict()}), 200
    return inner()


# ── Verify Email ──────────────────────────────────────────────────────────────
# GET /api/auth/verify-email?token=<token>
@auth_bp.route("/verify-email", methods=["GET"])
def verify_email():
    """Marks the user's email as verified and redirects to the login page."""
    token = request.args.get("token")
    if not token:
        return redirect(f"{FRONTEND_URL}/login?error=invalid_token")

    user = User.query.filter_by(verify_token=token).first()
    if not user:
        return redirect(f"{FRONTEND_URL}/login?error=invalid_token")

    user.is_verified  = True
    user.verify_token = None
    db.session.commit()

    return redirect(f"{FRONTEND_URL}/login?verified=1")


# ── Resend Verification Email ─────────────────────────────────────────────────
# POST /api/auth/resend-verify
@auth_bp.route("/resend-verify", methods=["POST"])
@jwt_required()
def resend_verify():
    """Re-sends the email verification link to the current user."""
    user_id = get_jwt_identity()
    user    = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.is_verified:
        return jsonify({"message": "Email already verified"}), 200

    verify_token      = secrets.token_urlsafe(32)
    user.verify_token = verify_token
    db.session.commit()

    try:
        verify_link = f"https://wordvault-backend-xl0w.onrender.com/api/auth/verify-email?token={verify_token}"
        send_verify_email(user.email, verify_link)
    except Exception as e:
        print(f"resend verification Email error: {str(e)}", flush=True)
        return jsonify({"error": "Could not send email. Please try again later."}), 500

    return jsonify({"message": "Verification email sent"}), 200


# ── Forgot Password ───────────────────────────────────────────────────────────
# POST /api/auth/forgot-password
@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    """Sends a password reset link to the user's email."""
    data = request.get_json()
    if not data or "email" not in data:
        return jsonify({"error": "email is required"}), 400

    # Always return 200 — don't leak whether an email exists
    generic = {"message": "If that email is registered, a reset link has been sent."}

    user = User.query.filter_by(email=data["email"]).first()
    if not user:
        return jsonify(generic), 200

    # Google-only accounts have no password
    if not user.password_hash:
        return jsonify({"message": "This account uses Google sign-in. Please log in with Google."}), 200

    reset_token              = secrets.token_urlsafe(32)
    user.reset_token         = reset_token
    user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
    db.session.commit()

    try:
        reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
        send_reset_email(user.email, reset_link)
    except Exception as e:
        print(f"send reset Email error: {str(e)}", flush=True)
        pass

    return jsonify(generic), 200


# ── Reset Password ────────────────────────────────────────────────────────────
# POST /api/auth/reset-password
@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    """Validates the reset token and updates the user's password."""
    data = request.get_json()
    if not data or not all(k in data for k in ("token", "password")):
        return jsonify({"error": "token and password are required"}), 400

    if len(data["password"]) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    user = User.query.filter_by(reset_token=data["token"]).first()

    if not user or not user.reset_token_expires:
        return jsonify({"error": "Invalid or expired reset link"}), 400

    if datetime.utcnow() > user.reset_token_expires:
        return jsonify({"error": "Reset link has expired. Please request a new one."}), 400

    user.password_hash      = bcrypt.generate_password_hash(data["password"]).decode("utf-8")
    user.reset_token        = None
    user.reset_token_expires = None
    db.session.commit()

    return jsonify({"message": "Password updated successfully"}), 200


# ── Google Login ──────────────────────────────────────────────────────────────
@auth_bp.route("/google")
def google_login():
    """Initiates the Google OAuth flow."""
    try:
        from app import oauth
        redirect_uri = url_for("auth.google_callback", _external=True)
        return oauth.google.authorize_redirect(redirect_uri)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Google Callback ───────────────────────────────────────────────────────────
@auth_bp.route("/google/callback")
def google_callback():
    """Handles the callback from Google after user authentication."""
    try:
        from app import oauth
        token     = oauth.google.authorize_access_token()
        user_info = token.get("userinfo")

        if not user_info:
            return redirect(f"{FRONTEND_URL}/login?error=google_failed")

        email    = user_info["email"]
        name     = user_info.get("name", email.split("@")[0])
        username = name.replace(" ", "").lower()

        user = User.query.filter_by(email=email).first()

        if not user:
            user = User(
                email         = email,
                username      = username,
                password_hash = None,
                is_verified   = True,   # Google already verified the email
            )
            db.session.add(user)
            db.session.flush()

            personal_collection = Collection(
                name      = "Personal",
                is_shared = False,
                owner_id  = user.id
            )
            db.session.add(personal_collection)
        else:
            # existing Google user — mark as verified if not already
            if not user.is_verified:
                user.is_verified = True

        db.session.commit()

        jwt_token = create_access_token(identity=str(user.id))

        return redirect(
            f"{FRONTEND_URL}/auth/callback"
            f"?token={jwt_token}&user={user.id}&username={user.username}&email={user.email}&is_verified=true"
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500
