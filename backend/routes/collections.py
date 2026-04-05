""" Collection routes for managing collections and memberships."""

import os
import secrets

from datetime           import datetime, timedelta
from flask              import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions         import db
from models             import Collection, CollectionMember, User, Invitation
from email_service      import send_invite_email, send_pending_invite_email

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://wordvault-eight.vercel.app")

collections_bp = Blueprint("collections", __name__)


# ── Create a collection ───────────────────────────────────────────────────────
# POST /api/collections/
# Body: { name, is_shared (optional, default false) }
@collections_bp.route("/", methods=["POST"])
@jwt_required()
def create_collection():
    """Creates a new collection for the current user.
    The request body should include the collection name and an optional is_shared flag (default is false)."""

    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or "name" not in data:
        return jsonify({"error": "name is required"}), 400

    collection = Collection(
        name      = data["name"],
        is_shared = data.get("is_shared", False),
        owner_id  = user_id
    )
    db.session.add(collection)
    db.session.commit()

    return jsonify({"message": "Collection created", "collection": collection.to_dict()}), 201


# ── List all collections for the current user ─────────────────────────────────
# GET /api/collections/
# Returns collections the user owns + shared ones they're a member of
@collections_bp.route("/", methods=["GET"])
@jwt_required()
def list_collections():
    """Lists all collections for the current user, including both owned and shared collections."""
    user_id = get_jwt_identity()

    # collections the user owns
    owned = Collection.query.filter_by(owner_id=user_id).all()

    # shared collections the user is a member of (but doesn't own)
    memberships = CollectionMember.query.filter_by(user_id=user_id).all()
    member_collection_ids = [m.collection_id for m in memberships]
    shared = Collection.query.filter(
        Collection.id.in_(member_collection_ids),
        Collection.owner_id != user_id
    ).all()

    return jsonify({
        "owned": [c.to_dict() for c in owned],
        "shared": [c.to_dict() for c in shared]
    }), 200


# ── Invite a user to a shared collection ─────────────────────────────────────
# POST /api/collections/<collection_id>/invite
# Body: { email }
# Only the owner can invite others
@collections_bp.route("/<int:collection_id>/invite", methods=["POST"])
@jwt_required()
def invite_member(collection_id):
    """Invites a user to a shared collection. 
    Only the owner can invite members."""

    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or "email" not in data:
        return jsonify({"error": "email is required"}), 400

    # only the owner can invite
    collection = Collection.query.get(collection_id)
    if not collection:
        return jsonify({"error": "Collection not found"}), 404

    if str(collection.owner_id) != str(user_id):
        return jsonify({"error": "Only the owner can invite members"}), 403

    if not collection.is_shared:
        return jsonify({"error": "This is a personal collection — convert it to shared first"}), 400

    inviter = User.query.get(user_id)
    inviter_name = inviter.username if inviter else "Someone"

    # find the user to invite
    invitee = User.query.filter_by(email=data["email"]).first()

    if not invitee:
        # user not registered yet — create a pending invitation
        token      = secrets.token_urlsafe(32)
        invitation = Invitation(
            email         = data["email"],
            collection_id = collection_id,
            token         = token,
            expires_at    = datetime.utcnow() + timedelta(days=7),
        )
        db.session.add(invitation)
        db.session.commit()

        try:
            register_link = f"{FRONTEND_URL}/register?invite={token}"
            send_pending_invite_email(data["email"], collection.name, inviter_name, register_link)
        except Exception:
            pass

        return jsonify({"message": "Invitation sent — they'll be added when they register"}), 201

    # don't invite the owner themselves
    if str(invitee.id) == str(user_id):
        return jsonify({"error": "You already own this collection"}), 400

    # check if already a member
    existing = CollectionMember.query.filter_by(
        collection_id=collection_id,
        user_id=invitee.id
    ).first()
    if existing:
        return jsonify({"error": "User is already a member"}), 409

    member = CollectionMember(
        collection_id = collection_id,
        user_id       = invitee.id,
        role          = "member"
    )
    db.session.add(member)
    db.session.commit()

    try:
        send_invite_email(invitee.email, collection.name, inviter_name)
    except Exception:
        pass

    return jsonify({"message": f"{invitee.username} added to {collection.name}"}), 201


# ── List members of a collection ──────────────────────────────────────────────
# GET /api/collections/<collection_id>/members
@collections_bp.route("/<int:collection_id>/members", methods=["GET"])
@jwt_required()
def list_members(collection_id):
    """Lists all members of a collection. 
    Only the owner or members can view the member list."""

    user_id = get_jwt_identity()

    collection = Collection.query.get(collection_id)
    if not collection:
        return jsonify({"error": "Collection not found"}), 404

    # only owner or members can view the member list
    is_owner  = str(collection.owner_id) == str(user_id)
    is_member = CollectionMember.query.filter_by(
        collection_id=collection_id, user_id=user_id
    ).first()

    if not is_owner and not is_member:
        return jsonify({"error": "Access denied"}), 403

    members = CollectionMember.query.filter_by(collection_id=collection_id).all()
    result = []
    for m in members:
        user = User.query.get(m.user_id)
        if user:
            result.append({
                "user_id"   : user.id,
                "username"  : user.username,
                "email"     : user.email,
                "role"      : m.role,
                "joined_at" : m.joined_at.isoformat()
            })

    return jsonify({
        "collection" : collection.to_dict(),
        "owner"      : User.query.get(collection.owner_id).to_dict(),
        "members"    : result
    }), 200


# ── Remove a member ───────────────────────────────────────────────────────────
# DELETE /api/collections/<collection_id>/members/<member_user_id>
# Owner can remove anyone; members can remove themselves (leave)
@collections_bp.route("/<int:collection_id>/members/<int:member_user_id>", methods=["DELETE"])
@jwt_required()
def remove_member(collection_id, member_user_id):
    """Removes a member from a collection. 
    The owner can remove any member; members can remove themselves (leave the collection)."""

    user_id = get_jwt_identity()
    collection = Collection.query.get(collection_id)
    
    if not collection:
        return jsonify({"error": "Collection not found"}), 404

    is_owner = str(collection.owner_id) == str(user_id)
    is_self  = str(member_user_id)      == str(user_id)

    if not is_owner and not is_self:
        return jsonify({"error": "You can only remove yourself or members if you're the owner"}), 403

    member = CollectionMember.query.filter_by(
        collection_id=collection_id,
        user_id=member_user_id
    ).first()

    if not member:
        return jsonify({"error": "Member not found"}), 404

    db.session.delete(member)
    db.session.commit()

    return jsonify({"message": "Member removed"}), 200


# ── Delete a collection ───────────────────────────────────────────────────────
# DELETE /api/collections/<collection_id>
# Only the owner can delete a collection
@collections_bp.route("/<int:collection_id>", methods=["DELETE"])
@jwt_required()
def delete_collection(collection_id):
    """Deletes a collection. Only the owner can delete a collection."""
    user_id = get_jwt_identity()

    collection = Collection.query.get(collection_id)
    if not collection:
        return jsonify({"error": "Collection not found"}), 404

    if str(collection.owner_id) != str(user_id):
        return jsonify({"error": "Only the owner can delete a collection"}), 403

    if collection.name == "Personal":
        return jsonify({"error": "Your personal collection cannot be deleted"}), 400

    db.session.delete(collection)
    db.session.commit()

    return jsonify({"message": "Collection deleted"}), 200