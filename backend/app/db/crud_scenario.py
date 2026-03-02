"""CRUD for Scenario."""
from decimal import Decimal

from sqlalchemy.orm import Session

from app.db.models import Scenario


def create_scenario(db: Session, name: str, **kwargs) -> Scenario:
    s = Scenario(name=name, **kwargs)
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


def get_scenario(db: Session, scenario_id: int) -> Scenario | None:
    return db.get(Scenario, scenario_id)


def list_scenarios(db: Session, skip: int = 0, limit: int = 50) -> list[Scenario]:
    return db.query(Scenario).order_by(Scenario.updated_at.desc()).offset(skip).limit(limit).all()


def update_scenario(db: Session, scenario_id: int, **kwargs) -> Scenario | None:
    s = db.get(Scenario, scenario_id)
    if not s:
        return None
    for k, v in kwargs.items():
        if hasattr(s, k):
            setattr(s, k, v)
    db.commit()
    db.refresh(s)
    return s


def delete_scenario(db: Session, scenario_id: int) -> bool:
    s = db.get(Scenario, scenario_id)
    if not s:
        return False
    db.delete(s)
    db.commit()
    return True
