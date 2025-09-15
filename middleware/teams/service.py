from __future__ import annotations

from typing import Optional, Tuple

from sqlalchemy.orm import Session
from sqlalchemy import func

from ..db import SessionLocal
from ..models import Team


def list_teams(*, q: Optional[str] = None, organization_id: Optional[int] = None, limit: int = 50, offset: int = 0) -> Tuple[list[Team], int]:
    with SessionLocal() as s:
        query = s.query(Team)
        if q:
            query = query.filter(Team.name.ilike(f"%{q}%"))
        if organization_id is not None:
            query = query.filter(Team.organization_id == organization_id)
        total = query.count()
        rows = query.order_by(Team.id.desc()).offset(offset).limit(limit).all()
        return list(rows), int(total)


def get_team(team_id: int) -> Optional[Team]:
    with SessionLocal() as s:
        return s.get(Team, team_id)

