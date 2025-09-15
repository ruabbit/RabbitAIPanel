from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from .deps import dev_auth
from middleware.teams.service import list_teams, get_team


router = APIRouter(prefix="/v1/teams", tags=["teams"])


@router.get("")
def api_list_teams(
    q: str | None = Query(None),
    organization_id: int | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    ctx: dict = Depends(dev_auth),
):
    rows, total = list_teams(q=q, organization_id=organization_id, limit=limit, offset=offset)
    return {
        "request_id": ctx.get("request_id"),
        "total": total,
        "teams": [
            {
                "id": t.id,
                "organization_id": t.organization_id,
                "name": t.name,
                "litellm_team_id": t.litellm_team_id,
                "created_at": t.created_at.isoformat(),
            }
            for t in rows
        ],
    }


@router.get("/{team_id}")
def api_get_team(team_id: int, ctx: dict = Depends(dev_auth)):
    t = get_team(team_id)
    if not t:
        raise HTTPException(status_code=404, detail="team not found")
    return {
        "request_id": ctx.get("request_id"),
        "team": {
            "id": t.id,
            "organization_id": t.organization_id,
            "name": t.name,
            "litellm_team_id": t.litellm_team_id,
            "created_at": t.created_at.isoformat(),
        },
    }

