# Adding a New SSO Provider

This project implements SSO in a provider-based, clean architecture style.

The key idea is:

- **Provider-specific OAuth logic** lives in `backend/infrastructure/services/sso/<provider>.py`
- **Provider-specific HTTP routes** live in `backend/presentation/sso/<provider>.py`
- **User provisioning + profile upsert + JWT issuance** is centralized in `backend/application/auth/sso_use_cases.py`
- `backend/presentation/routes_sso.py` is only a **router aggregator** that includes provider routers.

---

## 1) Decide the provider name (slug)

Pick a short lowercase slug, e.g.

- `google`
- `github`
- `apple`

This slug becomes part of both URLs:

- Backend start: `/api/auth/sso/<provider>/start`
- Backend callback: `/api/auth/sso/<provider>/callback`
- Frontend callback page: `/sso/<provider>/callback`

---

## 2) Backend: add the provider OAuth client (infrastructure)

Create a new file:

- `backend/infrastructure/services/sso/<provider>.py`

Responsibilities of this module:

- Build the provider authorize URL params
- Exchange `code` -> provider access token (and/or id token)
- Fetch user identity data (at minimum: email + email_verified)

Pattern to follow:

- Implement a `<Provider>OAuthClient` class
- Provide:
  - `build_authorize_params(state: str) -> dict[str, str]`
  - `fetch_userinfo(code: str) -> <Provider>UserInfo`

You can use `GoogleOAuthClient` in:

- `backend/infrastructure/services/sso/google.py`

as the reference implementation.

---

## 3) Backend: add the provider router (presentation)

Create a new file:

- `backend/presentation/sso/<provider>.py`

Use the same structure as `backend/presentation/sso/google.py`:

- `router = APIRouter(prefix="/api/auth/sso/<provider>", tags=["auth"])`
- `GET /start`
  - Create OAuth `state` using `OAuthStateService`
  - Redirect to provider authorize URL
- `GET /callback`
  - Validate `state`
  - Handle provider `error`
  - Exchange `code` -> user identity via the provider OAuth client
  - Call `SsoLoginUseCase` to provision/sign-in and mint the JWT
  - Redirect to frontend callback page with `#access_token=...&expires_at=...`

### Important details

- **Always put tokens in the URL fragment** (`#...`), not the query string, so the token is not sent to the Next.js server.
- Always validate the `state` and ensure the `cb` (callback) points to your frontend base URL.

---

## 4) Backend: register the provider router

Edit:

- `backend/presentation/routes_sso.py`

Add your router import and include it:

- `from backend.presentation.sso.<provider> import router as <provider>_router`
- `router.include_router(<provider>_router)`

No other backend router registrations are needed because `backend/presentation/app.py` already includes `routes_sso.router`.

---

## 5) Backend: configuration / environment variables

Each provider should have its own env vars.

Add them to:

- `docker/.env.example`

and pass them into the backend service in:

- `docker/docker-compose.yml`

### Shared SSO env vars

- `FRONTEND_BASE_URL` (e.g. `http://localhost:3000`)
- `SSO_STATE_SECRET` (optional; defaults to `JWT_SECRET`)

### Provider-specific

Follow the Google pattern, e.g.

- `<PROVIDER>_OAUTH_CLIENT_ID`
- `<PROVIDER>_OAUTH_CLIENT_SECRET`
- `<PROVIDER>_OAUTH_REDIRECT_URI`

Make sure the redirect URI matches:

- `http://<backend-host>/api/auth/sso/<provider>/callback`

---

## 6) Frontend: add the callback page

Create a new Next.js route:

- `frontend/app/sso/<provider>/callback/page.tsx`

You can copy the Google callback page:

- `frontend/app/sso/google/callback/page.tsx`

It should:

- Parse `window.location.hash`
- Extract `access_token` + `expires_at`
- Call `saveToken(token, true)` (or your chosen remember behavior)
- Redirect to `/dashboard`
- Show a simple error state if `#error=...` exists

---

## 7) Frontend: add the “Continue with <Provider>” button

Update:

- `frontend/components/AuthModal.tsx`

Add a handler similar to Google:

- `window.location.href = `${API_BASE_URL}/api/auth/sso/<provider>/start``

---

## 8) Validate end-to-end

Minimal checks:

- **Start URL** redirects to the provider:
  - `GET /api/auth/sso/<provider>/start`
- Provider redirects back to backend callback:
  - `GET /api/auth/sso/<provider>/callback?code=...&state=...`
- Backend callback redirects to frontend callback:
  - `/sso/<provider>/callback#access_token=...&expires_at=...`
- Frontend stores token and routes to dashboard

---

## How Google SSO works in this repo (worked example)

Google is implemented as the reference provider. This section explains the end-to-end flow and where the code lives.

### Backend routes involved

- `GET /api/auth/sso/google/start`
  - Implemented in `backend/presentation/sso/google.py`
  - Creates a signed OAuth `state` value with `OAuthStateService`
  - Redirects the browser to Google’s authorize URL

- `GET /api/auth/sso/google/callback`
  - Implemented in `backend/presentation/sso/google.py`
  - Validates `state` and extracts the `cb` (frontend callback URL)
  - Exchanges `code` for Google user info
  - Calls the shared SSO use case to provision/sign-in and mint the JWT
  - Redirects to the frontend callback URL with the JWT in the URL fragment

### Provider-specific OAuth integration (infrastructure)

- `backend/infrastructure/services/sso/google.py`
  - `GoogleOAuthClient.build_authorize_params(state=...)`
    - Returns the query params for Google authorize redirect
  - `GoogleOAuthClient.fetch_userinfo(code=...)`
    - Exchanges `code` at Google’s token endpoint
    - Calls Google userinfo endpoint
    - Returns `GoogleUserInfo(email, email_verified, name, picture)`

### OAuth state handling (shared infrastructure)

- `backend/infrastructure/services/sso/state.py`
  - `OAuthStateService.create_state(frontend_callback_url=...)`
    - Creates a short-lived JWT signed with `SSO_STATE_SECRET` (or `JWT_SECRET` fallback)
    - Payload includes:
      - `cb`: the frontend callback URL (e.g. `http://localhost:3000/sso/google/callback`)
      - `nonce`: random value
      - `iat`/`exp`: issued/expiry timestamps
  - `OAuthStateService.decode_state(state)`
    - Verifies signature and expiry and returns the payload

### User provisioning + JWT issuance (application layer)

- `backend/application/auth/sso_use_cases.py`
  - `SsoLoginUseCase.execute(SsoLoginCommand(identity=...))`
    - Validates identity (`email` present, `email_verified=True`)
    - Loads existing user by email or creates a new user
      - New users get a random password hash to satisfy the existing DB schema
    - Creates or updates `UserProfile` with name + photo
    - Uses the existing `TokenService` to mint the same JWT as password login

### Frontend flow

- `frontend/components/AuthModal.tsx`
  - Clicking “Continue with Google” navigates the browser to:
    - `${API_BASE_URL}/api/auth/sso/google/start`

- `frontend/app/sso/google/callback/page.tsx`
  - Reads `window.location.hash` (URL fragment)
  - Extracts:
    - `access_token`
    - `expires_at`
  - Calls `saveToken(...)`
  - Redirects to `/dashboard`

### Why the JWT is returned in the URL fragment

The backend redirects to:

`/sso/google/callback#access_token=...&expires_at=...`

Using the fragment (`#...`) ensures the token is not sent to the frontend server during navigation (it is only available in the browser), reducing accidental leakage via logs/proxies.

---

## Notes / Known limitations

- Currently user linking is email-based and does not store a permanent provider account id.
  - If you want account linking across providers in a stricter way later, add a dedicated table like `user_identities` with:
    - `user_id`, `provider`, `provider_subject`, `created_at`
- The current flow generates a random password hash for SSO-created users to satisfy the existing DB schema.
