I'm working on a biometric face recognition microservice in FastAPI. 
The service already supports registering and verifying faces using `face_recognition` and OpenCV.

Currently, face encodings are being computed but not persisted correctly in MongoDB.
I want to ensure that:
1. The face encoding gets securely **saved to MongoDB** immediately after successful registration (in `/api/biometrics/face/register`).
2. The stored encoding can be **retrieved and compared** later during the **voter verification process** (`/api/voter/verify-face`).
3. If the user’s biometric data does not exist in the DB, the service should return a **404 Not Found** error with a clear message like “Biometrics not registered for this user.”
4. The data stored in MongoDB should be **encrypted using Fernet** before saving and decrypted on retrieval.
5. The system should maintain an **in-memory cache** for faster verification but always fall back to MongoDB if cache is empty.
6. Use `pymongo` for DB operations and load Mongo URI and Fernet key from environment variables.

Implementation details:
- Add a new file: `biometric-service/services/database.py`
  - Functions:
    - `save_face_encoding(user_id: str, encoding: np.ndarray, metrics: dict)`
    - `get_face_encoding(user_id: str) -> np.ndarray | None`
  - Use `cryptography.fernet.Fernet` for encryption.
  - Collection: `faces` inside the `digital_voting` database.

- In `face_service.py`:
  - After generating encoding in `register_face`, call `save_face_encoding()`.
  - In `verify_face`, if reference encoding is missing, try loading via `get_face_encoding(user_id)` before returning 404.

- In `main.py`:
  - Add a new endpoint `POST /api/voter/verify-face` to verify user face during voting using the stored encoding.

- When verification fails because no encoding exists, raise:
    ```python
    raise HTTPException(status_code=404, detail="Biometrics not registered for this user")
    ```

Make sure to:
- Add error handling and logging.
- Use consistent `user_id` to associate encodings.
- Keep code modular and production-ready.

After implementing, show me:
1. The complete updated `database.py`.
2. The modified parts of `face_service.py` and `main.py`.
3. Example request/response for register and verify endpoints.
