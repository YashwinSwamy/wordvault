"""Authentication routes for handling user registration and login."""

from flask import Blueprint, request, jsonify, redirect, url_for
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from extensions import db, bcrypt
from models import User, Collection
from authlib.integrations.flask_client import OAuth
import os

auth_bp = Blueprint("auth", __name__)

# ── Google OAuth setup ────────────────────────────────────────────────────────
oauth = OAuth()
 
def init_oauth(app):
    oauth.init_app(app)
    oauth.register(
        name="google",
        client_id=os.getenv("GOOGLE_CLIENT_ID"),
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )


# ── Register ──────────────────────────────────────────────────────────────────
# POST /api/auth/register
# Creates a new user + a default "Personal" collection for them
@auth_bp.route("/register", methods=["POST"])
def register():
    """Registers a new user, creates a default personal collection, and returns a JWT token."""
    data = request.get_json()

    # validate required fields
    if not data or not all(k in data for k in ("email", "password", "username")):
        return jsonify({"error": "email, password and username are required"}), 400

    # check if email already exists
    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already registered"}), 409

    # hash the password — never store plain text
    hashed = bcrypt.generate_password_hash(data["password"]).decode("utf-8")

    # create the user
    user = User(
        email         = data["email"],
        password_hash = hashed, 
        username      = data["username"]
    )
    db.session.add(user)
    db.session.flush()  # flush so user.id is available before commit

    # every new user gets a default personal collection automatically
    personal_collection = Collection(
        name      = "Personal",
        is_shared = False,
        owner_id  = user.id
    )
    db.session.add(personal_collection)
    db.session.commit()

    # generate a JWT token so the user is logged in immediately after registering
    token = create_access_token(identity=str(user.id))

    return jsonify({
        "message" : "Account created successfully",
        "token"   : token,
        "user"    : user.to_dict()
    }), 201

# ── Login ─────────────────────────────────────────────────────────────────────
# POST /api/auth/login
# Verifies credentials and returns a JWT token
@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticates a user and returns a JWT token if successful."""
    data = request.get_json()

    if not data or not all(k in data for k in ("email", "password")):
        return jsonify({"error": "email and password are required"}), 400

    user = User.query.filter_by(email=data["email"]).first()

    if not user or not bcrypt.check_password_hash(user.password_hash, data["password"]):
        return jsonify({"error": "Invalid email or password"}), 401

    token = create_access_token(identity=str(user.id))

    return jsonify({
        "message" : "Logged in successfully",
        "token"   : token,
        "user"    : user.to_dict()
    }), 200

# ── Me ────────────────────────────────────────────────────────────────────────
# GET /api/auth/me
# Returns the current logged-in user's info (useful for frontend on page load)
@auth_bp.route("/me", methods=["GET"])
def me():
    """Returns the current logged-in user's information."""
    # from flask_jwt_extended import jwt_required, get_jwt_identity
    @jwt_required()
    def inner():
        user_id = get_jwt_identity()
        user    = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        return jsonify({"user": user.to_dict()}), 200
    return inner()


# ── Google Login ──────────────────────────────────────────────────────────────
@auth_bp.route("/google")
def google_login():
    """Initiates the Google OAuth flow by redirecting the user to Google's authentication page."""
    try:
        redirect_uri = url_for("auth.google_callback", _external=True)
        return oauth.google.authorize_redirect(redirect_uri)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Google Callback ───────────────────────────────────────────────────────────
@auth_bp.route("/google/callback")
def google_callback():
    """Handles the callback from Google after user authentication."""
    frontend_url = os.getenv("FRONTEND_URL", "https://wordvault-eight.vercel.app")
 
    try:
        token = oauth.google.authorize_access_token()
        user_info = token.get("userinfo")
 
        if not user_info:
            return redirect(f"{frontend_url}/login?error=google_failed")
 
        email    = user_info["email"]
        name     = user_info.get("name", email.split("@")[0])
        username = name.replace(" ", "").lower()
 
        user = User.query.filter_by(email=email).first()
 
        if not user:
            user = User(
                email         = email,
                username      = username,
                password_hash = None
            )
            db.session.add(user)
            db.session.flush()
 
            personal_collection = Collection(
                name         = "Personal",
                is_shared    = False,
                owner_id     = user.id
            )
            db.session.add(personal_collection)
            db.session.commit()
 
        jwt_token = create_access_token(identity=str(user.id))
 
        return redirect(f"{frontend_url}/auth/callback?token={jwt_token}&user={user.id}&username={user.username}&email={user.email}")
 
    except Exception as e:
        return redirect(f"{frontend_url}/login?error=google_failed")