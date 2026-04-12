""""""

from flask                             import Flask
from sqlalchemy                        import text
from config                            import Config
from extensions                        import db, jwt, bcrypt, cors
from authlib.integrations.flask_client import OAuth

oauth = OAuth()


def _migrate_columns(app):
    """Add new columns to existing tables without dropping data (PostgreSQL only)."""
    statements = [
        "ALTER TABLE users       ADD COLUMN IF NOT EXISTS is_verified         BOOLEAN NOT NULL DEFAULT FALSE",
        "ALTER TABLE users       ADD COLUMN IF NOT EXISTS verify_token        VARCHAR(100)",
        "ALTER TABLE users       ADD COLUMN IF NOT EXISTS reset_token         VARCHAR(100)",
        "ALTER TABLE users       ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP",
        "ALTER TABLE collections ADD COLUMN IF NOT EXISTS share_token         VARCHAR(100)",
        "ALTER TABLE collections ADD COLUMN IF NOT EXISTS share_expires_at    TIMESTAMP",
        "ALTER TABLE users       ADD COLUMN IF NOT EXISTS last_login          TIMESTAMP",
    ]
    with app.app_context():
        with db.engine.connect() as conn:
            for stmt in statements:
                conn.execute(text(stmt))
            conn.commit()


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # initialise extensions
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    # cors.init_app(app, resources={r"/api/*": {"origins": app.config.get("CORS_ORIGINS")}})
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    # initialise OAuth
    oauth.init_app(app)
    oauth.register(
        name                = "google",
        client_id           = app.config.get("GOOGLE_CLIENT_ID"),
        client_secret       = app.config.get("GOOGLE_CLIENT_SECRET"),
        server_metadata_url = "https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs       = {"scope": "openid email profile"},
    )

    # register route blueprints
    from routes.auth        import auth_bp
    from routes.words       import words_bp
    from routes.collections import collections_bp
    from routes.share       import share_bp
    from routes.settings    import settings_bp

    app.register_blueprint(auth_bp,        url_prefix="/api/auth")
    app.register_blueprint(words_bp,       url_prefix="/api/words")
    app.register_blueprint(collections_bp, url_prefix="/api/collections")
    app.register_blueprint(share_bp,       url_prefix="/api/share")
    app.register_blueprint(settings_bp,    url_prefix="/api/settings")

    # create tables if they don't exist yet, then add any new columns
    with app.app_context():
        db.create_all()
        _migrate_columns(app)


    # health check — keeps Render awake + Supabase active
    @app.route("/health")
    def health():
        try:
            from models import User
            User.query.first()
            return {"status": "ok", "db": "connected"}, 200
        except Exception as e:
            return {"status": "error", "db": str(e)}, 500
    
    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
