"""
Defines the database models for the WordVault application, 
    including User, 
              Collection, 
              CollectionMember, and 
              Word.
"""

from datetime   import datetime
from extensions import db

# ── User ──────────────────────────────────────────────────────────────────────
class User(db.Model):
    """Represents a user of the application. 
       Each user has a unique email and a default personal collection.
    """
    __tablename__ = "users"

    id            = db.Column(db.Integer, primary_key=True)
    email         = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=True) # nullable for OAuth users
    username      = db.Column(db.String(100), nullable=False)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)

    # email verification
    is_verified  = db.Column(db.Boolean, default=False, nullable=False)
    verify_token = db.Column(db.String(100), nullable=True)

    # password reset
    reset_token         = db.Column(db.String(100), nullable=True)
    reset_token_expires = db.Column(db.DateTime, nullable=True)

    # relationships
    words              = db.relationship("Word", backref="owner", lazy=True)
    owned_collections  = db.relationship("Collection", backref="owner", lazy=True)
    memberships        = db.relationship("CollectionMember", backref="user", lazy=True)

    def to_dict(self):
        """Convert the User object into a dictionary for easy JSON serialization."""
        return {
            "id"          : self.id,
            "email"       : self.email,
            "username"    : self.username,
            "is_verified" : self.is_verified,
        }


# ── Collection ────────────────────────────────────────────────────────────────
# A collection is a group of words. Every user gets a default "Personal" collection.
# They can also create shared collections and invite others.
class Collection(db.Model):
    """Represents a collection of words. 
       Can be personal (is_shared=False) or shared (is_shared=True).
    """
    __tablename__ = "collections"

    id         = db.Column(db.Integer, primary_key=True)
    name       = db.Column(db.String(255), nullable=False)
    is_shared  = db.Column(db.Boolean, default=False)   # False = personal, True = collaborative
    owner_id   = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # relationships
    words   = db.relationship("Word",             backref="collection", lazy=True)
    members = db.relationship("CollectionMember", backref="collection", lazy=True)

    def to_dict(self):
        """Convert the Collection object into a dictionary for easy JSON serialization."""
        return {
            "id"         : self.id,
            "name"       : self.name,
            "is_shared"  : self.is_shared,
            "owner_id"   : self.owner_id,
            "created_at" : self.created_at.isoformat(),
        }


# ── CollectionMember ──────────────────────────────────────────────────────────
# Tracks which users have access to a shared collection.
# Role: "admin" (can invite others) or "member" (can only add words)
class CollectionMember(db.Model):
    """Represents a user's membership in a shared collection, including their role (admin/member)."""
    __tablename__ = "collection_members"

    id            = db.Column(db.Integer, primary_key=True)
    collection_id = db.Column(db.Integer, db.ForeignKey("collections.id"), nullable=False)
    user_id       = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    role          = db.Column(db.String(50), default="member")  # "admin" or "member"
    joined_at     = db.Column(db.DateTime, default=datetime.utcnow)


# ── Word ──────────────────────────────────────────────────────────────────────
class Word(db.Model):
    """Represents a word added by a user to a collection, including its definition, example, and optional notes."""
    __tablename__ = "words"

    id             = db.Column(db.Integer, primary_key=True)
    word           = db.Column(db.String(255), nullable=False)
    part_of_speech = db.Column(db.String(100))
    definition     = db.Column(db.Text)
    example        = db.Column(db.Text)
    notes          = db.Column(db.Text)                          # user's personal note
    added_by       = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    collection_id  = db.Column(db.Integer, db.ForeignKey("collections.id"), nullable=False)
    created_at     = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        """Convert the Word object into a dictionary for easy JSON serialization."""
        return {
            "id"             : self.id,
            "word"           : self.word,
            "part_of_speech" : self.part_of_speech,
            "definition"     : self.definition,
            "example"        : self.example,
            "notes"          : self.notes,
            "added_by"       : self.added_by,
            "collection_id"  : self.collection_id,
            "created_at"     : self.created_at.isoformat(),
        }
    