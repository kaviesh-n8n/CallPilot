import json
from datetime import UTC, datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import desc, func, select

from api.db import db_client
from api.db.models import (
    CampaignModel,
    LoginEventModel,
    OrganizationModel,
    UserModel,
    WorkflowModel,
    WorkflowRunModel,
    organization_users_association,
)
from api.services.auth.depends import get_superuser
from api.services.auth.stack_auth import stackauth

router = APIRouter(prefix="/superuser", tags=["superuser"])


class ImpersonateRequest(BaseModel):
    """Request payload for superadmin impersonation.

    Either ``provider_user_id`` **or** ``user_id`` must be supplied. If both are
    provided, ``provider_user_id`` takes precedence.
    """

    provider_user_id: str | None = None
    user_id: int | None = None


class ImpersonateResponse(BaseModel):
    refresh_token: str
    access_token: str


class SuperuserWorkflowRunResponse(BaseModel):
    id: int
    name: str
    workflow_id: int
    workflow_name: Optional[str]
    user_id: Optional[int]
    organization_id: Optional[int]
    organization_name: Optional[str]
    mode: str
    is_completed: bool
    recording_url: Optional[str]
    transcript_url: Optional[str]
    usage_info: Optional[dict]
    cost_info: Optional[dict]
    initial_context: Optional[dict]
    gathered_context: Optional[dict]
    created_at: datetime


class SuperuserWorkflowRunsListResponse(BaseModel):
    workflow_runs: List[SuperuserWorkflowRunResponse]
    total_count: int
    page: int
    limit: int
    total_pages: int


class SuperuserStatsResponse(BaseModel):
    total_users: int
    total_organizations: int
    total_voice_agents: int
    total_campaigns: int
    total_calls: int


class SuperuserDashboardStatsResponse(SuperuserStatsResponse):
    logins_last_24h: int
    new_users_last_7d: int
    calls_last_24h: int


class SuperuserLoginEventResponse(BaseModel):
    id: int
    user_id: int
    email: Optional[str]
    organization_id: Optional[int]
    organization_name: Optional[str]
    ip_address: Optional[str]
    user_agent: Optional[str]
    created_at: datetime


class SuperuserUserSummaryResponse(BaseModel):
    id: int
    email: Optional[str]
    provider_id: str
    is_superuser: bool
    selected_organization_id: Optional[int]
    organization_count: int
    voice_agent_count: int
    workflow_run_count: int
    login_count: int
    last_login_at: Optional[datetime]
    created_at: datetime


class SuperuserOrganizationSummaryResponse(BaseModel):
    id: int
    provider_id: str
    user_count: int
    voice_agent_count: int
    campaign_count: int
    workflow_run_count: int
    last_login_at: Optional[datetime]
    last_run_at: Optional[datetime]
    created_at: datetime


class SuperuserActivityRunResponse(BaseModel):
    id: int
    name: str
    workflow_name: Optional[str]
    user_id: Optional[int]
    user_email: Optional[str]
    organization_id: Optional[int]
    organization_name: Optional[str]
    mode: str
    call_type: str
    state: str
    is_completed: bool
    created_at: datetime


class SuperuserDashboardResponse(BaseModel):
    stats: SuperuserDashboardStatsResponse
    recent_logins: List[SuperuserLoginEventResponse]
    recent_users: List[SuperuserUserSummaryResponse]
    recent_organizations: List[SuperuserOrganizationSummaryResponse]
    recent_activity: List[SuperuserActivityRunResponse]


@router.post("/impersonate")
async def impersonate(
    request: ImpersonateRequest, user: UserModel = Depends(get_superuser)
) -> ImpersonateResponse:
    """Impersonate a user as a super-admin.
    Internally, Stack Auth requires the **provider user ID** (a UUID-ish string)
    to create an impersonation session.
    """

    provider_user_id: str | None = request.provider_user_id

    # ------------------------------------------------------------------
    # Fallback: resolve provider_user_id from internal ``user_id``
    # ------------------------------------------------------------------
    if provider_user_id is None:
        if request.user_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either 'provider_user_id' or 'user_id' must be provided.",
            )

        db_user = await db_client.get_user_by_id(request.user_id)

        if db_user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {request.user_id} not found.",
            )

        provider_user_id = db_user.provider_id

    # ------------------------------------------------------------------
    # Call Stack Auth to create the impersonation session
    # ------------------------------------------------------------------
    session = await stackauth.impersonate(provider_user_id)

    return ImpersonateResponse(
        refresh_token=session["refresh_token"],
        access_token=session["access_token"],
    )


@router.get("/stats")
async def get_superuser_stats(
    user: UserModel = Depends(get_superuser),
) -> SuperuserStatsResponse:
    """Return high-level SaaS metrics for the admin dashboard."""

    async with db_client.async_session() as session:
        total_users = await session.scalar(select(func.count(UserModel.id)))
        total_organizations = await session.scalar(select(func.count(OrganizationModel.id)))
        total_voice_agents = await session.scalar(select(func.count(WorkflowModel.id)))
        total_campaigns = await session.scalar(select(func.count(CampaignModel.id)))
        total_calls = await session.scalar(select(func.count(WorkflowRunModel.id)))

    return SuperuserStatsResponse(
        total_users=total_users or 0,
        total_organizations=total_organizations or 0,
        total_voice_agents=total_voice_agents or 0,
        total_campaigns=total_campaigns or 0,
        total_calls=total_calls or 0,
    )


@router.get("/dashboard")
async def get_superuser_dashboard(
    user: UserModel = Depends(get_superuser),
) -> SuperuserDashboardResponse:
    """Return monitoring data for the admin dashboard."""

    now = datetime.now(UTC)
    last_24h = now - timedelta(hours=24)
    last_7d = now - timedelta(days=7)

    async with db_client.async_session() as session:
        total_users = await session.scalar(select(func.count(UserModel.id)))
        total_organizations = await session.scalar(select(func.count(OrganizationModel.id)))
        total_voice_agents = await session.scalar(select(func.count(WorkflowModel.id)))
        total_campaigns = await session.scalar(select(func.count(CampaignModel.id)))
        total_calls = await session.scalar(select(func.count(WorkflowRunModel.id)))
        logins_last_24h = await session.scalar(
            select(func.count(LoginEventModel.id)).where(LoginEventModel.created_at >= last_24h)
        )
        new_users_last_7d = await session.scalar(
            select(func.count(UserModel.id)).where(UserModel.created_at >= last_7d)
        )
        calls_last_24h = await session.scalar(
            select(func.count(WorkflowRunModel.id)).where(WorkflowRunModel.created_at >= last_24h)
        )

        user_login_counts = (
            select(
                LoginEventModel.user_id.label("user_id"),
                func.count(LoginEventModel.id).label("login_count"),
                func.max(LoginEventModel.created_at).label("last_login_at"),
            )
            .group_by(LoginEventModel.user_id)
            .subquery()
        )
        user_org_counts = (
            select(
                organization_users_association.c.user_id.label("user_id"),
                func.count(organization_users_association.c.organization_id).label("organization_count"),
            )
            .group_by(organization_users_association.c.user_id)
            .subquery()
        )
        user_agent_counts = (
            select(
                WorkflowModel.user_id.label("user_id"),
                func.count(WorkflowModel.id).label("voice_agent_count"),
            )
            .where(WorkflowModel.user_id.is_not(None))
            .group_by(WorkflowModel.user_id)
            .subquery()
        )
        user_run_counts = (
            select(
                WorkflowModel.user_id.label("user_id"),
                func.count(WorkflowRunModel.id).label("workflow_run_count"),
            )
            .join(WorkflowModel, WorkflowRunModel.workflow_id == WorkflowModel.id)
            .where(WorkflowModel.user_id.is_not(None))
            .group_by(WorkflowModel.user_id)
            .subquery()
        )

        recent_user_rows = (
            await session.execute(
                select(
                    UserModel.id,
                    UserModel.email,
                    UserModel.provider_id,
                    UserModel.is_superuser,
                    UserModel.selected_organization_id,
                    UserModel.created_at,
                    func.coalesce(user_org_counts.c.organization_count, 0).label("organization_count"),
                    func.coalesce(user_agent_counts.c.voice_agent_count, 0).label("voice_agent_count"),
                    func.coalesce(user_run_counts.c.workflow_run_count, 0).label("workflow_run_count"),
                    func.coalesce(user_login_counts.c.login_count, 0).label("login_count"),
                    user_login_counts.c.last_login_at,
                )
                .outerjoin(user_org_counts, user_org_counts.c.user_id == UserModel.id)
                .outerjoin(user_agent_counts, user_agent_counts.c.user_id == UserModel.id)
                .outerjoin(user_run_counts, user_run_counts.c.user_id == UserModel.id)
                .outerjoin(user_login_counts, user_login_counts.c.user_id == UserModel.id)
                .order_by(desc(func.coalesce(user_login_counts.c.last_login_at, UserModel.created_at)))
                .limit(10)
            )
        ).mappings().all()

        org_user_counts = (
            select(
                organization_users_association.c.organization_id.label("organization_id"),
                func.count(organization_users_association.c.user_id).label("user_count"),
            )
            .group_by(organization_users_association.c.organization_id)
            .subquery()
        )
        org_agent_counts = (
            select(
                WorkflowModel.organization_id.label("organization_id"),
                func.count(WorkflowModel.id).label("voice_agent_count"),
            )
            .where(WorkflowModel.organization_id.is_not(None))
            .group_by(WorkflowModel.organization_id)
            .subquery()
        )
        org_campaign_counts = (
            select(
                CampaignModel.organization_id.label("organization_id"),
                func.count(CampaignModel.id).label("campaign_count"),
            )
            .group_by(CampaignModel.organization_id)
            .subquery()
        )
        org_run_counts = (
            select(
                WorkflowModel.organization_id.label("organization_id"),
                func.count(WorkflowRunModel.id).label("workflow_run_count"),
                func.max(WorkflowRunModel.created_at).label("last_run_at"),
            )
            .join(WorkflowModel, WorkflowRunModel.workflow_id == WorkflowModel.id)
            .where(WorkflowModel.organization_id.is_not(None))
            .group_by(WorkflowModel.organization_id)
            .subquery()
        )
        org_login_counts = (
            select(
                LoginEventModel.organization_id.label("organization_id"),
                func.max(LoginEventModel.created_at).label("last_login_at"),
            )
            .where(LoginEventModel.organization_id.is_not(None))
            .group_by(LoginEventModel.organization_id)
            .subquery()
        )

        recent_org_rows = (
            await session.execute(
                select(
                    OrganizationModel.id,
                    OrganizationModel.provider_id,
                    OrganizationModel.created_at,
                    func.coalesce(org_user_counts.c.user_count, 0).label("user_count"),
                    func.coalesce(org_agent_counts.c.voice_agent_count, 0).label("voice_agent_count"),
                    func.coalesce(org_campaign_counts.c.campaign_count, 0).label("campaign_count"),
                    func.coalesce(org_run_counts.c.workflow_run_count, 0).label("workflow_run_count"),
                    org_login_counts.c.last_login_at,
                    org_run_counts.c.last_run_at,
                )
                .outerjoin(org_user_counts, org_user_counts.c.organization_id == OrganizationModel.id)
                .outerjoin(org_agent_counts, org_agent_counts.c.organization_id == OrganizationModel.id)
                .outerjoin(org_campaign_counts, org_campaign_counts.c.organization_id == OrganizationModel.id)
                .outerjoin(org_run_counts, org_run_counts.c.organization_id == OrganizationModel.id)
                .outerjoin(org_login_counts, org_login_counts.c.organization_id == OrganizationModel.id)
                .order_by(
                    desc(
                        func.coalesce(
                            org_run_counts.c.last_run_at,
                            org_login_counts.c.last_login_at,
                            OrganizationModel.created_at,
                        )
                    )
                )
                .limit(10)
            )
        ).mappings().all()

        recent_login_rows = (
            await session.execute(
                select(
                    LoginEventModel.id,
                    LoginEventModel.user_id,
                    LoginEventModel.email,
                    LoginEventModel.organization_id,
                    OrganizationModel.provider_id.label("organization_name"),
                    LoginEventModel.ip_address,
                    LoginEventModel.user_agent,
                    LoginEventModel.created_at,
                )
                .outerjoin(OrganizationModel, LoginEventModel.organization_id == OrganizationModel.id)
                .order_by(LoginEventModel.created_at.desc())
                .limit(10)
            )
        ).mappings().all()

        recent_activity_rows = (
            await session.execute(
                select(
                    WorkflowRunModel.id,
                    WorkflowRunModel.name,
                    WorkflowModel.name.label("workflow_name"),
                    WorkflowModel.user_id,
                    UserModel.email.label("user_email"),
                    WorkflowModel.organization_id,
                    OrganizationModel.provider_id.label("organization_name"),
                    WorkflowRunModel.mode,
                    WorkflowRunModel.call_type,
                    WorkflowRunModel.state,
                    WorkflowRunModel.is_completed,
                    WorkflowRunModel.created_at,
                )
                .join(WorkflowModel, WorkflowRunModel.workflow_id == WorkflowModel.id)
                .outerjoin(UserModel, WorkflowModel.user_id == UserModel.id)
                .outerjoin(OrganizationModel, WorkflowModel.organization_id == OrganizationModel.id)
                .order_by(WorkflowRunModel.created_at.desc())
                .limit(10)
            )
        ).mappings().all()

    return SuperuserDashboardResponse(
        stats=SuperuserDashboardStatsResponse(
            total_users=total_users or 0,
            total_organizations=total_organizations or 0,
            total_voice_agents=total_voice_agents or 0,
            total_campaigns=total_campaigns or 0,
            total_calls=total_calls or 0,
            logins_last_24h=logins_last_24h or 0,
            new_users_last_7d=new_users_last_7d or 0,
            calls_last_24h=calls_last_24h or 0,
        ),
        recent_logins=[SuperuserLoginEventResponse(**row) for row in recent_login_rows],
        recent_users=[SuperuserUserSummaryResponse(**row) for row in recent_user_rows],
        recent_organizations=[
            SuperuserOrganizationSummaryResponse(**row) for row in recent_org_rows
        ],
        recent_activity=[SuperuserActivityRunResponse(**row) for row in recent_activity_rows],
    )


@router.get("/workflow-runs")
async def get_workflow_runs(
    page: int = Query(1, ge=1, description="Page number (starts from 1)"),
    limit: int = Query(50, ge=1, le=100, description="Number of items per page"),
    filters: Optional[str] = Query(None, description="JSON-encoded filter criteria"),
    sort_by: Optional[str] = Query(
        None, description="Field to sort by (e.g., 'duration', 'created_at')"
    ),
    sort_order: Optional[str] = Query(
        "desc", description="Sort order ('asc' or 'desc')"
    ),
    user: UserModel = Depends(get_superuser),
) -> SuperuserWorkflowRunsListResponse:
    """
    Get paginated list of all workflow runs with organization information.
    Requires superuser privileges.

    Filters should be provided as a JSON-encoded array of filter criteria.
    Example: [{"field": "id", "type": "number", "value": {"value": 680}}]
    """
    offset = (page - 1) * limit

    # Parse filters if provided
    filter_criteria = None
    if filters:
        try:
            filter_criteria = json.loads(filters)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid filter format")

    # Validate sort_order
    if sort_order not in ("asc", "desc"):
        sort_order = "desc"

    workflow_runs, total_count = await db_client.get_workflow_runs_for_superadmin(
        limit=limit,
        offset=offset,
        filters=filter_criteria,
        sort_by=sort_by,
        sort_order=sort_order,
    )

    total_pages = (total_count + limit - 1) // limit  # Ceiling division

    return SuperuserWorkflowRunsListResponse(
        workflow_runs=[SuperuserWorkflowRunResponse(**run) for run in workflow_runs],
        total_count=total_count,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )
