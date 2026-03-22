# WordVault 📖

A collaborative vocabulary tracker. Encounter a new word? Save it, get the definition instantly, and build your personal lexicon over time. Share collections with friends and colleagues.

🔗 **Live app:** [wordvault-eight.vercel.app](https://wordvault-eight.vercel.app)

---

## What it does

- **Add words** — type any word and get the definition, part of speech, and example sentence automatically
- **Add notes** — record where you saw the word, context, or anything you want to remember
- **Collections** — organise words into personal or shared collections
- **Collaborate** — invite others to a shared collection by email
- **Export** — download your entire word list as an Excel file (.xlsx)

---

## Tech Stack

| Layer | Technology | Hosting |
|---|---|---|
| Frontend | React + Vite | Vercel |
| Backend | Flask (Python) | Render |
| Database | PostgreSQL | Supabase |
| Dictionary | [Free Dictionary API](https://dictionaryapi.dev) | — |
| Auth | JWT (flask-jwt-extended) | — |

---

## Project Structure

```
wordvault/
├── backend/
│   ├── app.py                  ← Flask entry point
│   ├── config.py               ← reads secrets from .env
│   ├── extensions.py           ← DB, JWT, bcrypt, CORS setup
│   ├── models.py               ← database tables
│   ├── requirements.txt        ← Python dependencies
│   ├── .env                    ← secrets (never committed)
│   └── routes/
│       ├── auth.py             ← register, login, me
│       ├── words.py            ← add, list, delete, export
│       └── collections.py      ← create, invite, manage
│
└── frontend/
    └── src/
        ├── main.jsx            ← React entry point
        ├── App.jsx             ← routing
        ├── api.js              ← all backend API calls
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            └── Dashboard.jsx
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create a new account |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/me` | Get current user info |

### Words
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/words/` | Add a word (auto-fetches definition) |
| GET | `/api/words/` | List words in a collection |
| DELETE | `/api/words/<id>` | Delete a word |
| GET | `/api/words/export` | Download words as Excel file |

### Collections
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/collections/` | Create a collection |
| GET | `/api/collections/` | List all collections |
| POST | `/api/collections/<id>/invite` | Invite a member by email |
| GET | `/api/collections/<id>/members` | List members |
| DELETE | `/api/collections/<id>/members/<user_id>` | Remove a member |
| DELETE | `/api/collections/<id>` | Delete a collection |

---

## Running Locally

### Prerequisites
- Python 3.10+
- Node.js 18+
- A [Supabase](https://supabase.com) account (free)

### Backend

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:
```
DATABASE_URL=your_supabase_connection_string
JWT_SECRET_KEY=any-random-secret-string
```

Run Flask:
```bash
python app.py
```

Backend runs at `http://127.0.0.1:5000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

> Make sure `frontend/src/api.js` has `baseURL` pointing to `http://127.0.0.1:5000/api` for local development.

---

## Deploying

### Backend → Render
- Runtime: Python 3
- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `gunicorn app:app --bind 0.0.0.0:10000`
- Environment Variables: `DATABASE_URL`, `JWT_SECRET_KEY`, `FLASK_APP=app.py`

> ⚠️ Use Supabase's **Session Pooler** connection string (not Direct Connection) — Render's free tier only supports IPv4.

### Frontend → Vercel
- Root Directory: `frontend`
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

> Update `baseURL` in `frontend/src/api.js` to your Render backend URL before deploying.

---

## Database Schema

```
users
  id, email, password_hash, username, created_at

collections
  id, name, is_shared, owner_id, created_at

collection_members
  id, collection_id, user_id, role, joined_at

words
  id, word, part_of_speech, definition, example,
  notes, added_by, collection_id, created_at
```

---

## Roadmap

- [ ] Google SSO — sign in with Google account
- [ ] Email invites for shared collections
- [ ] Search and filter words
- [ ] Edit word notes
- [ ] Mobile responsive design
- [ ] Landing page for new visitors
- [ ] Android app (React Native)
- [ ] Custom domain

---

## Feedback

Try the app at [wordvault-eight.vercel.app](https://wordvault-eight.vercel.app) and open an issue or reach out with feedback!
