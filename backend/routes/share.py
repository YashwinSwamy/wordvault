"""Share-link routes for read-only public collection access."""

import os
import secrets

from datetime           import datetime, timedelta
from flask              import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions         import db
from models             import Collection, Word, User

share_bp = Blueprint("share", __name__)

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://wordvault-eight.vercel.app")


# ── Generate share link ───────────────────────────────────────────────────────
# POST /api/share/<collection_id>/generate
# Body: { "expires_in_days": 7 }  (optional; omit for no expiry)
@share_bp.route("/<int:collection_id>/generate", methods=["POST"])
@jwt_required()
def generate_share_link(collection_id):
    """Generates a public read-only share link for a collection. Owner only."""
    user_id    = get_jwt_identity()
    collection = Collection.query.get(collection_id)

    if not collection:
        return jsonify({"error": "Collection not found"}), 404
    if str(collection.owner_id) != str(user_id):
        return jsonify({"error": "Only the owner can generate a share link"}), 403

    data             = request.get_json() or {}
    expires_in_days  = data.get("expires_in_days")

    collection.share_token      = secrets.token_urlsafe(32)
    collection.share_expires_at = (
        datetime.utcnow() + timedelta(days=int(expires_in_days))
        if expires_in_days else None
    )
    db.session.commit()

    return jsonify({
        "share_token" : collection.share_token,
        "share_url"   : f"{FRONTEND_URL}/c/{collection.share_token}",
        "expires_at"  : collection.share_expires_at.isoformat() if collection.share_expires_at else None,
    }), 200


# ── Revoke share link ─────────────────────────────────────────────────────────
# DELETE /api/share/<collection_id>/generate
@share_bp.route("/<int:collection_id>/generate", methods=["DELETE"])
@jwt_required()
def revoke_share_link(collection_id):
    """Revokes the public share link for a collection. Owner only."""
    user_id    = get_jwt_identity()
    collection = Collection.query.get(collection_id)

    if not collection:
        return jsonify({"error": "Collection not found"}), 404
    if str(collection.owner_id) != str(user_id):
        return jsonify({"error": "Only the owner can revoke a share link"}), 403

    collection.share_token      = None
    collection.share_expires_at = None
    db.session.commit()

    return jsonify({"message": "Share link revoked"}), 200


# ── Public read endpoint (no auth required) ───────────────────────────────────
# GET /api/share/<token>
@share_bp.route("/<token>", methods=["GET"])
def get_shared_collection(token):
    """Returns a collection and its words for a valid share token. No auth required."""
    collection = Collection.query.filter_by(share_token=token).first()

    if not collection:
        return jsonify({"error": "Share link not found"}), 404

    if collection.share_expires_at and datetime.utcnow() > collection.share_expires_at:
        return jsonify({"error": "This share link has expired"}), 410

    owner = User.query.get(collection.owner_id)
    words = Word.query.filter_by(collection_id=collection.id)\
                      .order_by(Word.created_at.desc()).all()

    return jsonify({
        "collection": {
            "id"            : collection.id,
            "name"          : collection.name,
            "owner_username": owner.username if owner else "Unknown",
        },
        "words": [w.to_dict() for w in words],
    }), 200
