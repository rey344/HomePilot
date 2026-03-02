"""Profile API – 50/30/20 affordability and scenario CRUD."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.crud_scenario import create_scenario, delete_scenario, get_scenario, list_scenarios, update_scenario
from app.db.session import get_db
from app.profile_modeling import affordability_503020
from app.schemas.profile import AffordabilityRequest, AffordabilityResponse, ScenarioCreate, ScenarioResponse, ScenarioUpdate

router = APIRouter()


@router.post("/affordability", response_model=AffordabilityResponse)
def post_affordability(req: AffordabilityRequest) -> AffordabilityResponse:
    """
    Check if housing cost fits within 50/30/20 (housing + other needs ≤ 50% of income).
    """
    result = affordability_503020(
        monthly_take_home_income=req.monthly_take_home_income,
        monthly_housing_cost=req.monthly_housing_cost,
        other_monthly_needs=req.other_monthly_needs,
    )
    return AffordabilityResponse(
        monthly_income=result.monthly_income,
        needs_budget_50=result.needs_budget_50,
        wants_budget_30=result.wants_budget_30,
        savings_budget_20=result.savings_budget_20,
        monthly_housing=result.monthly_housing,
        other_needs=result.other_needs,
        remaining_needs_after_housing=result.remaining_needs_after_housing,
        housing_pct_of_income=result.housing_pct_of_income,
        is_affordable=result.is_affordable,
        message=result.message,
    )


@router.post("/scenarios", response_model=ScenarioResponse)
def post_scenario(req: ScenarioCreate, db: Session = Depends(get_db)) -> ScenarioResponse:
    """Create a new scenario."""
    s = create_scenario(
        db,
        name=req.name,
        home_value=req.home_value,
        down_payment=req.down_payment,
        annual_rate_pct=req.annual_rate_pct,
        term_years=req.term_years,
        annual_property_tax_pct=req.annual_property_tax_pct,
        annual_insurance_pct=req.annual_insurance_pct,
        hoa_monthly=req.hoa_monthly,
        maintenance_monthly_pct=req.maintenance_monthly_pct,
        monthly_take_home_income=req.monthly_take_home_income,
        other_monthly_needs=req.other_monthly_needs,
    )
    return ScenarioResponse.model_validate(s)


@router.get("/scenarios", response_model=list[ScenarioResponse])
def get_scenarios_list(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)) -> list[ScenarioResponse]:
    """List scenarios (newest first)."""
    scenarios = list_scenarios(db, skip=skip, limit=limit)
    return [ScenarioResponse.model_validate(s) for s in scenarios]


@router.get("/scenarios/{scenario_id}", response_model=ScenarioResponse)
def get_scenario_by_id(scenario_id: int, db: Session = Depends(get_db)) -> ScenarioResponse:
    """Get one scenario by id."""
    s = get_scenario(db, scenario_id)
    if not s:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return ScenarioResponse.model_validate(s)


@router.put("/scenarios/{scenario_id}", response_model=ScenarioResponse)
def put_scenario(scenario_id: int, req: ScenarioUpdate, db: Session = Depends(get_db)) -> ScenarioResponse:
    """Update a scenario (partial)."""
    data = req.model_dump(exclude_unset=True)
    s = update_scenario(db, scenario_id, **data)
    if not s:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return ScenarioResponse.model_validate(s)


@router.delete("/scenarios/{scenario_id}", status_code=204)
def delete_scenario_by_id(scenario_id: int, db: Session = Depends(get_db)) -> None:
    """Delete a scenario."""
    if not delete_scenario(db, scenario_id):
        raise HTTPException(status_code=404, detail="Scenario not found")
