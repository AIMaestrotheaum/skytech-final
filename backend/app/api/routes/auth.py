from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
)

from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
)

from app.database import get_db


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


# ============================================================
# CUSTOMER REGISTRATION SCHEMA
# ============================================================

class CustomerRegisterRequest(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    email: EmailStr

    password: str = Field(
        ...,
        min_length=6,
        max_length=128,
    )


# ============================================================
# LOGIN
# ============================================================

@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db),
):
    query = text(
        """
        SELECT
            id,
            name,
            email,
            password_hash,
            role,
            is_active
        FROM users
        WHERE LOWER(email) = LOWER(:email)
        LIMIT 1
        """
    )

    user = db.execute(
        query,
        {
            "email": login_data.email,
        },
    ).mappings().first()

    # --------------------------------------------------------
    # User not found
    # --------------------------------------------------------

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # --------------------------------------------------------
    # Inactive account
    # --------------------------------------------------------

    if not user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    # --------------------------------------------------------
    # Password verification
    # --------------------------------------------------------

    if not verify_password(
        login_data.password,
        user["password_hash"],
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # --------------------------------------------------------
    # Create JWT
    # --------------------------------------------------------

    access_token = create_access_token(
        {
            "sub": str(user["id"]),
            "email": user["email"],
            "role": user["role"],
        }
    )

    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user["role"],
        "user_id": user["id"],
        "name": user["name"],
    }


# ============================================================
# CUSTOMER REGISTRATION
# ============================================================

@router.post("/register-customer")
def register_customer(
    request: CustomerRegisterRequest,
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # Normalize name
    # --------------------------------------------------------

    name = request.name.strip()

    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name is required",
        )

    # --------------------------------------------------------
    # Normalize email
    # --------------------------------------------------------

    email = str(request.email).strip().lower()

    # --------------------------------------------------------
    # Check existing email
    # --------------------------------------------------------

    existing_user = db.execute(
        text(
            """
            SELECT
                id
            FROM users
            WHERE LOWER(email) = LOWER(:email)
            LIMIT 1
            """
        ),
        {
            "email": email,
        },
    ).mappings().first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # --------------------------------------------------------
    # Hash password
    # --------------------------------------------------------

    password_hash = hash_password(
        request.password
    )

    # --------------------------------------------------------
    # Create customer
    # --------------------------------------------------------

    try:
        result = db.execute(
            text(
                """
                INSERT INTO users (
                    name,
                    email,
                    password_hash,
                    role,
                    is_active
                )
                VALUES (
                    :name,
                    :email,
                    :password_hash,
                    'customer',
                    true
                )
                RETURNING
                    id,
                    name,
                    email,
                    role,
                    is_active
                """
            ),
            {
                "name": name,
                "email": email,
                "password_hash": password_hash,
            },
        )

        customer = result.mappings().first()

        if not customer:
            db.rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Customer account could not be created",
            )

        db.commit()

    except HTTPException:
        raise

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Customer account could not be created",
        )

    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return {
        "success": True,
        "message": "Customer account created successfully",
        "customer": dict(customer),
    }