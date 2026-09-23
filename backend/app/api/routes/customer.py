from datetime import datetime
import os
from typing import Literal

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db


# ============================================================
# CONFIGURATION
# ============================================================

load_dotenv()

router = APIRouter(
    prefix="/customer",
    tags=["Customer Portal"],
)


# ============================================================
# SECURITY
# ============================================================

security = HTTPBearer(auto_error=False)

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")


# ============================================================
# REQUEST SCHEMAS
# ============================================================

class CustomerServiceRequest(BaseModel):
    issue: str = Field(
        ...,
        min_length=5,
        max_length=5000,
    )

    priority: Literal[
        "low",
        "normal",
        "high",
        "critical",
    ] = "normal"

    equipment_id: int | None = None


class CustomerAmcRequest(BaseModel):
    equipment_id: int | None = None

    company: str | None = Field(
        default=None,
        max_length=255,
    )

    issue: str = Field(
        ...,
        min_length=5,
        max_length=5000,
    )

    priority: Literal[
        "low",
        "normal",
        "high",
        "critical",
    ] = "normal"


class CustomerSupportRequest(BaseModel):
    subject: str = Field(
        ...,
        min_length=3,
        max_length=255,
    )

    category: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    priority: Literal[
        "low",
        "normal",
        "high",
        "critical",
    ] = "normal"

    message: str = Field(
        ...,
        min_length=5,
        max_length=5000,
    )


# ============================================================
# CUSTOMER AUTHENTICATION
# ============================================================

def get_customer_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
):
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Authentication required",
        )

    token = credentials.credentials

    if not JWT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="JWT secret is not configured",
        )

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
        )

        user_id = payload.get("sub")
        role = payload.get("role")

        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid token",
            )

        if role != "customer":
            raise HTTPException(
                status_code=403,
                detail="Customer access required",
            )

        try:
            user_id = int(user_id)
        except (TypeError, ValueError):
            raise HTTPException(
                status_code=401,
                detail="Invalid token",
            )

        user = db.execute(
            text(
                """
                SELECT
                    id,
                    name,
                    email,
                    role,
                    is_active
                FROM users
                WHERE id = :user_id
                LIMIT 1
                """
            ),
            {
                "user_id": user_id,
            },
        ).mappings().first()

        if not user:
            raise HTTPException(
                status_code=401,
                detail="User account not found",
            )

        if not user["is_active"]:
            raise HTTPException(
                status_code=403,
                detail="User account is inactive",
            )

        if user["role"] != "customer":
            raise HTTPException(
                status_code=403,
                detail="Customer access required",
            )

        return {
            "user_id": user["id"],
            "email": user["email"],
            "role": user["role"],
            "name": user["name"],
        }

    except HTTPException:
        raise

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )


# ============================================================
# CUSTOMER DASHBOARD
# ============================================================

@router.get("/dashboard")
def get_customer_dashboard(
    db: Session = Depends(get_db),
    customer_user: dict = Depends(get_customer_user),
):
    user_id = customer_user["user_id"]

    user_query = text(
        """
        SELECT
            id,
            name,
            email
        FROM users
        WHERE id = :user_id
        LIMIT 1
        """
    )

    user = db.execute(
        user_query,
        {
            "user_id": user_id,
        },
    ).mappings().first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    equipment_count = db.execute(
        text(
            """
            SELECT COUNT(*)
            FROM customer_equipment
            WHERE customer_id = :user_id
            """
        ),
        {
            "user_id": user_id,
        },
    ).scalar() or 0

    service_requests = db.execute(
        text(
            """
            SELECT COUNT(*)
            FROM service_requests
            WHERE customer_id = :user_id
              AND LOWER(status) IN ('open', 'in_progress')
            """
        ),
        {
            "user_id": user_id,
        },
    ).scalar() or 0

    active_amc = db.execute(
        text(
            """
            SELECT COUNT(*)
            FROM amc_contracts
            WHERE customer_id = :user_id
              AND LOWER(status) = 'active'
            """
        ),
        {
            "user_id": user_id,
        },
    ).scalar() or 0

    return {
        "customer": dict(user),
        "equipment_count": equipment_count,
        "service_requests": service_requests,
        "active_amc": active_amc,
    }


# ============================================================
# EQUIPMENT - LIST
# ============================================================

@router.get("/equipment")
def get_customer_equipment(
    db: Session = Depends(get_db),
    customer_user: dict = Depends(get_customer_user),
):
    user_id = customer_user["user_id"]

    query = text(
        """
        SELECT
            id,
            equipment_code,
            equipment_name,
            equipment_type,
            model,
            serial_number,
            capacity,
            installation_date,
            warranty_end_date,
            location,
            status,
            created_at
        FROM customer_equipment
        WHERE customer_id = :user_id
        ORDER BY created_at DESC
        """
    )

    equipment = db.execute(
        query,
        {
            "user_id": user_id,
        },
    ).mappings().all()

    return {
        "total": len(equipment),
        "equipment": [
            dict(item)
            for item in equipment
        ],
    }


# ============================================================
# EQUIPMENT - DETAIL
# ============================================================

@router.get("/equipment/{equipment_id}")
def get_customer_equipment_detail(
    equipment_id: int,
    db: Session = Depends(get_db),
    customer_user: dict = Depends(get_customer_user),
):
    user_id = customer_user["user_id"]

    query = text(
        """
        SELECT
            id,
            equipment_code,
            equipment_name,
            equipment_type,
            model,
            serial_number,
            capacity,
            installation_date,
            warranty_end_date,
            location,
            status,
            created_at
        FROM customer_equipment
        WHERE id = :equipment_id
          AND customer_id = :user_id
        LIMIT 1
        """
    )

    equipment = db.execute(
        query,
        {
            "equipment_id": equipment_id,
            "user_id": user_id,
        },
    ).mappings().first()

    if not equipment:
        raise HTTPException(
            status_code=404,
            detail="Equipment not found",
        )

    return dict(equipment)


# ============================================================
# SERVICE HISTORY - LIST
# ============================================================

@router.get("/service-history")
def get_customer_service_history(
    status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
    customer_user: dict = Depends(get_customer_user),
):
    user_id = customer_user["user_id"]

    offset = (page - 1) * limit

    conditions = [
        "sr.customer_id = :user_id"
    ]

    params = {
        "user_id": user_id,
        "limit": limit,
        "offset": offset,
    }

    if status:
        conditions.append(
            "LOWER(sr.status) = LOWER(:status)"
        )
        params["status"] = status

    where_clause = " AND ".join(conditions)

    total = db.execute(
        text(
            f"""
            SELECT COUNT(*)
            FROM service_requests sr
            WHERE {where_clause}
            """
        ),
        params,
    ).scalar() or 0

    query = text(
        f"""
        SELECT
            sr.id,
            sr.request_code,
            sr.customer_name,
            sr.company,
            sr.issue,
            sr.priority,
            sr.status,
            sr.assigned_to,
            sr.equipment_id,
            ce.equipment_code,
            ce.equipment_name,
            sr.created_at
        FROM service_requests sr
        LEFT JOIN customer_equipment ce
            ON ce.id = sr.equipment_id
        WHERE {where_clause}
        ORDER BY sr.created_at DESC
        LIMIT :limit
        OFFSET :offset
        """
    )

    requests = db.execute(
        query,
        params,
    ).mappings().all()

    return {
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": (
            (total + limit - 1) // limit
            if total
            else 0
        ),
        "service_history": [
            dict(request)
            for request in requests
        ],
    }


# ============================================================
# SERVICE HISTORY - DETAIL
# ============================================================

@router.get("/service-history/{request_id}")
def get_customer_service_history_detail(
    request_id: int,
    db: Session = Depends(get_db),
    customer_user: dict = Depends(get_customer_user),
):
    user_id = customer_user["user_id"]

    query = text(
        """
        SELECT
            sr.id,
            sr.request_code,
            sr.customer_name,
            sr.company,
            sr.issue,
            sr.priority,
            sr.status,
            sr.assigned_to,
            sr.equipment_id,
            ce.equipment_code,
            ce.equipment_name,
            ce.model,
            ce.serial_number,
            sr.created_at
        FROM service_requests sr
        LEFT JOIN customer_equipment ce
            ON ce.id = sr.equipment_id
        WHERE sr.id = :request_id
          AND sr.customer_id = :user_id
        LIMIT 1
        """
    )

    request = db.execute(
        query,
        {
            "request_id": request_id,
            "user_id": user_id,
        },
    ).mappings().first()

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Service request not found",
        )

    return dict(request)


# ============================================================
# AMC - LIST
# ============================================================

@router.get("/amc")
def get_customer_amc_contracts(
    status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
    customer_user: dict = Depends(get_customer_user),
):
    user_id = customer_user["user_id"]

    offset = (page - 1) * limit

    conditions = [
        "ac.customer_id = :user_id"
    ]

    params = {
        "user_id": user_id,
        "limit": limit,
        "offset": offset,
    }

    if status:
        conditions.append(
            "LOWER(ac.status) = LOWER(:status)"
        )
        params["status"] = status

    where_clause = " AND ".join(conditions)

    total = db.execute(
        text(
            f"""
            SELECT COUNT(*)
            FROM amc_contracts ac
            WHERE {where_clause}
            """
        ),
        params,
    ).scalar() or 0

    query = text(
        f"""
        SELECT
            ac.id,
            ac.contract_code,
            ac.customer_name,
            ac.company,
            ac.amount,
            ac.status,
            ac.start_date,
            ac.end_date,
            ac.equipment_id,
            ce.equipment_code,
            ce.equipment_name,
            ac.created_at
        FROM amc_contracts ac
        LEFT JOIN customer_equipment ce
            ON ce.id = ac.equipment_id
        WHERE {where_clause}
        ORDER BY ac.created_at DESC
        LIMIT :limit
        OFFSET :offset
        """
    )

    contracts = db.execute(
        query,
        params,
    ).mappings().all()

    return {
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": (
            (total + limit - 1) // limit
            if total
            else 0
        ),
        "contracts": [
            dict(contract)
            for contract in contracts
        ],
    }


# ============================================================
# AMC - DETAIL
# ============================================================

@router.get("/amc/{contract_id}")
def get_customer_amc_detail(
    contract_id: int,
    db: Session = Depends(get_db),
    customer_user: dict = Depends(get_customer_user),
):
    user_id = customer_user["user_id"]

    query = text(
        """
        SELECT
            ac.id,
            ac.contract_code,
            ac.customer_name,
            ac.company,
            ac.amount,
            ac.status,
            ac.start_date,
            ac.end_date,
            ac.equipment_id,
            ce.equipment_code,
            ce.equipment_name,
            ce.model,
            ce.serial_number,
            ac.created_at
        FROM amc_contracts ac
        LEFT JOIN customer_equipment ce
            ON ce.id = ac.equipment_id
        WHERE ac.id = :contract_id
          AND ac.customer_id = :user_id
        LIMIT 1
        """
    )

    contract = db.execute(
        query,
        {
            "contract_id": contract_id,
            "user_id": user_id,
        },
    ).mappings().first()

    if not contract:
        raise HTTPException(
            status_code=404,
            detail="AMC contract not found",
        )

    return dict(contract)


# ============================================================
# CUSTOMER - CREATE SERVICE REQUEST
# ============================================================

@router.post("/service-requests")
def create_customer_service_request(
    request: CustomerServiceRequest,
    db: Session = Depends(get_db),
    customer_user: dict = Depends(get_customer_user),
):
    user_id = customer_user["user_id"]

    issue = request.issue.strip()

    if not issue:
        raise HTTPException(
            status_code=400,
            detail="Issue cannot be empty",
        )

    customer = db.execute(
        text(
            """
            SELECT
                id,
                name,
                email
            FROM users
            WHERE id = :user_id
            LIMIT 1
            """
        ),
        {
            "user_id": user_id,
        },
    ).mappings().first()

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    if request.equipment_id is not None:
        equipment = db.execute(
            text(
                """
                SELECT
                    id,
                    equipment_code,
                    equipment_name
                FROM customer_equipment
                WHERE id = :equipment_id
                  AND customer_id = :user_id
                LIMIT 1
                """
            ),
            {
                "equipment_id": request.equipment_id,
                "user_id": user_id,
            },
        ).mappings().first()

        if not equipment:
            raise HTTPException(
                status_code=404,
                detail="Equipment not found",
            )

    request_code = (
        "SR-"
        + datetime.now().strftime("%y%m%d%H%M%S")
    )

    result = db.execute(
        text(
            """
            INSERT INTO service_requests (
                request_code,
                customer_name,
                issue,
                priority,
                status,
                customer_id,
                equipment_id
            )
            VALUES (
                :request_code,
                :customer_name,
                :issue,
                :priority,
                'open',
                :customer_id,
                :equipment_id
            )
            RETURNING
                id,
                request_code
            """
        ),
        {
            "request_code": request_code,
            "customer_name": customer["name"],
            "issue": issue,
            "priority": request.priority,
            "customer_id": user_id,
            "equipment_id": request.equipment_id,
        },
    )

    db.commit()

    service_request = result.mappings().first()

    if not service_request:
        raise HTTPException(
            status_code=500,
            detail="Service request could not be created",
        )

    return {
        "success": True,
        "message": "Service request created successfully",
        "request_id": service_request["id"],
        "request_code": service_request["request_code"],
    }


# ============================================================
# CUSTOMER - CREATE AMC REQUEST
# ============================================================

@router.post("/amc-requests")
def create_customer_amc_request(
    request: CustomerAmcRequest,
    db: Session = Depends(get_db),
    customer_user: dict = Depends(get_customer_user),
):
    user_id = customer_user["user_id"]

    issue = request.issue.strip()

    if not issue:
        raise HTTPException(
            status_code=400,
            detail="AMC requirements cannot be empty",
        )

    customer = db.execute(
        text(
            """
            SELECT
                id,
                name,
                email
            FROM users
            WHERE id = :user_id
            LIMIT 1
            """
        ),
        {
            "user_id": user_id,
        },
    ).mappings().first()

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    if request.equipment_id is not None:
        equipment = db.execute(
            text(
                """
                SELECT
                    id,
                    equipment_code,
                    equipment_name
                FROM customer_equipment
                WHERE id = :equipment_id
                  AND customer_id = :user_id
                LIMIT 1
                """
            ),
            {
                "equipment_id": request.equipment_id,
                "user_id": user_id,
            },
        ).mappings().first()

        if not equipment:
            raise HTTPException(
                status_code=404,
                detail="Equipment not found",
            )

    request_code = (
        "AMC-"
        + datetime.now().strftime("%y%m%d%H%M%S")
    )

    result = db.execute(
        text(
            """
            INSERT INTO service_requests (
                request_code,
                customer_name,
                company,
                issue,
                priority,
                status,
                customer_id,
                equipment_id
            )
            VALUES (
                :request_code,
                :customer_name,
                :company,
                :issue,
                :priority,
                'open',
                :customer_id,
                :equipment_id
            )
            RETURNING
                id,
                request_code
            """
        ),
        {
            "request_code": request_code,
            "customer_name": customer["name"],
            "company": request.company.strip()
                if request.company
                else None,
            "issue": issue,
            "priority": request.priority,
            "customer_id": user_id,
            "equipment_id": request.equipment_id,
        },
    )

    db.commit()

    amc_request = result.mappings().first()

    if not amc_request:
        raise HTTPException(
            status_code=500,
            detail="AMC request could not be created",
        )

    return {
        "success": True,
        "message": "AMC request submitted successfully",
        "request_id": amc_request["id"],
        "request_code": amc_request["request_code"],
    }


# ============================================================
# CUSTOMER - CREATE SUPPORT REQUEST
# ============================================================

@router.post("/support-requests")
def create_customer_support_request(
    request: CustomerSupportRequest,
    db: Session = Depends(get_db),
    customer_user: dict = Depends(get_customer_user),
):
    user_id = customer_user["user_id"]

    subject = request.subject.strip()
    category = request.category.strip()
    message = request.message.strip()

    if not subject:
        raise HTTPException(
            status_code=400,
            detail="Subject cannot be empty",
        )

    if not category:
        raise HTTPException(
            status_code=400,
            detail="Category cannot be empty",
        )

    if not message:
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty",
        )

    customer = db.execute(
        text(
            """
            SELECT
                id,
                name,
                email
            FROM users
            WHERE id = :user_id
            LIMIT 1
            """
        ),
        {
            "user_id": user_id,
        },
    ).mappings().first()

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    issue = (
        f"[Support - {category}] "
        f"{subject}\n\n"
        f"{message}"
    )

    request_code = (
        "SUP-"
        + datetime.now().strftime("%y%m%d%H%M%S")
    )

    result = db.execute(
        text(
            """
            INSERT INTO service_requests (
                request_code,
                customer_name,
                issue,
                priority,
                status,
                customer_id
            )
            VALUES (
                :request_code,
                :customer_name,
                :issue,
                :priority,
                'open',
                :customer_id
            )
            RETURNING
                id,
                request_code
            """
        ),
        {
            "request_code": request_code,
            "customer_name": customer["name"],
            "issue": issue,
            "priority": request.priority,
            "customer_id": user_id,
        },
    )

    db.commit()

    support_request = result.mappings().first()

    if not support_request:
        raise HTTPException(
            status_code=500,
            detail="Support request could not be created",
        )

    return {
        "success": True,
        "message": "Support request submitted successfully",
        "request_id": support_request["id"],
        "request_code": support_request["request_code"],
    }