
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from supabase_client import supabase

security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Authenticate a Supabase user and verify their active profile."""

    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    try:
        auth_response = supabase.auth.get_user(token)
        auth_user = auth_response.user
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not auth_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )

    try:
        profile_response = (
            supabase.table("user_profiles")
            .select("id, role, is_active")
            .eq("id", str(auth_user.id))
            .limit(1)
            .execute()
        )
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Unable to verify user profile",
        )

    if not profile_response.data:
        raise HTTPException(
            status_code=403,
            detail="User profile not found",
        )

    profile = profile_response.data[0]

    if not profile["is_active"]:
        raise HTTPException(
            status_code=403,
            detail="Your account is inactive",
        )

    return {
        "id": str(auth_user.id),
        "email": auth_user.email,
        "role": profile["role"],
    }


def get_current_admin(
    user: dict = Depends(get_current_user)
):
    """Allow active administrators only."""

    if user["role"] != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access denied",
        )

    return user


def get_current_clinical_user(
    user: dict = Depends(get_current_user)
):
    """Allow active Clinicians and Nurses to submit cases."""

    if user["role"] not in ("clinician", "nurse"):
        raise HTTPException(
            status_code=403,
            detail="Clinician or Nurse access required",
        )

    return user
