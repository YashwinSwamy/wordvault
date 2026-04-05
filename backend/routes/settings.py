"""User settings routes — username, password, account deletion."""

from flask              import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions         import db, bcrypt
from models             import User, Word, Collection, CollectionMember

settings_bp = Blueprint("settings", __name__)


# ── Update username ───────────────────────────────────────────────────────────
# PATCH /api/settings/username
@settings_bp.route("/username", methods=["PATCH"])
@jwt_required()
def update_username():
    """Updates the current user's username."""
    user_id = get_jwt_identity()
    user    = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()
    if not data or not data.get("username", "").strip():
        return jsonify({"error": "username is required"}), 400

    user.username = data["username"].strip()
    db.session.commit()

    return jsonify({"user": user.to_dict()}), 200


# ── Update password ───────────────────────────────────────────────────────────
# PATCH /api/settings/password
@settings_bp.route("/password", methods=["PATCH"])
@jwt_required()
def update_password():
    """Updates the current user's password. Requires current password. Google OAuth users cannot use this."""
    user_id = get_jwt_identity()
    user    = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    if not user.password_hash:
        return jsonify({"error": "This account uses Google sign-in and has no password"}), 400

    data = request.get_json()
    if not data or not all(k in data for k in ("current_password", "new_password")):
        return jsonify({"error": "current_password and new_password are required"}), 400

    if not bcrypt.check_password_hash(user.password_hash, data["current_password"]):
        return jsonify({"error": "Current password is incorrect"}), 401

    if len(data["new_password"]) < 6:
        return jsonify({"error": "New password must be at least 6 characters"}), 400

    user.password_hash = bcrypt.generate_password_hash(data["new_password"]).decode("utf-8")
    db.session.commit()

    return jsonify({"message": "Password updated"}), 200


# ── Delete account ────────────────────────────────────────────────────────────
# DELETE /api/settings/account
# Body: { "password": "..." }  (Google users: omit or pass empty string)
@settings_bp.route("/account", methods=["DELETE"])
@jwt_required()
def delete_account():
    """Permanently deletes the current user's account and all their data."""
    user_id = get_jwt_identity()
    user    = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json() or {}

    # password-based users must confirm with their password
    if user.password_hash:
        if not data.get("password"):
            return jsonify({"error": "password is required to delete your account"}), 400
        if not bcrypt.check_password_hash(user.password_hash, data["password"]):
            return jsonify({"error": "Incorrect password"}), 401

    # delete in FK-safe order
    # 1. words the user added (across all collections)
    Word.query.filter_by(added_by=user_id).delete()

    # 2. user's memberships in other people's collections
    CollectionMember.query.filter_by(user_id=user_id).delete()

    # 3. for each collection the user owns: delete words, members, then the collection
    owned = Collection.query.filter_by(owner_id=user_id).all()
    for c in owned:
        Word.query.filter_by(collection_id=c.id).delete()
        CollectionMember.query.filter_by(collection_id=c.id).delete()
        db.session.delete(c)

    # 4. delete the user
    db.session.delete(user)
    db.session.commit()

    return jsonify({"message": "Account deleted"}), 200
