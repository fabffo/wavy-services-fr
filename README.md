# Wavy Services FR

Application Wavy Services — version autonome sans Supabase, déployable sur OVH.

## Architecture

```
frontend/   React 18 + Vite + TypeScript + shadcn-ui
backend/    Express/Node.js + PostgreSQL + JWT
docker/     Docker Compose (postgres + backend + nginx)
```

**Authentification** : JWT (jsonwebtoken + bcrypt) — sans GoTrue
**Base de données** : PostgreSQL 15 direct via `pg`
**Emails** : Resend HTTP API
**PDF** : jsPDF (génération CRA)
**Uploads** : multer (CV en local `/uploads/cvs/`)

---

## Démarrer en développement

### Prérequis
- Node.js 20+
- Docker Desktop

### 1. Backend

```bash
cd backend
cp .env.example .env   # Éditer DATABASE_URL, JWT_SECRET
npm install
npm run dev
# → http://localhost:3000
```

### 2. PostgreSQL local (via Docker)

```bash
docker run -d \
  --name wavy_pg \
  -e POSTGRES_USER=wavy \
  -e POSTGRES_PASSWORD=wavy_password \
  -e POSTGRES_DB=wavy \
  -p 5432:5432 \
  -v $(pwd)/docker/init.sql:/docker-entrypoint-initdb.d/init.sql \
  postgres:15-alpine
```

### 3. Frontend

```bash
cd frontend
npm install
# .env pointe sur http://localhost:3000 par défaut
npm run dev
# → http://localhost:8080
```

**Compte admin par défaut :**
- Email : `admin@wavy.local`
- Mot de passe : `Admin1234`

---

## Déploiement Docker Compose (preprod/OVH)

```bash
cd docker
cp .env.example .env     # Éditer JWT_SECRET, RESEND_API_KEY, FRONTEND_URL

# Builder le frontend
cd ../frontend && npm install && npm run build
cd ../docker

# Lancer
docker-compose up -d --build
# → http://localhost (ou votre domaine)
```

### Variables d'environnement

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Clé secrète JWT (64 caractères random) |
| `RESEND_API_KEY` | Clé API Resend pour les emails |
| `FRONTEND_URL` | URL publique du frontend (pour les liens dans les emails) |
| `DATABASE_URL` | Connexion PostgreSQL |

---

## API Endpoints

### Auth
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/login` | Connexion → JWT |
| POST | `/api/auth/signup` | Inscription |
| POST | `/api/auth/logout` | Déconnexion |
| GET | `/api/auth/me` | Utilisateur courant |
| POST | `/api/auth/reset-password` | Envoi email reset |
| POST | `/api/auth/reset-password-confirm` | Confirmation reset |

### OTP (auth admin 2 étapes)
| POST | `/api/functions/send-otp` | Envoyer OTP par email |
| POST | `/api/functions/verify-otp` | Vérifier OTP |

### CRA
| GET/POST | `/api/cra` | Liste/Création CRA |
| GET/PUT | `/api/cra/:id` | Détail/Mise à jour |
| PUT | `/api/cra/:id/submit` | Soumettre pour validation |
| GET/POST | `/api/cra/:id/days` | Détail journalier |
| POST | `/api/functions/send-cra-validation` | Email validation client |
| POST | `/api/functions/validate-cra` | Traitement validation (par token) |

### Autres
`/api/jobs`, `/api/trainings`, `/api/clients`, `/api/users`, `/api/applications`, `/api/training-leads`, `/api/stats`

---

## Structure BDD

Tables principales : `auth.users`, `profiles`, `user_roles`, `user_invitations`, `otp_codes`, `clients`, `user_client_assignments`, `cra_reports`, `cra_day_details`, `jobs`, `trainings`, `categories`, `applications`, `training_leads`, `contact_messages`, `password_reset_tokens`
