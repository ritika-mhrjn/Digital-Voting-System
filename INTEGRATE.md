
## Integration guide — Biometric face registration & verification

This document describes the current implementation and how to run and test the biometric face enrollment and registration guard implemented in this repository.

Summary of implemented behaviour
- The biometric microservice (FastAPI) exposes endpoints to validate, enroll and verify face templates.
- The biometric service persists encrypted face encodings into MongoDB using `services.database` and `cryptography.Fernet`.
- The backend (Express) queries the biometric service before allowing voter registration. If no prior face encoding exists for the registry `voterId`, registration is rejected.

Key endpoints

Biometric service (defaults to http://localhost:8000):

- POST /api/biometrics/face/register
	- Accepts JSON body { user_id, image_data } where `image_data` is a base64 data URL (data:image/jpeg;base64,...)
	- Returns JSON with registration details and encoding when successful.

- POST /api/register-face (multipart)
	- Accepts form-data `user_id` and up to 3 `files` (image uploads). Useful for direct file uploads from the frontend.
	- Returns { success: true|false, userId, message, details: [...] }

- POST /api/biometrics/face/verify
	- Accepts JSON { user_id, image_data, reference_encoding? } and returns verification result.

- GET /api/biometrics/face/exists/{external_id}
	- Returns { exists: true|false }. Returns HTTP 500 when the biometric DB lookup fails (so callers can distinguish service errors from "no encoding").

Backend (defaults to http://localhost:5001):

- POST /api/auth/register
	- The registration handler now calls the biometric service `GET /api/biometrics/face/exists/{voterId}` before creating a user.
	- If exists=false the endpoint returns HTTP 400 with message: "Face validation required before registration. Please complete face verification first.".
	- If the biometric service is unreachable or returns an error, the backend returns HTTP 502 with message: "Failed to verify biometric enrollment. Try again later." (fail-closed by design).

Environment variables

- `MONGO_URI` — MongoDB connection string used by the biometric service (and backend). Example: `mongodb://localhost:27017`
- `DB_NAME` — optional DB name (default: NayaMatDb)
- `FERNET_KEY` — base64-encoded Fernet key used to encrypt stored encodings (generate with Python: `from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())`)
- `BIOMETRIC_SERVICE_URL` — backend environment variable pointing to the biometric service (default used in code: `http://localhost:8000`)
- `BIOMETRIC_CHECK_TIMEOUT_MS` — optional timeout for the backend-side biometric exists check (milliseconds)

How the enrollment flow satisfies the requirements

1) Frontend captures up to 3 images and uploads them with `POST /api/register-face` as multipart/form-data (fields: `user_id`, `files`). The biometric service processes each file, attempts to compute an encoding using `face_recognition`, saves encrypted encoding(s) to MongoDB, and returns a per-image result. Any successfully-encoded image will be persisted.

2) The biometric service stores encodings into the `faces` collection (via `biometric-service/services/database.py`) with the following fields (simplified):

```
{ "user_id": "VOTER123", "encoding": <binary encrypted blob>, "metrics": { ... }, "updated_at": "..." }
```

3) During registration the backend calls the exists endpoint and only allows registration when an encoding exists for the registry `voterId`.

Error handling & status codes

- Enrollment endpoint will return HTTP 200 with `success:false` when encoding fails for all provided images and include per-image errors in `details`.
- The `exists` endpoint returns HTTP 500 on DB errors so the backend can return HTTP 502 to clients (service unavailable). When no encoding is found the endpoint returns HTTP 200 with `{ "exists": false }`.
- The backend registration route returns:
	- 201 when registration succeeds;
	- 400 when face encoding is required but not found;
	- 502 when biometric service is unreachable or returns an error.

Local test instructions (copy/paste)

1) Start MongoDB.

2) Start biometric service (example):
```bash
cd biometric-service
# activate venv if you have one
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

3) Start backend:
```bash
cd backend
npm install
npm run dev
```

4) Enroll images via multipart (recommended):
```bash
curl -X POST 'http://localhost:8000/api/register-face' \
	-F 'user_id=VOTER123' \
	-F 'files=@/path/to/photo1.jpg' \
	-F 'files=@/path/to/photo2.jpg'
```

5) Enroll single image via JSON (base64 data URL):
```bash
curl -X POST 'http://localhost:8000/api/biometrics/face/register' \
	-H 'Content-Type: application/json' \
	-d '{"user_id":"VOTER123","image_data":"data:image/jpeg;base64,<BASE64>"}'
```

6) Check existence (used by backend registration):
```bash
curl 'http://localhost:8000/api/biometrics/face/exists/VOTER123'
# expected: {"exists": true}
```

7) Try backend registration (this will invoke the exists check):
```bash
curl -X POST 'http://localhost:5001/api/auth/register' \
	-H 'Content-Type: application/json' \
	-d '{"email":"me@example.com","password":"secret123","fullName":"Me","voterId":"VOTER123"}'
```

If enrollment succeeded, registration should proceed. If not, backend will return 400 instructing the user to complete face validation first.

Developer notes / next steps (optional improvements)

- Webhook: Have the biometric service POST to the backend after successful enrollment to mark the registry `Voter` record (or a `faceValidated` flag). This reduces race conditions and removes the need for synchronous checks during registration.
- Fail policy: Currently the backend fails closed when the biometric service is unavailable. If you prefer to allow registration while logging the issue, update `backend/routes/auth.js` to proceed on DB/service timeout.
- Tests: Add small unit/integration tests for the biometric endpoints (pytest for FastAPI, supertest/mocha for backend).

CommonJS conversion note

The earlier Copilot instruction asked to convert ES module syntax to CommonJS. There are no ES-module code snippets inside this file to convert. If you want me to convert specific project source files from `import`/`export` to `require`/`module.exports`, tell me which files and I'll apply the conversion.

---

If you'd like, I can now:
- add the webhook that marks Voter.faceValidated after enrollment,
- change the backend to fail-open, or
- add an automated test script that runs enroll → exists → register end-to-end.

Tell me which follow-up you want and I'll implement it next.
