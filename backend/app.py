from flask import Flask
from config import Config
from extensions import db, jwt, bcrypt, cors

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # initialise extensions
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})  # tighten in production

    # register route blueprints
    from routes.auth        import auth_bp
    from routes.words       import words_bp
    from routes.collections import collections_bp

    app.register_blueprint(auth_bp,        url_prefix="/api/auth")
    app.register_blueprint(words_bp,       url_prefix="/api/words")
    app.register_blueprint(collections_bp, url_prefix="/api/collections")

    # create tables if they don't exist yet
    with app.app_context():
        db.create_all()

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)