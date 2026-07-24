# CapISO Backend

FastAPI backend for CapISO.

This backend foundation exposes the health endpoint and configures the PostgreSQL persistence foundation with SQLAlchemy 2.x and Alembic.

The backend covers identity, organization membership, contextual onboarding, and
deterministic preparation and validation of an ISO/IEC 27001:2022 ISMS scope.
The control assessment, evidence management, scoring, remediation, and document
generation modules are intentionally not implemented in this lot.

## Dependencies

- FastAPI
- Uvicorn
- SQLAlchemy 2.x
- psycopg 3
- pydantic-settings
- Alembic
- pwdlib with Argon2
- PyJWT
- email-validator
- Pytest

## Install

```bash
uv sync
```

## Configuration

Copy the root `.env.example` to `.env` for local development and adjust only development values.

```bash
DATABASE_URL=postgresql+psycopg://capiso:change-me@localhost:5433/capiso
DATABASE_ECHO=false
FRONTEND_URL=http://localhost:5173
EMAIL_FROM=no-reply@capiso.local
EMAIL_VERIFICATION_EXPIRE_HOURS=24
EMAIL_RESEND_COOLDOWN_SECONDS=60
SMTP_HOST=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_USE_TLS=true
```

Never commit a real `.env` file.

## PostgreSQL

From the repository root:

```bash
docker compose up -d postgres
```

The compose file starts only PostgreSQL for local development.
It exposes PostgreSQL on `127.0.0.1:5433` to avoid conflicts with another local PostgreSQL using `5432`.

## Run

```bash
uv run uvicorn app.main:app --reload
```

The API is available at `http://127.0.0.1:8000`.

## Health Check

```bash
curl http://127.0.0.1:8000/api/v1/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "capiso-api"
}
```

## Authentication

The authentication endpoints are:

```text
POST /api/v1/auth/register
POST /api/v1/auth/register-with-organization
POST /api/v1/auth/verify-email
POST /api/v1/auth/resend-verification
POST /api/v1/auth/login
GET /api/v1/auth/me
```

Emails are normalized before storage with `email.strip().lower()`.
Plain-text passwords must never be stored, returned in API responses, or written to logs.

`is_active` and `is_verified` are intentionally separate:

- `is_active` says whether the account is allowed or suspended.
- `is_verified` says whether the e-mail address has been confirmed.

A newly registered user can therefore be `is_active=true` and `is_verified=false`.
No normal access token is returned until the e-mail address is verified.

### First admin signup

`POST /api/v1/auth/register-with-organization` creates, in one database transaction:

- the user account;
- the organization;
- the creator membership with role `administrateur_entreprise`;
- an e-mail verification token stored only as a SHA-256 hash.

The organization starts with `status=pending_activation`, and the membership starts with `status=pending`.
After the database commit, CapISO sends a verification e-mail using `FRONTEND_URL`:

```text
http://localhost:5173/verify-email?token=<raw-token>
```

Example request:

```json
{
  "first_name": "Sara",
  "last_name": "Amrani",
  "email": "sara@atlascloud.ma",
  "password": "MotDePasseLongEtUnique123!",
  "organization": {
    "name": "Atlas Cloud Solutions",
    "country": "MA",
    "sector": "software_saas",
    "size_range": "11_50"
  }
}
```

Example pending response:

```json
{
  "status": "pending_email_verification",
  "message": "Votre compte a ete cree. Verifiez votre adresse e-mail pour l'activer.",
  "email_masked": "s***@atlascloud.ma",
  "verification_expires_in": 86400,
  "organization": {
    "id": "uuid",
    "name": "Atlas Cloud Solutions",
    "country": "MA",
    "sector": "software_saas",
    "size_range": "11_50",
    "status": "pending_activation",
    "current_user_role": "administrateur_entreprise",
    "membership_status": "pending"
  },
  "next_step": "verify_email",
  "email_delivery_status": "sent"
}
```

`POST /api/v1/auth/register` remains available for account-only registration. It creates no organization, creates a verification token, sends the verification e-mail, and returns the same pending status without an access token.

### E-mail verification

The frontend will read the raw token from the verification URL and submit:

```json
{
  "token": "raw-token-from-email"
}
```

to `POST /api/v1/auth/verify-email`.

For a valid token, CapISO marks the user as verified, stores `email_verified_at`, activates only the organization and membership linked to that token, marks the token as used, invalidates other active tokens for the same user, and returns:

```json
{
  "status": "verified",
  "message": "Votre adresse e-mail a ete verifiee.",
  "next_step": "login"
}
```

The user must then sign in through `POST /api/v1/auth/login`.

### Resend verification

`POST /api/v1/auth/resend-verification` accepts:

```json
{
  "email": "sara@atlascloud.ma"
}
```

The response is always generic so the endpoint does not expose whether an account exists:

```json
{
  "message": "Si un compte en attente correspond a cette adresse, un nouvel e-mail de verification sera envoye."
}
```

For an unverified account, old active tokens are invalidated and a new token is generated unless the 60-second resend cooldown is still active.

### Login behavior

Unknown e-mail or wrong password returns `401 Unauthorized` with the same generic message.
If the password is correct but the e-mail address is not verified, login returns `403 Forbidden` with code `email_verification_required`.
Only active and verified users receive the normal JWT access token.

## Organizations

The initial organization endpoints are:

```text
POST /api/v1/organizations
GET /api/v1/organizations
GET /api/v1/organizations/{organization_id}
```

Creating an organization also creates the creator's `organization_members` row with the `administrateur_entreprise` role. Both writes are committed in a single transaction. If either write fails, the transaction is rolled back.

For an already verified user, `POST /api/v1/organizations` requires `name`, `country`, `sector`, and `size_range`. The new organization and membership are created directly as active. No new verification e-mail is sent.

The domain concepts stay separate:

- User account: name, e-mail, password hash, active status, verified status.
- Organization: company/workspace name, country, sector, size range, activation status.
- Organization membership: link between a user and an organization, with role and membership status.

## Onboarding organisationnel

L'onboarding enregistre des faits déclarés sur l'organisation. Il ne mesure ni la
conformité, ni la maturité, ni l'efficacité des contrôles et ne calcule aucun
score d'audit ou de certification. Le seul pourcentage retourné est la complétude
du formulaire.

Les informations déjà présentes sur `organizations` (`name`, `country`,
`sector`, `size_range`) sont retournées dans le résumé et ne sont pas redemandées.

Le catalogue statique est versionné par `ONBOARDING_SCHEMA_VERSION = "1.0"` et
est disponible pour tout compte actif et vérifié :

```text
GET /api/v1/onboarding/catalog
```

Il contient trois étapes, huit questions obligatoires et une facultative :

1. Activité et processus
   - activité principale : nom, description limitée à 300 caractères et natures
     (`web_application_saas`, `it_services_managed_services`,
     `consulting_professional_services`, `ecommerce`, `software_development`,
     `hosting_operations`, `customer_support`, `data_processing`,
     `internal_business_activity`, `other`) ;
   - processus importants (`main_product_or_service`, `customer_support`,
     `software_development`, `infrastructure_hosting`, `billing_payment`,
     `human_resources_payroll`, `sales_crm`, `delivery_operations`, `other`).
2. Organisation et technologies
   - équipes et fonctions (`executive_management`, `it`, `security`,
     `infrastructure_devops`, `software_development`, `customer_support`,
     `sales`, `human_resources`, `finance`, `legal_compliance`, `operations`,
     `external_contractors`, `whole_organization`, `other`) ;
   - mode de travail (`onsite`, `hybrid`, `mainly_remote`, `fully_remote`),
     sites et prestataires réguliers ;
   - catégories et noms connus des systèmes ;
   - hébergement (`public_cloud`, `private_cloud`, `dedicated_hosting`,
     `internal_servers`, `mainly_third_party_saas`, `hybrid`, `unknown`) et
     fournisseurs cloud connus.
3. Informations et dépendances
   - catégories de données et niveau maximal de sensibilité ;
   - fournisseurs critiques, avec la déclaration obligatoire `identified`,
     `none_identified` ou `unknown` ;
   - exigences externes, facultatives. Leur statut par défaut est
     `declared_to_confirm` : CapISO ne conclut pas à leur applicabilité.

Les valeurs personnalisées utilisent `type: "other"` et un `custom_name`.
`unknown` est une réponse valide : elle produit un avertissement et, lorsque
nécessaire, une clarification dans le périmètre. Un nom d'outil réel n'est
jamais inventé. Une catégorie de système dont le nom est inconnu produit un
libellé explicite tel que `Système principal non identifié — cloud infrastructure`
avec `identification_status: "to_determine"`.

### Cycle et sauvegarde

```text
POST /api/v1/organizations/{organization_id}/onboarding
GET  /api/v1/organizations/{organization_id}/onboarding
PUT  /api/v1/organizations/{organization_id}/onboarding/steps/1
PUT  /api/v1/organizations/{organization_id}/onboarding/steps/2
PUT  /api/v1/organizations/{organization_id}/onboarding/steps/3
POST /api/v1/organizations/{organization_id}/onboarding/review
POST /api/v1/organizations/{organization_id}/onboarding/submit
POST /api/v1/organizations/{organization_id}/onboarding/validate
POST /api/v1/organizations/{organization_id}/onboarding/revise
```

`POST .../onboarding` reprend le brouillon actif ou crée la version suivante.
Chaque `PUT` remplace les collections de son étape dans une transaction unique,
ce qui convient à une sauvegarde automatique sans doublon.

Exemple d'étape 1 :

```json
{
  "activity": {
    "name": "Plateforme SaaS documentaire",
    "description": "Développement, hébergement et support de la plateforme.",
    "nature_types": ["web_application_saas", "software_development"]
  },
  "processes": [
    {"type": "main_product_or_service", "custom_name": null},
    {"type": "software_development", "custom_name": null}
  ]
}
```

Exemple d'étape 2 :

```json
{
  "teams": [{"type": "software_development", "custom_name": null}],
  "work_mode": "hybrid",
  "multiple_sites_status": "yes",
  "sites": [{
    "name": "Siège",
    "city": "Casablanca",
    "country": "MA",
    "site_type": "headquarters"
  }],
  "regular_external_contractors_status": "no",
  "system_categories": ["source_code_repository", "cloud_infrastructure"],
  "systems": [{
    "name": "GitHub",
    "system_type": "source_code_repository",
    "supported_activity_or_process": "software_development",
    "provider_or_host": "GitHub",
    "identification_status": "identified"
  }],
  "hosting_models": ["public_cloud"],
  "selected_cloud_providers": ["unknown"]
}
```

Exemple d'étape 3 :

```json
{
  "data_categories": [
    {"type": "customer_data", "custom_name": null},
    {"type": "source_code", "custom_name": null}
  ],
  "highest_sensitivity_level": "confidential",
  "suppliers_identification_status": "identified",
  "suppliers": [{
    "name": "GitHub",
    "supplier_type": "software_development",
    "related_service_or_system": "GitHub",
    "processes_or_hosts_data": "yes",
    "has_system_access": "yes",
    "criticality": "high"
  }],
  "external_requirements": [{
    "requirement_type": "data_protection_gdpr",
    "details": null,
    "confirmation_status": "declared_to_confirm"
  }]
}
```

La révision retourne `completion_percentage`, `blocking_errors`, `warnings`,
`unknown_items` et un `derived_context` déterministe (`cloud_used`,
`remote_work_used`, `software_development_present`,
`external_contractors_present`, `sensitive_data_present`,
`critical_suppliers_present`, `multiple_sites_present`).

La soumission passe le brouillon à `pending_review`. Seul un
`administrateur_entreprise` peut le valider. La validation conserve le
validateur, la date et un résumé structuré. `revise` clone la dernière version
validée dans une nouvelle version `draft`; l'ancienne reste inchangée.

### Modèles d'onboarding

- `OnboardingSession` : version, schéma, statut, étape, complétude et traçabilité ;
- `OrganizationActivity` et `OrganizationProcess` : activité et processus ;
- `OrganizationTeam`, `OrganizationProfile`, `OrganizationSite` et
  `OrganizationSystem` : organisation et technologies ;
- `OrganizationDataCategory`, `OrganizationSupplier` et
  `OrganizationExternalRequirement` : informations et dépendances.

Une seule session `draft` ou `pending_review` peut être active par organisation.
Les statuts historiques sont `validated` et `archived`.

## Périmètre SMSI

Le périmètre transforme l'onboarding validé en candidats organisationnels,
physiques et technologiques. Il ne crée pas de contrôle ISO, de preuve ou de
remédiation. Les exigences externes restent du contexte et ne deviennent jamais
des éléments de périmètre.

Génération :

```text
POST /api/v1/organizations/{organization_id}/scopes/from-onboarding
```

```json
{
  "onboarding_session_id": "00000000-0000-0000-0000-000000000000",
  "name": "Périmètre SMSI initial"
}
```

La session source doit être validée. La création du `IsmsScope`, de ses
`ScopeElement` et des `ScopeClarification` requises est transactionnelle.
La description est produite par un template Python déterministe et reste
modifiable tant que le périmètre est un brouillon.

Chaque candidat reçoit une suggestion explicable :

- `include_recommended` pour l'activité principale, les processus, les équipes,
  les données, les systèmes liés et les fournisseurs critiques ;
- `review_required` quand le lien exact doit être confirmé ;
- `insufficient_information` pour un système, un hébergement ou une dépendance
  non identifiés ;
- `link_not_identified` est réservé aux liens absents.

CapISO ne propose jamais automatiquement une exclusion et initialise toujours
`user_decision` à `to_determine`. L'utilisateur choisit ensuite `include`,
`exclude` ou `to_determine`. Une exclusion exige une justification non vide.

```json
{
  "user_decision": "exclude",
  "justification": "Le processus de paie est entièrement externalisé et hors du périmètre initial."
}
```

Les clarifications sont des tâches de définition du périmètre, pas des actions
de remédiation. Elles sont créées avec discernement pour les systèmes inconnus,
les fournisseurs critiques ou accédant aux systèmes, les informations sensibles
et les réponses inconnues. Elles utilisent `todo`, `in_progress`, `resolved` ou
`cancelled`, avec propriétaire, échéance et commentaire de résolution.

### Endpoints du périmètre

```text
GET   /api/v1/organizations/{organization_id}/scopes
GET   /api/v1/organizations/{organization_id}/scopes/{scope_id}
PATCH /api/v1/organizations/{organization_id}/scopes/{scope_id}
GET   /api/v1/organizations/{organization_id}/scopes/{scope_id}/elements
PATCH /api/v1/organizations/{organization_id}/scopes/{scope_id}/elements/{element_id}
GET   /api/v1/organizations/{organization_id}/scopes/{scope_id}/clarifications
PATCH /api/v1/organizations/{organization_id}/scopes/{scope_id}/clarifications/{clarification_id}
POST  /api/v1/organizations/{organization_id}/scopes/{scope_id}/review
POST  /api/v1/organizations/{organization_id}/scopes/{scope_id}/submit
POST  /api/v1/organizations/{organization_id}/scopes/{scope_id}/validate
POST  /api/v1/organizations/{organization_id}/scopes/{scope_id}/revise
```

La révision retourne les erreurs bloquantes, avertissements, compteurs,
clarifications ouvertes et problèmes de dépendance. La validation exige au
minimum une activité, une équipe et une catégorie d'information incluses, ainsi
que les systèmes requis; elle refuse les exclusions non justifiées et les
éléments critiques encore indéterminés.

Seul un administrateur d'entreprise peut modifier, soumettre, valider ou réviser.
Un périmètre `validated` est immuable. `revise` clone ses instantanés, décisions
et clarifications dans la version suivante sans modifier la version source ni
la version d'onboarding liée.

### Permissions et isolation

Toutes les routes exigent un compte actif et vérifié. Tout membre actif peut
lire l'onboarding, les périmètres, éléments et clarifications de son
organisation. Les écritures sont réservées à `administrateur_entreprise`.

`require_organization_member` et `require_organization_admin` vérifient
systématiquement l'organisation et l'adhésion active. Toutes les requêtes de
ressource sont filtrées par `organization_id`. Une ressource d'une autre
organisation retourne le même `404` générique qu'une ressource inexistante.

Les opérations de remplacement, validation, génération et versionnement sont
atomiques. Les clés étrangères vers les historiques validés utilisent
`RESTRICT`; aucune route de suppression n'est exposée.

## Test

```bash
uv run pytest
```

Some health endpoint tests start a local Uvicorn process and require local socket access.

## Alembic

Alembic is configured with the first identity migration.

Useful commands from `backend/`:

```bash
uv run alembic current
uv run alembic check
uv run alembic revision --autogenerate -m "message"
uv run alembic upgrade head
```
