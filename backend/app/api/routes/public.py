from datetime import datetime
from math import isfinite
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/public",
    tags=["Public"],
)


# ============================================================
# REQUEST SCHEMAS
# ============================================================

class QuoteRequest(BaseModel):
    customer_name: str = Field(..., min_length=2, max_length=100)
    company: str | None = Field(default=None, max_length=150)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=30)
    industry: str | None = Field(default=None, max_length=100)
    requirement: str = Field(..., min_length=5, max_length=5000)
    source: str = Field(default="website", max_length=50)


class ContactRequest(BaseModel):
    customer_name: str = Field(..., min_length=2, max_length=100)
    company: str | None = Field(default=None, max_length=150)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=30)
    requirement: str | None = Field(default=None, max_length=1000)
    message: str = Field(..., min_length=5, max_length=5000)


class AMCRequest(BaseModel):
    customer_name: str = Field(..., min_length=2, max_length=100)
    company: str | None = Field(default=None, max_length=150)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=30)
    issue: str = Field(..., min_length=5, max_length=5000)
    priority: Literal["low", "normal", "high", "critical"] = "normal"


class UPSCalculatorRequest(BaseModel):
    load_kw: float = Field(..., gt=0, le=100000)
    power_factor: float = Field(default=0.8, gt=0, le=1)
    safety_margin: float = Field(default=1.25, ge=1, le=5)


class BatteryCalculatorRequest(BaseModel):
    load_kw: float = Field(..., gt=0, le=100000)
    backup_minutes: float = Field(..., gt=0, le=100000)
    battery_voltage: float = Field(default=12, gt=0, le=10000)
    battery_ah: float = Field(default=100, gt=0, le=1000000)
    efficiency: float = Field(default=0.9, gt=0, le=1)
    depth_of_discharge: float = Field(default=0.8, gt=0, le=1)


class ThreePhaseUPSRequest(BaseModel):
    load_kw: float = Field(..., gt=0, le=100000)
    power_factor: float = Field(default=0.8, gt=0, le=1)
    safety_margin: float = Field(default=1.25, ge=1, le=5)
    voltage: float = Field(default=415, gt=0, le=10000)


class AIPowerAssistantRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=2000)


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def generate_lead_code():
    return "LD-" + datetime.now().strftime("%y%m%d%H%M%S%f")


def generate_request_code():
    return "SR-" + datetime.now().strftime("%y%m%d%H%M%S%f")


def validate_finite_numbers(*values):
    """
    Reject NaN and Infinity values before calculations.
    """
    if not all(isfinite(value) for value in values):
        raise HTTPException(
            status_code=400,
            detail="Numeric values must be finite.",
        )


# ============================================================
# QUOTE REQUEST
# ============================================================

@router.post("/quote")
def create_quote_request(
    request: QuoteRequest,
    db: Session = Depends(get_db),
):
    if not request.customer_name.strip():
        raise HTTPException(
            status_code=400,
            detail="Customer name is required",
        )

    if not request.requirement.strip():
        raise HTTPException(
            status_code=400,
            detail="Requirement is required",
        )

    lead_code = generate_lead_code()

    query = text("""
        INSERT INTO leads (
            lead_code,
            customer_name,
            company,
            email,
            phone,
            industry,
            requirement,
            source,
            status
        )
        VALUES (
            :lead_code,
            :customer_name,
            :company,
            :email,
            :phone,
            :industry,
            :requirement,
            :source,
            'new'
        )
        RETURNING id, lead_code
    """)

    result = db.execute(
        query,
        {
            "lead_code": lead_code,
            "customer_name": request.customer_name.strip(),
            "company": request.company.strip() if request.company else None,
            "email": str(request.email).strip().lower(),
            "phone": request.phone.strip() if request.phone else None,
            "industry": request.industry.strip() if request.industry else None,
            "requirement": request.requirement.strip(),
            "source": "website",
        },
    )

    db.commit()

    lead = result.mappings().first()

    if not lead:
        raise HTTPException(
            status_code=500,
            detail="Quote request could not be created",
        )

    return {
        "success": True,
        "message": "Quote request submitted successfully",
        "lead_id": lead["id"],
        "lead_code": lead["lead_code"],
    }


# ============================================================
# CONTACT REQUEST
# ============================================================

@router.post("/contact")
def create_contact_request(
    request: ContactRequest,
    db: Session = Depends(get_db),
):
    if not request.customer_name.strip():
        raise HTTPException(
            status_code=400,
            detail="Customer name is required",
        )

    if not request.message.strip():
        raise HTTPException(
            status_code=400,
            detail="Message is required",
        )

    lead_code = generate_lead_code()

    requirement = (
        f"Contact enquiry: {request.message.strip()}"
    )

    query = text("""
        INSERT INTO leads (
            lead_code,
            customer_name,
            company,
            email,
            phone,
            requirement,
            source,
            status
        )
        VALUES (
            :lead_code,
            :customer_name,
            :company,
            :email,
            :phone,
            :requirement,
            'contact_form',
            'new'
        )
        RETURNING id, lead_code
    """)

    result = db.execute(
        query,
        {
            "lead_code": lead_code,
            "customer_name": request.customer_name.strip(),
            "company": request.company.strip() if request.company else None,
            "email": (
                str(request.email).strip().lower()
                if request.email
                else None
            ),
            "phone": request.phone.strip() if request.phone else None,
            "requirement": requirement,
        },
    )

    db.commit()

    lead = result.mappings().first()

    if not lead:
        raise HTTPException(
            status_code=500,
            detail="Contact request could not be created",
        )

    return {
        "success": True,
        "message": "Contact request submitted successfully",
        "lead_id": lead["id"],
        "lead_code": lead["lead_code"],
    }


# ============================================================
# PUBLIC AMC / SUPPORT REQUEST
# ============================================================

@router.post("/amc-request")
def create_amc_request(
    request: AMCRequest,
    db: Session = Depends(get_db),
):
    if not request.customer_name.strip():
        raise HTTPException(
            status_code=400,
            detail="Customer name is required",
        )

    if not request.issue.strip():
        raise HTTPException(
            status_code=400,
            detail="Issue is required",
        )

    priority = request.priority.lower()

    allowed_priorities = {
        "low",
        "normal",
        "high",
        "critical",
    }

    if priority not in allowed_priorities:
        raise HTTPException(
            status_code=400,
            detail="Invalid priority",
        )

    request_code = generate_request_code()

    query = text("""
        INSERT INTO service_requests (
            request_code,
            customer_name,
            company,
            issue,
            priority,
            status
        )
        VALUES (
            :request_code,
            :customer_name,
            :company,
            :issue,
            :priority,
            'open'
        )
        RETURNING id, request_code
    """)

    result = db.execute(
        query,
        {
            "request_code": request_code,
            "customer_name": request.customer_name.strip(),
            "company": request.company.strip() if request.company else None,
            "issue": request.issue.strip(),
            "priority": priority,
        },
    )

    db.commit()

    service_request = result.mappings().first()

    if not service_request:
        raise HTTPException(
            status_code=500,
            detail="Support request could not be created",
        )

    return {
        "success": True,
        "message": "Support request submitted successfully",
        "request_id": service_request["id"],
        "request_code": service_request["request_code"],
    }


# ============================================================
# UPS CALCULATOR
# ============================================================

@router.post("/ups-calculator")
def calculate_ups(
    request: UPSCalculatorRequest,
):
    validate_finite_numbers(
        request.load_kw,
        request.power_factor,
        request.safety_margin,
    )

    if request.load_kw <= 0:
        raise HTTPException(
            status_code=400,
            detail="Load must be greater than 0 kW",
        )

    if not 0 < request.power_factor <= 1:
        raise HTTPException(
            status_code=400,
            detail="Power factor must be between 0 and 1",
        )

    if request.safety_margin < 1:
        raise HTTPException(
            status_code=400,
            detail="Safety margin must be at least 1",
        )

    apparent_power_kva = (
        request.load_kw /
        request.power_factor
    )

    recommended_kva = (
        apparent_power_kva *
        request.safety_margin
    )

    standard_sizes = [
        1,
        2,
        3,
        5,
        6,
        10,
        15,
        20,
        30,
        40,
        50,
        60,
        80,
        100,
        120,
        160,
        200,
        250,
        300,
        400,
        500,
        600,
        800,
        1000,
    ]

    selected_kva = next(
        (
            size
            for size in standard_sizes
            if size >= recommended_kva
        ),
        None,
    )

    return {
        "success": True,
        "input": {
            "load_kw": request.load_kw,
            "power_factor": request.power_factor,
            "safety_margin": request.safety_margin,
        },
        "calculation": {
            "apparent_power_kva": round(
                apparent_power_kva,
                2,
            ),
            "recommended_kva": round(
                recommended_kva,
                2,
            ),
        },
        "recommendation": {
            "ups_capacity_kva": selected_kva,
            "message": (
                f"Recommended UPS capacity: "
                f"{selected_kva} kVA"
                if selected_kva
                else
                "Load exceeds the configured "
                "standard UPS range."
            ),
        },
    }


# ============================================================
# BATTERY CALCULATOR
# ============================================================

@router.post("/battery-calculator")
def calculate_battery(
    request: BatteryCalculatorRequest,
):
    validate_finite_numbers(
        request.load_kw,
        request.backup_minutes,
        request.battery_voltage,
        request.battery_ah,
        request.efficiency,
        request.depth_of_discharge,
    )

    if request.load_kw <= 0:
        raise HTTPException(
            status_code=400,
            detail="Load must be greater than 0 kW",
        )

    if request.backup_minutes <= 0:
        raise HTTPException(
            status_code=400,
            detail="Backup time must be greater than 0 minutes",
        )

    if request.battery_voltage <= 0:
        raise HTTPException(
            status_code=400,
            detail="Battery voltage must be greater than 0",
        )

    if request.battery_ah <= 0:
        raise HTTPException(
            status_code=400,
            detail="Battery Ah must be greater than 0",
        )

    if not 0 < request.efficiency <= 1:
        raise HTTPException(
            status_code=400,
            detail="Efficiency must be between 0 and 1",
        )

    if not 0 < request.depth_of_discharge <= 1:
        raise HTTPException(
            status_code=400,
            detail="Depth of discharge must be between 0 and 1",
        )

    backup_hours = (
        request.backup_minutes / 60
    )

    energy_required_kwh = (
        request.load_kw *
        backup_hours
    )

    battery_energy_kwh = (
        request.battery_voltage *
        request.battery_ah /
        1000
    )

    usable_energy_kwh = (
        battery_energy_kwh *
        request.efficiency *
        request.depth_of_discharge
    )

    batteries_required = (
        energy_required_kwh /
        usable_energy_kwh
    )

    batteries_required = max(
        1,
        int(batteries_required + 0.999999),
    )

    total_nominal_energy = (
        battery_energy_kwh *
        batteries_required
    )

    total_usable_energy = (
        usable_energy_kwh *
        batteries_required
    )

    return {
        "success": True,
        "input": {
            "load_kw": request.load_kw,
            "backup_minutes": request.backup_minutes,
            "battery_voltage": request.battery_voltage,
            "battery_ah": request.battery_ah,
            "efficiency": request.efficiency,
            "depth_of_discharge":
                request.depth_of_discharge,
        },
        "calculation": {
            "backup_hours": round(
                backup_hours,
                2,
            ),
            "energy_required_kwh": round(
                energy_required_kwh,
                2,
            ),
            "single_battery_energy_kwh":
                round(
                    battery_energy_kwh,
                    2,
                ),
            "single_battery_usable_energy_kwh":
                round(
                    usable_energy_kwh,
                    2,
                ),
        },
        "recommendation": {
            "batteries_required":
                batteries_required,
            "total_nominal_energy_kwh":
                round(
                    total_nominal_energy,
                    2,
                ),
            "total_usable_energy_kwh":
                round(
                    total_usable_energy,
                    2,
                ),
            "message": (
                "Recommended minimum battery "
                f"quantity: {batteries_required}"
            ),
        },
    }


# ============================================================
# THREE-PHASE UPS CALCULATOR
# ============================================================

@router.post("/three-phase-ups")
def calculate_three_phase_ups(
    request: ThreePhaseUPSRequest,
):
    validate_finite_numbers(
        request.load_kw,
        request.power_factor,
        request.safety_margin,
        request.voltage,
    )

    if request.load_kw <= 0:
        raise HTTPException(
            status_code=400,
            detail="Load must be greater than 0 kW",
        )

    if not 0 < request.power_factor <= 1:
        raise HTTPException(
            status_code=400,
            detail="Power factor must be between 0 and 1",
        )

    if request.safety_margin < 1:
        raise HTTPException(
            status_code=400,
            detail="Safety margin must be at least 1",
        )

    if request.voltage <= 0:
        raise HTTPException(
            status_code=400,
            detail="Voltage must be greater than 0",
        )

    apparent_power_kva = (
        request.load_kw /
        request.power_factor
    )

    required_kva = (
        apparent_power_kva *
        request.safety_margin
    )

    standard_sizes = [
        10,
        15,
        20,
        30,
        40,
        50,
        60,
        80,
        100,
        120,
        160,
        200,
        250,
        300,
        400,
        500,
        600,
        800,
        1000,
    ]

    recommended_kva = next(
        (
            size
            for size in standard_sizes
            if size >= required_kva
        ),
        None,
    )

    current_amps = (
        request.load_kw * 1000
        /
        (
            3 ** 0.5
            *
            request.voltage
            *
            request.power_factor
        )
    )

    return {
        "success": True,
        "input": {
            "load_kw": request.load_kw,
            "power_factor": request.power_factor,
            "safety_margin": request.safety_margin,
            "voltage": request.voltage,
        },
        "calculation": {
            "apparent_power_kva":
                round(
                    apparent_power_kva,
                    2,
                ),
            "required_kva":
                round(
                    required_kva,
                    2,
                ),
            "estimated_current_amps":
                round(
                    current_amps,
                    2,
                ),
        },
        "recommendation": {
            "ups_capacity_kva":
                recommended_kva,
            "phase":
                "Three Phase",
            "message": (
                f"Recommended three-phase UPS "
                f"capacity: {recommended_kva} kVA"
                if recommended_kva
                else
                "Load exceeds the configured "
                "UPS range."
            ),
        },
    }


# ============================================================
# AI POWER ASSISTANT
# ============================================================

@router.post("/ai-power-assistant")
def ai_power_assistant(
    request: AIPowerAssistantRequest,
):
    question = request.question.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty",
        )

    question_lower = question.lower()

    # UPS
    if "ups" in question_lower:
        category = "UPS"

        answer = (
            "A UPS (Uninterruptible Power Supply) provides "
            "backup power and protects equipment from power "
            "interruptions and disturbances. UPS selection "
            "depends on load capacity, power factor, required "
            "backup time, redundancy and future expansion."
        )

    # Battery
    elif (
        "battery" in question_lower
        or "backup" in question_lower
    ):
        category = "Battery"

        answer = (
            "Battery backup depends mainly on the connected "
            "load, required backup duration, battery voltage, "
            "battery capacity, UPS efficiency and allowable "
            "depth of discharge. Proper battery sizing should "
            "be performed before selecting the battery bank."
        )

    # Power Quality
    elif (
        "power quality" in question_lower
        or "voltage" in question_lower
        or "harmonic" in question_lower
        or "harmonics" in question_lower
    ):
        category = "Power Quality"

        answer = (
            "Power-quality problems can include voltage "
            "fluctuations, sags, surges, transients, harmonics "
            "and frequency variations. The correct solution "
            "depends on the type and severity of the disturbance."
        )

    # AMC / Maintenance
    elif (
        "amc" in question_lower
        or "maintenance" in question_lower
        or "service" in question_lower
    ):
        category = "Maintenance"

        answer = (
            "Preventive maintenance helps improve equipment "
            "reliability and reduce unexpected downtime. For "
            "UPS and power equipment, maintenance can include "
            "battery inspection, electrical measurements, "
            "thermal inspection, alarm checks and functional testing."
        )

    # Generator
    elif (
        "generator" in question_lower
        or "dg" in question_lower
    ):
        category = "Generator"

        answer = (
            "Generator sizing should consider the connected "
            "load, starting current, power factor, motor loads, "
            "required operating capacity and future expansion. "
            "The generator should not be selected only from "
            "the running kW load."
        )

    # General
    else:
        category = "General"

        answer = (
            "I can help with UPS systems, battery sizing, "
            "power quality, generators, maintenance and "
            "other electrical power-system topics. Please "
            "provide the equipment type, load, capacity or "
            "problem you are experiencing for a more specific answer."
        )

    return {
        "success": True,
        "category": category,
        "question": question,
        "answer": answer,
    }