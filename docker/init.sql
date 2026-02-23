-- =============================================================
-- Wavy Services — Initialisation de la base de données
-- PostgreSQL 15+ — Sans RLS (sécurité gérée par le backend Express)
-- =============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Schéma auth (remplace Supabase GoTrue) ──────────────────────

CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id           UUID,
  email                 TEXT NOT NULL UNIQUE,
  encrypted_password    TEXT NOT NULL,
  email_confirmed_at    TIMESTAMPTZ DEFAULT NOW(),
  raw_app_meta_data     JSONB DEFAULT '{}',
  raw_user_meta_data    JSONB DEFAULT '{}',
  is_super_admin        BOOLEAN DEFAULT false,
  role                  TEXT DEFAULT 'authenticated',
  aud                   TEXT DEFAULT 'authenticated',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  confirmation_token    TEXT DEFAULT '',
  recovery_token        TEXT DEFAULT '',
  email_change_token_new TEXT DEFAULT '',
  email_change          TEXT DEFAULT ''
);

-- ── Enums ─────────────────────────────────────────────────────────

CREATE TYPE public.app_role         AS ENUM ('admin', 'editor', 'user_cra');
CREATE TYPE public.job_status       AS ENUM ('draft', 'published', 'archived');
CREATE TYPE public.training_status  AS ENUM ('draft', 'published', 'archived');
CREATE TYPE public.contract_type    AS ENUM ('cdi', 'cdd', 'freelance', 'stage', 'alternance');
CREATE TYPE public.training_modality AS ENUM ('distanciel', 'presentiel', 'hybride');
CREATE TYPE public.cra_status       AS ENUM ('draft', 'submitted', 'approved', 'rejected');
CREATE TYPE public.cra_day_state    AS ENUM ('worked', 'absent');
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'expired');
CREATE TYPE public.cra_validation_status AS ENUM ('pending', 'sent', 'approved', 'rejected');

-- ── Tables ────────────────────────────────────────────────────────

-- Rôles utilisateurs
CREATE TABLE public.user_roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       public.app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Profils
CREATE TABLE public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  first_name TEXT,
  last_name  TEXT,
  full_name  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invitations
CREATE TABLE public.user_invitations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT NOT NULL,
  first_name   TEXT,
  last_name    TEXT,
  token        TEXT NOT NULL UNIQUE,
  status       public.invitation_status NOT NULL DEFAULT 'pending',
  expires_at   TIMESTAMPTZ NOT NULL,
  invited_by   UUID REFERENCES auth.users(id),
  accepted_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- OTP codes
CREATE TABLE public.otp_codes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code       TEXT NOT NULL,
  used       BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reset password tokens
CREATE TABLE public.password_reset_tokens (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Catégories
CREATE TABLE public.categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  slug       TEXT NOT NULL UNIQUE,
  type       TEXT NOT NULL CHECK (type IN ('job', 'training', 'formation')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Offres d'emploi
CREATE TABLE public.jobs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  contract_type    public.contract_type NOT NULL DEFAULT 'cdi',
  location         TEXT NOT NULL DEFAULT '',
  salary_min       INTEGER,
  salary_max       INTEGER,
  salary           TEXT,
  domain           TEXT,
  experience       TEXT,
  description_html TEXT,
  requirements_html TEXT,
  duties_html      TEXT,
  featured         BOOLEAN DEFAULT false,
  status           public.job_status DEFAULT 'draft',
  priority         INTEGER DEFAULT 0,
  published_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  created_by       UUID REFERENCES auth.users(id)
);

-- Formations
CREATE TABLE public.trainings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  modality            public.training_modality NOT NULL DEFAULT 'presentiel',
  category_id         UUID REFERENCES public.categories(id),
  duration_hours      INTEGER,
  price               NUMERIC(10,2),
  description_html    TEXT,
  goals_html          TEXT,
  program_html        TEXT,
  prerequisites_html  TEXT,
  audience_html       TEXT,
  featured            BOOLEAN DEFAULT false,
  status              public.training_status DEFAULT 'draft',
  published_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Candidatures
CREATE TABLE public.applications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id     UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  phone      TEXT,
  message    TEXT,
  cv_url     TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Demandes de formation
CREATE TABLE public.training_leads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID REFERENCES public.trainings(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  company     TEXT,
  message     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Messages de contact
CREATE TABLE public.contact_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  phone      TEXT,
  subject    TEXT,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients
CREATE TABLE public.clients (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL UNIQUE,
  contact_email  TEXT,
  contact_name   TEXT,
  address        TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Validateurs client
CREATE TABLE public.client_validators (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name  TEXT,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignations consultant ↔ client
CREATE TABLE public.user_client_assignments (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id            UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  mission_name         TEXT,
  default_validator_id UUID REFERENCES public.client_validators(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, client_id)
);

-- CRA reports
CREATE TABLE public.cra_reports (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id                UUID REFERENCES public.clients(id) ON DELETE RESTRICT,
  mission_name             TEXT,
  company_name             TEXT NOT NULL DEFAULT 'Wavy Services',
  month                    TEXT NOT NULL,
  worked_days              INTEGER NOT NULL DEFAULT 0 CHECK (worked_days >= 0),
  absent_days              INTEGER NOT NULL DEFAULT 0 CHECK (absent_days >= 0),
  monthly_comment          TEXT,
  status                   public.cra_status NOT NULL DEFAULT 'draft',
  admin_comment            TEXT,
  client_email             TEXT,
  client_validation_status public.cra_validation_status DEFAULT 'pending',
  validation_token         TEXT UNIQUE,
  token_expires_at         TIMESTAMPTZ,
  validated_at             TIMESTAMPTZ,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Détail journalier CRA
CREATE TABLE public.cra_day_details (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cra_report_id  UUID NOT NULL REFERENCES public.cra_reports(id) ON DELETE CASCADE,
  date           DATE NOT NULL,
  state          public.cra_day_state NOT NULL DEFAULT 'worked',
  comment        TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cra_report_id, date)
);

-- ── Seed : Admin par défaut ───────────────────────────────────────

DO $$
DECLARE
  admin_id UUID := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change)
  VALUES (admin_id, '00000000-0000-0000-0000-000000000000', 'admin@wavy.local',
    crypt('Admin1234', gen_salt('bf')), NOW(),
    '{"provider":"email","providers":["email"]}', '{"full_name":"Admin Wavy"}',
    'authenticated', 'authenticated', NOW(), NOW(), '', '', '', '')
  ON CONFLICT DO NOTHING;

  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@wavy.local';

  INSERT INTO public.profiles (id, email, full_name)
  VALUES (admin_id, 'admin@wavy.local', 'Admin Wavy')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- OTP pré-validé pour éviter l'envoi d'email en local
  INSERT INTO public.otp_codes (user_id, code, used, expires_at)
  VALUES (admin_id, '000000', true, NOW() + INTERVAL '10 years')
  ON CONFLICT DO NOTHING;
END $$;

-- Catégories formations
INSERT INTO public.categories (name, slug, type) VALUES
  ('Développement Web',                'developpement-web',       'formation'),
  ('DevOps & Cloud',                   'devops-cloud',            'formation'),
  ('Data & Intelligence artificielle', 'data-ia',                 'formation'),
  ('Cybersécurité',                    'cybersecurite',           'formation'),
  ('Management & Leadership',          'management-leadership',   'formation'),
  ('Langues',                          'langues',                 'formation'),
  ('Bureautique & Office',             'bureautique-office',      'formation'),
  ('Infrastructure réseau',            'infrastructure-reseau',   'formation')
ON CONFLICT (slug) DO NOTHING;
