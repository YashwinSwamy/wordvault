import os
from dotenv import load_dotenv
 
load_dotenv()
 
class Config:
    # Database - Supabase PostgreSQL connection string
    SQLALCHEMY_DATABASE_URI        = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
 
    # JWT - used to secure API routes
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-this-in-production")
    SECRET_KEY     = os.getenv("SECRET_KEY")

    GOOGLE_CLIENT_ID        = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET    = os.getenv("GOOGLE_CLIENT_SECRET")
    SESSION_COOKIE_SAMESITE = "None"
    SESSION_COOKIE_SECURE   = True

    # Gmail SMTP for transactional email
    GMAIL_USER         = os.getenv("GMAIL_USER", "")
    GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")

    # CORS — restrict to known frontend origins
    # Override via CORS_ORIGINS env var (comma-separated) on Render
    CORS_ORIGINS = os.getenv(
        "CORS_ORIGINS",
        "https://wordvault-eight.vercel.app,http://localhost:5173"
    ).split(",")
 