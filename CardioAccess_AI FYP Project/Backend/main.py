import hashlib
import hmac
import re

from uuid import UUID

from fastapi import (
    FastAPI,
    HTTPException,
    Depends,
    status,
)

from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel, Field

from auth import (
    get_current_admin,
    get_current_clinical_user,
)

from supabase_client import supabase


# ==========================================
# FASTAPI APPLICATION
# ==========================================

app = FastAPI(
    title="Cardio Access AI API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# CONFIGURATION
# ==========================================

INPUT_BUCKET = "case-inputs"

ECG_EXTENSIONS = (
    ".zip",
    ".csv",
    ".hea",
    ".dat",
)

ECHO_EXTENSIONS = (
    ".avi",
    ".mp4",
    ".nii",
    ".nii.gz",
)

MAX_FILE_SIZE = 200 * 1024 * 1024

SHA256_PATTERN = re.compile(
    r"^[a-fA-F0-9]{64}$"
)


# ==========================================
# COMMON HELPERS
# ==========================================

def validate_uuid(value: str):
    try:
        return str(UUID(value))

    except (ValueError, TypeError):
        raise HTTPException(
            status_code=422,
            detail="Invalid UUID",
        )


def get_owned_case(
    case_id: str,
    user_id: str,
):
    try:
        response = (
            supabase.table("cases")
            .select(
                "id, case_code, owner_id, "
                "status, has_ecg, has_echo"
            )
            .eq("id", case_id)
            .eq("owner_id", user_id)
            .limit(1)
            .execute()
        )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve case",
        )

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail="Case not found",
        )

    return response.data[0]


def validate_file_extension(
    filename: str,
    modality: str,
):
    allowed = (
        ECG_EXTENSIONS
        if modality == "ecg"
        else ECHO_EXTENSIONS
    )

    filename = filename.lower()

    if not any(
        filename.endswith(extension)
        for extension in allowed
    ):
        raise HTTPException(
            status_code=422,
            detail=(
                f"Unsupported {modality.upper()} "
                "file extension"
            ),
        )


def validate_storage_path(
    user_id: str,
    case_id: str,
    modality: str,
    storage_path: str,
):
    expected_prefix = (
        f"{user_id}/{case_id}/{modality}/"
    )

    if not storage_path.startswith(
        expected_prefix
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "Storage path does not belong "
                "to this case"
            ),
        )

    remainder = storage_path[
        len(expected_prefix):
    ]

    if (
        not remainder
        or "/" in remainder
        or "\\" in remainder
        or remainder in (".", "..")
    ):
        raise HTTPException(
            status_code=422,
            detail="Invalid storage path",
        )


def get_existing_file(
    case_id: str,
    modality: str,
):
    response = (
        supabase.table("uploaded_files")
        .select("id, storage_path")
        .eq("case_id", case_id)
        .eq("modality", modality)
        .limit(1)
        .execute()
    )

    if response.data:
        return response.data[0]

    return None


def verify_stored_file(
    storage_path: str,
    expected_size: int,
    expected_sha256: str,
):
    """
    Download the stored object and verify its
    actual size and SHA-256 checksum.

    Note:
    This implementation loads the file into
    memory. Production deployments should use
    bounded streaming verification for large
    medical input files.
    """

    try:
        bucket = (
            supabase.storage
            .from_(INPUT_BUCKET)
        )

        if not bucket.exists(storage_path):
            raise HTTPException(
                status_code=422,
                detail=(
                    "Uploaded file does not "
                    "exist in storage"
                ),
            )

        content = bucket.download(
            storage_path
        )

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=502,
            detail=(
                "Could not retrieve uploaded "
                "file from storage"
            ),
        )

    if not isinstance(
        content,
        (bytes, bytearray)
    ):
        raise HTTPException(
            status_code=502,
            detail="Invalid storage download response",
        )

    actual_size = len(content)

    if actual_size != expected_size:
        raise HTTPException(
            status_code=422,
            detail=(
                "Uploaded file size does not "
                "match supplied metadata"
            ),
        )

    if actual_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File exceeds maximum size",
        )

    actual_checksum = (
        hashlib.sha256(content).hexdigest()
    )

    if not hmac.compare_digest(
        actual_checksum,
        expected_sha256.lower(),
    ):
        raise HTTPException(
            status_code=422,
            detail=(
                "Uploaded file checksum "
                "verification failed"
            ),
        )

    return {
        "size_bytes": actual_size,
        "sha256": actual_checksum,
    }


# ==========================================
# GENERAL ENDPOINTS
# ==========================================

@app.get("/")
def home():
    return {
        "message": (
            "Cardio Access AI Backend is running!"
        )
    }


@app.get("/health")
def health():
    try:
        supabase.table(
            "user_profiles"
        ).select(
            "id"
        ).limit(1).execute()

        return {
            "status": "connected",
            "message": (
                "FastAPI is connected to Supabase!"
            ),
        }

    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Database connection unavailable",
        )


# ==========================================
# ADMIN AUTHENTICATION
# ==========================================

@app.get("/admin/me")
def admin_profile(
    admin: dict = Depends(
        get_current_admin
    ),
):
    return {
        "message": (
            "Admin authentication successful!"
        ),
        "admin": admin,
    }


# ==========================================
# ADMIN USER MANAGEMENT
# ==========================================

@app.get("/admin/users")
def get_admin_users(
    admin: dict = Depends(
        get_current_admin
    ),
):
    auth_response = (
        supabase.auth.admin.list_users(
            page=1,
            per_page=100,
        )
    )

    profiles_response = (
        supabase.table("user_profiles")
        .select("*")
        .execute()
    )

    profiles = {
        str(profile["id"]): profile
        for profile in profiles_response.data
    }

    users = []

    for auth_user in auth_response:
        profile = profiles.get(
            str(auth_user.id)
        )

        if not profile:
            continue

        users.append({
            "id": str(auth_user.id),
            "name": profile.get(
                "full_name", ""
            ),
            "email": auth_user.email or "",
            "role": profile.get(
                "role", "clinician"
            ),
            "facility": profile.get(
                "facility"
            ) or "",
            "active": profile.get(
                "is_active", False
            ),
            "verified": bool(
                auth_user.email_confirmed_at
            ),
            "provider": (
                auth_user.app_metadata.get(
                    "provider", "email"
                )
            ),
            "lastSignIn": (
                auth_user.last_sign_in_at
            ),
        })

    return {
        "users": users
    }


class RoleUpdate(BaseModel):
    role: str


@app.patch(
    "/admin/users/{user_id}/role"
)
def update_user_role(
    user_id: str,
    role_data: RoleUpdate,
    admin: dict = Depends(
        get_current_admin
    ),
):
    new_role = (
        role_data.role.strip().lower()
    )

    if new_role not in [
        "clinician",
        "nurse",
    ]:
        raise HTTPException(
            status_code=400,
            detail=(
                "Only Clinician and Nurse "
                "roles are allowed"
            ),
        )

    profile_response = (
        supabase.table("user_profiles")
        .select("id, role")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )

    if not profile_response.data:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    profile = profile_response.data[0]

    if profile["role"] == "admin":
        raise HTTPException(
            status_code=403,
            detail=(
                "Administrator roles cannot "
                "be changed here"
            ),
        )

    supabase.table(
        "user_profiles"
    ).update({
        "role": new_role
    }).eq(
        "id", user_id
    ).execute()

    return {
        "message": (
            f"User role updated to "
            f"{new_role.capitalize()} "
            "successfully!"
        )
    }


class UserStatusUpdate(BaseModel):
    is_active: bool


@app.patch(
    "/admin/users/{user_id}/status"
)
def update_user_status(
    user_id: str,
    status_data: UserStatusUpdate,
    admin: dict = Depends(
        get_current_admin
    ),
):
    profile_response = (
        supabase.table("user_profiles")
        .select("id, role")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )

    if not profile_response.data:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    profile = profile_response.data[0]

    if profile["role"] == "admin":
        raise HTTPException(
            status_code=403,
            detail=(
                "Administrator accounts cannot "
                "be activated or deactivated here"
            ),
        )

    supabase.table(
        "user_profiles"
    ).update({
        "is_active": (
            status_data.is_active
        )
    }).eq(
        "id", user_id
    ).execute()

    action = (
        "activated"
        if status_data.is_active
        else "deactivated"
    )

    return {
        "message": (
            f"User {action} successfully!"
        )
    }


# ==========================================
# CASE CREATION
# ==========================================

class CaseCreate(BaseModel):
    notes: str | None = Field(default=None, max_length=500)
    patient_name: str = Field(min_length=1, max_length=150)
    patient_age: int = Field(ge=0, le=120)
    patient_gender: str


@app.post(
    "/api/v1/cases",
    status_code=status.HTTP_201_CREATED,
)
def create_case(
    case_data: CaseCreate,
    user: dict = Depends(get_current_clinical_user),
):
    # Values must match the public.patient_gender PostgreSQL enum.
    allowed_genders = {"male", "female", "other", "not_specified"}
    if case_data.patient_gender not in allowed_genders:
        raise HTTPException(status_code=422, detail="Invalid patient gender")

    patient_name = case_data.patient_name.strip()
    if not patient_name:
        raise HTTPException(status_code=422, detail="Patient name is required")

    notes = case_data.notes.strip() if case_data.notes is not None else None

    try:
        # Insert patient details and case metadata together in one database operation.
        response = (
            supabase.table("cases")
            .insert({
                "owner_id": user["id"],
                "status": "draft",
                "notes": notes,
                "patient_name": patient_name,
                "patient_age": case_data.patient_age,
                "patient_gender": case_data.patient_gender,
            })
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=500, detail="Case could not be created")

        case = response.data[0]
        return {
            "case_id": case["id"],
            "case_code": case["case_code"],
            "upload_prefix": f'{user["id"]}/{case["id"]}/',
            "status": case["status"],
        }

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Case creation failed")


# ==========================================
# EDIT OR DELETE A DRAFT CASE
# ==========================================

ALLOWED_PATIENT_GENDERS = {"male", "female", "other", "not_specified"}


class CasePatientUpdate(BaseModel):
    patient_name: str = Field(min_length=1, max_length=150)
    patient_age: int = Field(ge=0, le=120)
    patient_gender: str


@app.patch("/api/v1/cases/{case_id}")
def update_case_patient_details(
    case_id: str,
    changes: CasePatientUpdate,
    user: dict = Depends(get_current_clinical_user),
):
    case_id = validate_uuid(case_id)
    user_id = str(user["id"])
    case = get_owned_case(case_id, user_id)
    if case["status"] != "draft":
        raise HTTPException(status_code=409, detail="Only draft cases can be edited")

    name = changes.patient_name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Patient name is required")
    if changes.patient_gender not in ALLOWED_PATIENT_GENDERS:
        raise HTTPException(status_code=422, detail="Invalid patient gender")

    try:
        response = (
            supabase.table("cases")
            .update({
                "patient_name": name,
                "patient_age": changes.patient_age,
                "patient_gender": changes.patient_gender,
            })
            .eq("id", case_id)
            .eq("owner_id", user_id)
            .eq("status", "draft")
            .execute()
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Could not update patient details")
    if not response.data:
        raise HTTPException(status_code=409, detail="Case is no longer an editable draft")
    return {
        "message": "Patient details updated successfully",
        "case_id": case_id,
        "case_code": case["case_code"],
        "patient_name": name,
        "patient_age": changes.patient_age,
        "patient_gender": changes.patient_gender,
    }


def _list_case_storage_paths(bucket, user_id: str, case_id: str):
    """Find both registered and unregistered objects under the case upload prefix."""
    paths = set()
    for modality in ("ecg", "echo"):
        folder = f"{user_id}/{case_id}/{modality}"
        offset = 0
        while True:
            entries = bucket.list(folder, {"limit": 100, "offset": offset})
            if not isinstance(entries, list):
                raise RuntimeError("Unexpected storage listing response")
            for entry in entries:
                name = entry.get("name", "")
                if not name or name in (".", "..") or "/" in name:
                    raise RuntimeError("Unexpected nested storage entry")
                # A folder entry is not a removable file.
                if entry.get("id") is None:
                    raise RuntimeError("Unexpected nested storage folder")
                paths.add(f"{folder}/{name}")
            if len(entries) < 100:
                break
            offset += 100
    return paths


@app.delete("/api/v1/cases/{case_id}")
def delete_draft_case(
    case_id: str,
    user: dict = Depends(get_current_clinical_user),
):
    case_id = validate_uuid(case_id)
    user_id = str(user["id"])
    case = get_owned_case(case_id, user_id)
    if case["status"] != "draft":
        raise HTTPException(status_code=409, detail="Only draft cases can be deleted")

    try:
        file_response = (
            supabase.table("uploaded_files")
            .select("bucket, storage_path")
            .eq("case_id", case_id)
            .execute()
        )
        bucket = supabase.storage.from_(INPUT_BUCKET)
        paths = _list_case_storage_paths(bucket, user_id, case_id)
        for item in file_response.data or []:
            if item.get("bucket") != INPUT_BUCKET:
                raise RuntimeError("Unexpected file bucket; manual review required")
            path = item.get("storage_path", "")
            if not any(path.startswith(f"{user_id}/{case_id}/{m}/") for m in ("ecg", "echo")):
                raise RuntimeError("Unexpected file path; manual review required")
            paths.add(path)
    except Exception:
        raise HTTPException(status_code=502, detail="Could not verify case files; nothing was deleted")

    # Record a non-identifying deletion request before irreversible changes.
    # Audit events are retained when their case is deleted (FK SET NULL).
    try:
        supabase.table("audit_events").insert({
            "case_id": case_id,
            "actor_id": user_id,
            "event_type": "case_deletion_requested",
            "status": "requested",
            "details": {"case_code": case["case_code"]},
        }).execute()
    except Exception:
        raise HTTPException(status_code=500, detail="Could not record deletion audit event; nothing was deleted")

    # Storage and Postgres cannot be deleted in one atomic transaction.
    # If Storage fails, leave the database case in place for retry/reconciliation.
    if paths:
        try:
            bucket.remove(sorted(paths))
        except Exception:
            raise HTTPException(
                status_code=502,
                detail="File cleanup failed. Case was retained; some files may need reconciliation.",
            )

    try:
        response = (
            supabase.table("cases")
            .delete()
            .eq("id", case_id)
            .eq("owner_id", user_id)
            .eq("status", "draft")
            .execute()
        )
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Case deletion failed after file cleanup. Contact an administrator for reconciliation.",
        )
    if not response.data:
        raise HTTPException(
            status_code=409,
            detail="Case was not deleted; its status may have changed. File reconciliation may be needed.",
        )

    # Best effort completion record; the request record above is mandatory.
    try:
        supabase.table("audit_events").insert({
            "case_id": None,
            "actor_id": user_id,
            "event_type": "case_deleted",
            "status": "completed",
            "details": {"case_code": case["case_code"]},
        }).execute()
    except Exception:
        pass

    return {"message": "Draft case deleted", "case_id": case_id, "case_code": case["case_code"]}


# ==========================================
# FILE REGISTRATION REQUEST
# ==========================================

class FileRegistration(BaseModel):
    modality: str

    bucket: str

    storage_path: str = Field(
        min_length=1
    )

    original_name: str = Field(
        min_length=1
    )

    mime_type: str = Field(
        min_length=1
    )

    size_bytes: int = Field(
        gt=0,
        le=MAX_FILE_SIZE,
    )

    sha256: str = Field(
        min_length=64,
        max_length=64,
        pattern=r"^[a-fA-F0-9]{64}$",
    )


# ==========================================
# REGISTER UPLOADED FILE
# ==========================================

@app.post(
    "/api/v1/cases/{case_id}/files",
    status_code=status.HTTP_201_CREATED,
)
def register_case_file(
    case_id: str,
    file_data: FileRegistration,
    user: dict = Depends(
        get_current_clinical_user
    ),
):
    case_id = validate_uuid(case_id)

    user_id = str(user["id"])

    # --------------------------------------
    # Validate modality
    # --------------------------------------

    modality = (
        file_data.modality.lower()
    )

    if modality not in [
        "ecg",
        "echo",
    ]:
        raise HTTPException(
            status_code=422,
            detail=(
                "Modality must be "
                "'ecg' or 'echo'"
            ),
        )

    # --------------------------------------
    # Validate bucket
    # --------------------------------------

    if file_data.bucket != INPUT_BUCKET:
        raise HTTPException(
            status_code=422,
            detail="Invalid storage bucket",
        )

    # --------------------------------------
    # Validate file extension
    # --------------------------------------

    validate_file_extension(
        file_data.original_name,
        modality,
    )

    # --------------------------------------
    # Validate storage path
    # --------------------------------------

    validate_storage_path(
        user_id,
        case_id,
        modality,
        file_data.storage_path,
    )

    # --------------------------------------
    # Verify case ownership and status
    # --------------------------------------

    case = get_owned_case(
        case_id,
        user_id,
    )

    if case["status"] != "draft":
        raise HTTPException(
            status_code=409,
            detail=(
                "Files can only be registered "
                "for draft cases"
            ),
        )

    # --------------------------------------
    # Prevent duplicate modality files
    # --------------------------------------

    try:
        existing = get_existing_file(
            case_id,
            modality,
        )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail=(
                "Could not check existing files"
            ),
        )

    if existing:
        raise HTTPException(
            status_code=409,
            detail=(
                "A file for this modality "
                "is already registered"
            ),
        )

    # --------------------------------------
    # Verify actual stored file
    # --------------------------------------

    verified = verify_stored_file(
        storage_path=(
            file_data.storage_path
        ),
        expected_size=(
            file_data.size_bytes
        ),
        expected_sha256=(
            file_data.sha256
        ),
    )

    # --------------------------------------
    # Insert uploaded file metadata
    # --------------------------------------

    try:
        response = (
            supabase.table(
                "uploaded_files"
            )
            .insert({
                "case_id": case_id,
                "uploaded_by": user_id,
                "modality": modality,
                "original_name": (
                    file_data.original_name
                ),
                "bucket": INPUT_BUCKET,
                "storage_path": (
                    file_data.storage_path
                ),
                "mime_type": (
                    file_data.mime_type
                ),
                "size_bytes": (
                    verified["size_bytes"]
                ),
                "sha256": (
                    verified["sha256"]
                ),
            })
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=500,
                detail=(
                    "File metadata could not "
                    "be saved"
                ),
            )

        registered = response.data[0]

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=500,
            detail=(
                "File metadata registration failed"
            ),
        )

    # --------------------------------------
    # Update case modality flags
    # --------------------------------------

    update_field = (
        "has_ecg"
        if modality == "ecg"
        else "has_echo"
    )

    try:
        update_response = (
            supabase.table("cases")
            .update({
                update_field: True
            })
            .eq("id", case_id)
            .eq("owner_id", user_id)
            .eq("status", "draft")
            .execute()
        )

        if not update_response.data:
            raise RuntimeError(
                "Case update returned no rows"
            )

    except Exception:
        # Best-effort rollback of metadata.
        # This is not a database transaction.
        try:
            supabase.table(
                "uploaded_files"
            ).delete().eq(
                "id",
                registered["id"],
            ).execute()
        except Exception:
            pass

        raise HTTPException(
            status_code=500,
            detail=(
                "File metadata was saved, "
                "but the case could not be "
                "updated. Registration was "
                "not confirmed."
            ),
        )

    # --------------------------------------
    # Successful registration
    # --------------------------------------

    return {
        "message": (
            "File registered successfully"
        ),
        "case_id": case_id,
        "case_code": (
            case["case_code"]
        ),
        "file_id": (
            registered["id"]
        ),
        "modality": modality,
        "storage_path": (
            file_data.storage_path
        ),
        "size_bytes": (
            verified["size_bytes"]
        ),
        "status": "registered",
    }
