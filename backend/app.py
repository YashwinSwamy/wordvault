""""""

from flask                             import Flask
from config                            import Config
from extensions                        import db, jwt, bcrypt, cors
from authlib.integrations.flask_client import OAuth

oauth = OAuth()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # initialise extensions
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config.get("CORS_ORIGINS")}})

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

    # init_oauth(app)
    app.register_blueprint(auth_bp,        url_prefix="/api/auth")
    app.register_blueprint(words_bp,       url_prefix="/api/words")
    app.register_blueprint(collections_bp, url_prefix="/api/collections")

    # create tables if they don't exist yet
    with app.app_context():
        db.create_all()


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