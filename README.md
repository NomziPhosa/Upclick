# UpClick

Online coding school prototype for IMY 320. FastAPI backend with a SQLite database, and an HTML/CSS/JavaScript front end served by the same server.

Full explanations of the code are in `UpClick_Code_Documentation.pdf`.

## Requirements

- Python 3.10 or newer

## Setup (first time)

```bash
cd upclick
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
```

## Run

```bash
uvicorn main:app --reload
```

Then open **http://localhost:8000** in your browser.

- Interactive API docs: http://localhost:8000/docs
- Opening `static/index.html` directly will not work; the site must be opened through the server.

## Admin account

Created automatically on first run:

- Email: `admin@upclick.test`
- Password: `upclick-admin`

Log in with it and click **Admin** in the header to add, edit or delete courses and see sign-ups, enrolments and feedback.

Change these before putting the site online by setting environment variables before starting the server:

| Variable | Default | Purpose |
|---|---|---|
| `ADMIN_EMAIL` | `admin@upclick.test` | Admin login email |
| `ADMIN_PASSWORD` | `upclick-admin` | Admin login password |
| `SECRET_KEY` | generated into `.secret_key` | Signs login tokens |
| `DATABASE_URL` (or `POSTGRES_URL`) | `sqlite:///./upclick.db` | Database location. Postgres URLs are supported. |

## Deploy to Vercel

1. Push this folder to a GitHub repository (the `.gitignore` keeps the local database and secrets out).
2. In Vercel: **Add New → Project**, import the repository, leave the settings as they are and click **Deploy**. Vercel detects the FastAPI `app` in `main.py` and serves the `static` folder from its CDN.
3. **Add a database.** Vercel cannot keep files between requests, so without this the site runs on a temporary database that resets. In the project: **Storage → Create Database → Neon (Postgres)**, connect it to the project. This adds `DATABASE_URL` automatically.
4. **Settings → Environment Variables**, add:
   - `SECRET_KEY` – any long random string (e.g. from `python -c "import secrets; print(secrets.token_hex(32))"`)
   - `ADMIN_PASSWORD` – your own admin password
5. **Deployments → ⋯ → Redeploy** so the new variables take effect. The tables, starter courses and admin account are created on the first request.

## Resetting

Locally: stop the server and delete `upclick.db`. It is recreated with the 12 starter courses and the admin account on the next start. On Vercel with Neon, reset the database from the Neon dashboard (or create a new branch).

## Files

```
upclick/
├── main.py          FastAPI app and all API routes
├── database.py      Database connection and tables
├── security.py      Password hashing and login tokens
├── seed_data.py     The 12 starter courses
├── requirements.txt
└── static/          Front end (index.html, styles.css, script.js)
```
