from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError
from sqlalchemy import text
from sqlalchemy.orm import Session
from pydantic import BaseModel
import os
from dotenv import load_dotenv

from app.database import get_db


# ============================================================
# CONFIGURATION
# ============================================================

load_dotenv()

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)

security = HTTPBearer()

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")


# ============================================================
# REQUEST SCHEMAS
# ============================================================

class LeadUpdateRequest(BaseModel):
    status: str | None = None
    assigned_to: str | None = None
    industry: str | None = None
    requirement: str | None = None


class QuoteUpdateRequest(BaseModel):
    amount: float | None = None
    status: str | None = None


class AMCUpdateRequest(BaseModel):
    status: str | None = None
    amount: float | None = None
    start_date: str | None = None
    end_date: str | None = None


class ServiceRequestUpdateRequest(BaseModel):
    status: str | None = None
    priority: str | None = None
    assigned_to: str | None = None


# ============================================================
# ADMIN AUTHENTICATION
# ============================================================

def get_admin_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
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

        if role != "admin":
            raise HTTPException(
                status_code=403,
                detail="Admin access required",
            )

        user = db.execute(
            text("""
                SELECT
                    id,
                    name,
                    email,
                    role,
                    is_active
                FROM users
                WHERE id = :user_id
                LIMIT 1
            """),
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

        if user["role"] != "admin":
            raise HTTPException(
                status_code=403,
                detail="Admin access required",
            )

        return {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
        }

    except HTTPException:
        raise

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )


# ============================================================
# ADMIN DASHBOARD
# ============================================================

@router.get("/dashboard")
def get_admin_dashboard(
    db: Session = Depends(get_db),
    admin_user: dict = Depends(get_admin_user),
):
    # Total Leads
    total_leads = db.execute(
        text("""
            SELECT COUNT(*)
            FROM leads
        """)
    ).scalar()

    # Open Quotes
    open_quotes = db.execute(
        text("""
            SELECT COUNT(*)
            FROM quotes
            WHERE LOWER(status) = 'pending'
        """)
    ).scalar()

    # Active AMC
    active_amc = db.execute(
        text("""
            SELECT COUNT(*)
            FROM amc_contracts
            WHERE LOWER(status) = 'active'
        """)
    ).scalar()

    # Open Service Requests
    service_requests = db.execute(
        text("""
            SELECT COUNT(*)
            FROM service_requests
            WHERE LOWER(status) IN ('open', 'in_progress')
        """)
    ).scalar()

    # Monthly Revenue
    monthly_revenue = db.execute(
        text("""
            SELECT COALESCE(SUM(amount), 0) / 12
            FROM amc_contracts
            WHERE LOWER(status) = 'active'
        """)
    ).scalar()

    # Recent Enquiries
    recent_enquiries = db.execute(
        text("""
            SELECT
                lead_code,
                customer_name,
                company,
                status,
                assigned_to,
                created_at
            FROM leads
            ORDER BY created_at DESC
            LIMIT 10
        """)
    ).mappings().all()

    # Critical Alerts
    critical_alerts = db.execute(
        text("""
            SELECT
                request_code,
                customer_name,
                company,
                issue,
                priority,
                status,
                assigned_to,
                created_at
            FROM service_requests
            WHERE LOWER(priority) = 'critical'
            ORDER BY created_at DESC
            LIMIT 10
        """)
    ).mappings().all()

    return {
        "total_leads": total_leads,
        "open_quotes": open_quotes,
        "active_amc": active_amc,
        "service_requests": service_requests,
        "monthly_revenue": float(monthly_revenue or 0),

        "recent_enquiries": [
            dict(row)
            for row in recent_enquiries
        ],

        "critical_alerts": [
            dict(row)
            for row in critical_alerts
        ],
    }


# ============================================================
# LEADS - LIST
# ============================================================

@router.get("/leads")
def get_admin_leads(
    search: str | None = Query(default=None),
    status: str | None = Query(default=None),
    industry: str | None = Query(default=None),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
    admin_user: dict = Depends(get_admin_user),
):
    offset = (page - 1) * limit

    conditions = []

    params = {
        "limit": limit,
        "offset": offset,
    }

    # Search
    if search:
        conditions.append("""
            (
                lead_code ILIKE :search
                OR customer_name ILIKE :search
                OR company ILIKE :search
                OR email ILIKE :search
                OR phone ILIKE :search
            )
        """)

        params["search"] = f"%{search}%"

    # Status
    if status:
        conditions.append(
            "LOWER(status) = LOWER(:status)"
        )

        params["status"] = status

    # Industry
    if industry:
        conditions.append(
            "LOWER(industry) = LOWER(:industry)"
        )

        params["industry"] = industry

    # Date From
    if date_from:
        conditions.append(
            "created_at::date >= :date_from"
        )

        params["date_from"] = date_from

    # Date To
    if date_to:
        conditions.append(
            "created_at::date <= :date_to"
        )

        params["date_to"] = date_to

    where_clause = ""

    if conditions:
        where_clause = (
            "WHERE " + " AND ".join(conditions)
        )

    # Count
    count_query = text(f"""
        SELECT COUNT(*)
        FROM leads
        {where_clause}
    """)

    total = db.execute(
        count_query,
        params,
    ).scalar()

    # Records
    leads_query = text(f"""
        SELECT
            id,
            lead_code,
            customer_name,
            company,
            email,
            phone,
            industry,
            requirement,
            source,
            status,
            assigned_to,
            created_at
        FROM leads
        {where_clause}
        ORDER BY created_at DESC
        LIMIT :limit
        OFFSET :offset
    """)

    leads = db.execute(
        leads_query,
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
        "leads": [
            dict(lead)
            for lead in leads
        ],
    }


# ============================================================
# LEADS - DETAIL
# ============================================================

@router.get("/leads/{lead_id}")
def get_admin_lead_detail(
    lead_id: int,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(get_admin_user),
):
    query = text("""
        SELECT
            id,
            lead_code,
            customer_name,
            company,
            email,
            phone,
            industry,
            requirement,
            source,
            status,
            assigned_to,
            created_at
        FROM leads
        WHERE id = :lead_id
        LIMIT 1
    """)

    lead = db.execute(
        query,
        {"lead_id": lead_id},
    ).mappings().first()

    if not lead:
        raise HTTPException(
            status_code=404,
            detail="Lead not found",
        )

    return dict(lead)


# ============================================================
# LEADS - UPDATE
# ============================================================

@router.put("/leads/{lead_id}")
def update_admin_lead(
    lead_id: int,
    request: LeadUpdateRequest,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(get_admin_user),
):
    existing = db.execute(
        text("""
            SELECT id
            FROM leads
            WHERE id = :lead_id
            LIMIT 1
        """),
        {"lead_id": lead_id},
    ).mappings().first()

    if not existing:
        raise HTTPException(
            status_code=404,
            detail="Lead not found",
        )

    fields = []
    params = {
        "lead_id": lead_id,
    }

    if request.status is not None:
        fields.append("status = :status")
        params["status"] = request.status

    if request.assigned_to is not None:
        fields.append("assigned_to = :assigned_to")
        params["assigned_to"] = request.assigned_to

    if request.industry is not None:
        fields.append("industry = :industry")
        params["industry"] = request.industry

    if request.requirement is not None:
        fields.append("requirement = :requirement")
        params["requirement"] = request.requirement

    if not fields:
        raise HTTPException(
            status_code=400,
            detail="No fields provided for update",
        )

    query = text(f"""
        UPDATE leads
        SET {", ".join(fields)}
        WHERE id = :lead_id
        RETURNING
            id,
            lead_code,
            customer_name,
            company,
            email,
            phone,
            industry,
            requirement,
            source,
            status,
            assigned_to,
            created_at
    """)

    result = db.execute(
        query,
        params,
    )

    db.commit()

    lead = result.mappings().first()

    return {
        "success": True,
        "message": "Lead updated successfully",
        "lead": dict(lead),
    }


# ============================================================
# QUOTES - LIST
# ============================================================

@router.get("/quotes")
def get_admin_quotes(
    search: str | None = Query(default=None),
    status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
    admin_user: dict = Depends(get_admin_user),
):
    offset = (page - 1) * limit

    conditions = []

    params = {
        "limit": limit,
        "offset": offset,
    }

    if search:
        conditions.append("""
            (
                quote_code ILIKE :search
                OR customer_name ILIKE :search
                OR company ILIKE :search
            )
        """)

        params["search"] = f"%{search}%"

    if status:
        conditions.append(
            "LOWER(status) = LOWER(:status)"
        )

        params["status"] = status

    where_clause = ""

    if conditions:
        where_clause = (
            "WHERE " + " AND ".join(conditions)
        )

    count_query = text(f"""
        SELECT COUNT(*)
        FROM quotes
        {where_clause}
    """)

    total = db.execute(
        count_query,
        params,
    ).scalar()

    quotes_query = text(f"""
        SELECT
            id,
            quote_code,
            customer_name,
            company,
            amount,
            status,
            created_at
        FROM quotes
        {where_clause}
        ORDER BY created_at DESC
        LIMIT :limit
        OFFSET :offset
    """)

    quotes = db.execute(
        quotes_query,
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
        "quotes": [
            dict(quote)
            for quote in quotes
        ],
    }


# ============================================================
# QUOTES - DETAIL
# ============================================================

@router.get("/quotes/{quote_id}")
def get_admin_quote_detail(
    quote_id: int,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(get_admin_user),
):
    query = text("""
        SELECT
            id,
            quote_code,
            customer_name,
            company,
            amount,
            status,
            created_at
        FROM quotes
        WHERE id = :quote_id
        LIMIT 1
    """)

    quote = db.execute(
        query,
        {"quote_id": quote_id},
    ).mappings().first()

    if not quote:
        raise HTTPException(
            status_code=404,
            detail="Quote not found",
        )

    return dict(quote)


# ============================================================
# QUOTES - UPDATE
# ============================================================

@router.put("/quotes/{quote_id}")
def update_admin_quote(
    quote_id: int,
    request: QuoteUpdateRequest,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(get_admin_user),
):
    existing = db.execute(
        text("""
            SELECT id
            FROM quotes
            WHERE id = :quote_id
            LIMIT 1
        """),
        {"quote_id": quote_id},
    ).mappings().first()

    if not existing:
        raise HTTPException(
            status_code=404,
            detail="Quote not found",
        )

    fields = []
    params = {
        "quote_id": quote_id,
    }

    if request.amount is not None:
        if request.amount < 0:
            raise HTTPException(
                status_code=400,
                detail="Amount cannot be negative",
            )

        fields.append("amount = :amount")
        params["amount"] = request.amount

    if request.status is not None:
        fields.append("status = :status")
        params["status"] = request.status

    if not fields:
        raise HTTPException(
            status_code=400,
            detail="No fields provided for update",
        )

    query = text(f"""
        UPDATE quotes
        SET {", ".join(fields)}
        WHERE id = :quote_id
        RETURNING
            id,
            quote_code,
            customer_name,
            company,
            amount,
            status,
            created_at
    """)

    result = db.execute(
        query,
        params,
    )

    db.commit()

    quote = result.mappings().first()

    return {
        "success": True,
        "message": "Quote updated successfully",
        "quote": dict(quote),
    }


# ============================================================
# SERVICE & AMC - LIST
# ============================================================

@router.get("/service-amc")
def get_admin_amc_contracts(
    search: str | None = Query(default=None),
    status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
    admin_user: dict = Depends(get_admin_user),
):
    offset = (page - 1) * limit

    conditions = []

    params = {
        "limit": limit,
        "offset": offset,
    }

    if search:
        conditions.append("""
            (
                contract_code ILIKE :search
                OR customer_name ILIKE :search
                OR company ILIKE :search
            )
        """)

        params["search"] = f"%{search}%"

    if status:
        conditions.append(
            "LOWER(status) = LOWER(:status)"
        )

        params["status"] = status

    where_clause = ""

    if conditions:
        where_clause = (
            "WHERE " + " AND ".join(conditions)
        )

    count_query = text(f"""
        SELECT COUNT(*)
        FROM amc_contracts
        {where_clause}
    """)

    total = db.execute(
        count_query,
        params,
    ).scalar()

    contracts_query = text(f"""
        SELECT
            id,
            contract_code,
            customer_name,
            company,
            amount,
            status,
            start_date,
            end_date,
            created_at
        FROM amc_contracts
        {where_clause}
        ORDER BY created_at DESC
        LIMIT :limit
        OFFSET :offset
    """)

    contracts = db.execute(
        contracts_query,
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
# SERVICE & AMC - DETAIL
# ============================================================

@router.get("/service-amc/{contract_id}")
def get_admin_amc_detail(
    contract_id: int,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(get_admin_user),
):
    query = text("""
        SELECT
            id,
            contract_code,
            customer_name,
            company,
            amount,
            status,
            start_date,
            end_date,
            created_at
        FROM amc_contracts
        WHERE id = :contract_id
        LIMIT 1
    """)

    contract = db.execute(
        query,
        {"contract_id": contract_id},
    ).mappings().first()

    if not contract:
        raise HTTPException(
            status_code=404,
            detail="AMC contract not found",
        )

    return dict(contract)


# ============================================================
# SERVICE & AMC - UPDATE
# ============================================================

@router.put("/service-amc/{contract_id}")
def update_admin_amc(
    contract_id: int,
    request: AMCUpdateRequest,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(get_admin_user),
):
    existing = db.execute(
        text("""
            SELECT id
            FROM amc_contracts
            WHERE id = :contract_id
            LIMIT 1
        """),
        {"contract_id": contract_id},
    ).mappings().first()

    if not existing:
        raise HTTPException(
            status_code=404,
            detail="AMC contract not found",
        )

    fields = []
    params = {
        "contract_id": contract_id,
    }

    if request.status is not None:
        fields.append("status = :status")
        params["status"] = request.status

    if request.amount is not None:
        if request.amount < 0:
            raise HTTPException(
                status_code=400,
                detail="Amount cannot be negative",
            )

        fields.append("amount = :amount")
        params["amount"] = request.amount

    if request.start_date is not None:
        fields.append("start_date = :start_date")
        params["start_date"] = request.start_date

    if request.end_date is not None:
        fields.append("end_date = :end_date")
        params["end_date"] = request.end_date

    if not fields:
        raise HTTPException(
            status_code=400,
            detail="No fields provided for update",
        )

    query = text(f"""
        UPDATE amc_contracts
        SET {", ".join(fields)}
        WHERE id = :contract_id
        RETURNING
            id,
            contract_code,
            customer_name,
            company,
            amount,
            status,
            start_date,
            end_date,
            created_at
    """)

    result = db.execute(
        query,
        params,
    )

    db.commit()

    contract = result.mappings().first()

    return {
        "success": True,
        "message": "AMC contract updated successfully",
        "contract": dict(contract),
    }


# ============================================================
# SERVICE REQUESTS - LIST
# ============================================================

@router.get("/service-requests")
def get_admin_service_requests(
    search: str | None = Query(default=None),
    status: str | None = Query(default=None),
    priority: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
    admin_user: dict = Depends(get_admin_user),
):
    offset = (page - 1) * limit

    conditions = []

    params = {
        "limit": limit,
        "offset": offset,
    }

    if search:
        conditions.append("""
            (
                request_code ILIKE :search
                OR customer_name ILIKE :search
                OR company ILIKE :search
                OR issue ILIKE :search
                OR assigned_to ILIKE :search
            )
        """)

        params["search"] = f"%{search}%"

    if status:
        conditions.append(
            "LOWER(status) = LOWER(:status)"
        )

        params["status"] = status

    if priority:
        conditions.append(
            "LOWER(priority) = LOWER(:priority)"
        )

        params["priority"] = priority

    where_clause = ""

    if conditions:
        where_clause = (
            "WHERE " + " AND ".join(conditions)
        )

    count_query = text(f"""
        SELECT COUNT(*)
        FROM service_requests
        {where_clause}
    """)

    total = db.execute(
        count_query,
        params,
    ).scalar()

    requests_query = text(f"""
        SELECT
            id,
            request_code,
            customer_name,
            company,
            issue,
            priority,
            status,
            assigned_to,
            created_at
        FROM service_requests
        {where_clause}
        ORDER BY created_at DESC
        LIMIT :limit
        OFFSET :offset
    """)

    requests = db.execute(
        requests_query,
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
        "requests": [
            dict(request)
            for request in requests
        ],
    }


# ============================================================
# SERVICE REQUESTS - DETAIL
# ============================================================

@router.get("/service-requests/{request_id}")
def get_admin_service_request_detail(
    request_id: int,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(get_admin_user),
):
    query = text("""
        SELECT
            id,
            request_code,
            customer_name,
            company,
            issue,
            priority,
            status,
            assigned_to,
            created_at
        FROM service_requests
        WHERE id = :request_id
        LIMIT 1
    """)

    request = db.execute(
        query,
        {"request_id": request_id},
    ).mappings().first()

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Service request not found",
        )

    return dict(request)


# ============================================================
# SERVICE REQUESTS - UPDATE
# ============================================================

@router.put("/service-requests/{request_id}")
def update_admin_service_request(
    request_id: int,
    request: ServiceRequestUpdateRequest,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(get_admin_user),
):
    existing = db.execute(
        text("""
            SELECT id
            FROM service_requests
            WHERE id = :request_id
            LIMIT 1
        """),
        {"request_id": request_id},
    ).mappings().first()

    if not existing:
        raise HTTPException(
            status_code=404,
            detail="Service request not found",
        )

    fields = []
    params = {
        "request_id": request_id,
    }

    if request.status is not None:
        fields.append("status = :status")
        params["status"] = request.status

    if request.priority is not None:
        fields.append("priority = :priority")
        params["priority"] = request.priority

    if request.assigned_to is not None:
        fields.append("assigned_to = :assigned_to")
        params["assigned_to"] = request.assigned_to

    if not fields:
        raise HTTPException(
            status_code=400,
            detail="No fields provided for update",
        )

    query = text(f"""
        UPDATE service_requests
        SET {", ".join(fields)}
        WHERE id = :request_id
        RETURNING
            id,
            request_code,
            customer_name,
            company,
            issue,
            priority,
            status,
            assigned_to,
            created_at
    """)

    result = db.execute(
        query,
        params,
    )

    db.commit()

    service_request = result.mappings().first()

    return {
        "success": True,
        "message": "Service request updated successfully",
        "service_request": dict(service_request),
    }

    # ============================================================
# INVENTORY - LIST
# ============================================================

@router.get("/inventory")
def get_admin_inventory(
    db: Session = Depends(get_db),
    admin_user: dict = Depends(get_admin_user),
):
    """
    Return customer equipment inventory for administrators.

    This endpoint is admin-protected and reads live data
    from the customer_equipment and users tables.
    """

    query = text(
        """
        SELECT
            ce.id,
            ce.equipment_code,
            ce.equipment_name,
            ce.equipment_type,
            ce.model,
            ce.serial_number,
            ce.capacity,
            ce.installation_date,
            ce.warranty_end_date,
            ce.location,
            ce.status,
            ce.created_at,

            u.name AS customer_name,
            u.email AS customer_email

        FROM customer_equipment ce

        LEFT JOIN users u
            ON u.id = ce.customer_id

        ORDER BY ce.created_at DESC
        """
    )

    equipment_rows = (
        db.execute(query)
        .mappings()
        .all()
    )

    equipment = [
        dict(row)
        for row in equipment_rows
    ]

    # --------------------------------------------------------
    # Summary
    # --------------------------------------------------------

    total = len(equipment)

    active = sum(
        1
        for item in equipment
        if str(item.get("status") or "").lower()
        in {
            "active",
            "installed",
            "operational",
        }
    )

    inactive = sum(
        1
        for item in equipment
        if str(item.get("status") or "").lower()
        in {
            "inactive",
            "retired",
            "cancelled",
        }
    )

    maintenance = sum(
        1
        for item in equipment
        if str(item.get("status") or "").lower()
        in {
            "maintenance",
            "service",
            "pending",
        }
    )

    return {
        "summary": {
            "total": total,
            "active": active,
            "inactive": inactive,
            "maintenance": maintenance,
        },
        "equipment": equipment,
    }

# ============================================================
# ANALYTICS - ADMIN DASHBOARD
# ============================================================

@router.get("/analytics")
def get_admin_analytics(
    db: Session = Depends(get_db),
    admin_user: dict = Depends(get_admin_user),
):
    """
    Return live platform analytics for administrators.
    """

    # --------------------------------------------------------
    # CUSTOMER COUNT
    # --------------------------------------------------------
    customers_result = db.execute(
        text(
            """
            SELECT COUNT(*) AS total
            FROM users
            WHERE role = 'customer'
            """
        )
    ).scalar()

    customers = int(customers_result or 0)

    # --------------------------------------------------------
    # EQUIPMENT COUNT
    # --------------------------------------------------------
    equipment_result = db.execute(
        text(
            """
            SELECT COUNT(*) AS total
            FROM customer_equipment
            """
        )
    ).scalar()

    equipment = int(equipment_result or 0)

    # --------------------------------------------------------
    # SERVICE REQUEST COUNT
    # --------------------------------------------------------
    service_requests_result = db.execute(
        text(
            """
            SELECT COUNT(*) AS total
            FROM service_requests
            """
        )
    ).scalar()

    service_requests = int(service_requests_result or 0)

    # --------------------------------------------------------
    # LEADS COUNT
    # --------------------------------------------------------
    leads_result = db.execute(
        text(
            """
            SELECT COUNT(*) AS total
            FROM leads
            """
        )
    ).scalar()

    leads = int(leads_result or 0)

    # --------------------------------------------------------
    # QUOTES COUNT
    # --------------------------------------------------------
    quotes_result = db.execute(
        text(
            """
            SELECT COUNT(*) AS total
            FROM quotes
            """
        )
    ).scalar()

    quotes = int(quotes_result or 0)

    # --------------------------------------------------------
    # EQUIPMENT STATUS
    # --------------------------------------------------------
    equipment_status_rows = db.execute(
        text(
            """
            SELECT
                COALESCE(status, 'Unknown') AS status,
                COUNT(*) AS total
            FROM customer_equipment
            GROUP BY status
            ORDER BY total DESC
            """
        )
    ).mappings().all()

    equipment_status = {
        str(row["status"]): int(row["total"])
        for row in equipment_status_rows
    }

    # --------------------------------------------------------
    # SERVICE REQUEST STATUS
    # --------------------------------------------------------
    service_status_rows = db.execute(
        text(
            """
            SELECT
                COALESCE(status, 'Unknown') AS status,
                COUNT(*) AS total
            FROM service_requests
            GROUP BY status
            ORDER BY total DESC
            """
        )
    ).mappings().all()

    service_request_status = {
        str(row["status"]): int(row["total"])
        for row in service_status_rows
    }

    # --------------------------------------------------------
    # LEAD STATUS
    # --------------------------------------------------------
    lead_status_rows = db.execute(
        text(
            """
            SELECT
                COALESCE(status, 'Unknown') AS status,
                COUNT(*) AS total
            FROM leads
            GROUP BY status
            ORDER BY total DESC
            """
        )
    ).mappings().all()

    lead_status = {
        str(row["status"]): int(row["total"])
        for row in lead_status_rows
    }

    # --------------------------------------------------------
    # FINAL RESPONSE
    # --------------------------------------------------------
    return {
        "summary": {
            "customers": customers,
            "equipment": equipment,
            "service_requests": service_requests,
            "leads": leads,
            "quotes": quotes,
        },
        "equipment_status": equipment_status,
        "service_request_status": service_request_status,
        "lead_status": lead_status,
    }