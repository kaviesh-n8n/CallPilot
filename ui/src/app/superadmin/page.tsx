"use client";

import {
    Activity,
    ArrowRight,
    Bot,
    Building2,
    Clock,
    List,
    Loader2,
    Megaphone,
    PhoneCall,
    RefreshCw,
    ShieldCheck,
    UserCheck,
    Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/lib/auth";
import { impersonateAsSuperadmin } from "@/lib/utils";

type DashboardStats = {
    total_users: number;
    total_organizations: number;
    total_voice_agents: number;
    total_campaigns: number;
    total_calls: number;
    logins_last_24h: number;
    new_users_last_7d: number;
    calls_last_24h: number;
};

type LoginEvent = {
    id: number;
    user_id: number;
    email?: string | null;
    organization_id?: number | null;
    organization_name?: string | null;
    ip_address?: string | null;
    user_agent?: string | null;
    created_at: string;
};

type UserSummary = {
    id: number;
    email?: string | null;
    provider_id: string;
    is_superuser: boolean;
    selected_organization_id?: number | null;
    organization_count: number;
    voice_agent_count: number;
    workflow_run_count: number;
    login_count: number;
    last_login_at?: string | null;
    created_at: string;
};

type OrganizationSummary = {
    id: number;
    provider_id: string;
    user_count: number;
    voice_agent_count: number;
    campaign_count: number;
    workflow_run_count: number;
    last_login_at?: string | null;
    last_run_at?: string | null;
    created_at: string;
};

type ActivityRun = {
    id: number;
    name: string;
    workflow_name?: string | null;
    user_id?: number | null;
    user_email?: string | null;
    organization_id?: number | null;
    organization_name?: string | null;
    mode: string;
    call_type: string;
    state: string;
    is_completed: boolean;
    created_at: string;
};

type DashboardResponse = {
    stats: DashboardStats;
    recent_logins: LoginEvent[];
    recent_users: UserSummary[];
    recent_organizations: OrganizationSummary[];
    recent_activity: ActivityRun[];
};

const numberFormatter = new Intl.NumberFormat();

function formatNumber(value: number | undefined) {
    return numberFormatter.format(value ?? 0);
}

function formatDate(value?: string | null) {
    if (!value) return "Never";

    return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

function getBrowserLabel(userAgent?: string | null) {
    if (!userAgent) return "Unknown";
    if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Safari";
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    return userAgent.slice(0, 38);
}

export default function SuperadminPage() {
    const [userId, setUserId] = useState("");
    const [error, setError] = useState("");
    const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isImpersonating, setIsImpersonating] = useState(false);
    const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
    const { user, getAccessToken, isAuthenticated } = useAuth();

    const metricCards = useMemo(() => [
        { label: "Users", value: dashboard?.stats.total_users, icon: Users },
        { label: "Workspaces", value: dashboard?.stats.total_organizations, icon: Building2 },
        { label: "Voice Agents", value: dashboard?.stats.total_voice_agents, icon: Bot },
        { label: "Campaigns", value: dashboard?.stats.total_campaigns, icon: Megaphone },
        { label: "Calls", value: dashboard?.stats.total_calls, icon: PhoneCall },
        { label: "Logins 24h", value: dashboard?.stats.logins_last_24h, icon: UserCheck },
        { label: "New Users 7d", value: dashboard?.stats.new_users_last_7d, icon: ShieldCheck },
        { label: "Calls 24h", value: dashboard?.stats.calls_last_24h, icon: Activity },
    ], [dashboard]);

    const loadDashboard = useCallback(async (isManualRefresh = false) => {
        if (!isAuthenticated) return;

        setError("");
        if (isManualRefresh) {
            setIsRefreshing(true);
        } else {
            setIsLoadingDashboard(true);
        }

        try {
            const accessToken = await getAccessToken();
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || window.location.origin;
            const response = await fetch(`${backendUrl}/api/v1/superuser/dashboard`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (response.status === 403) {
                throw new Error("This account is not an admin account.");
            }

            if (!response.ok) {
                throw new Error("Failed to load admin dashboard.");
            }

            setDashboard(await response.json());
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load admin dashboard.");
        } finally {
            setIsLoadingDashboard(false);
            setIsRefreshing(false);
        }
    }, [getAccessToken, isAuthenticated]);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const handleImpersonate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsImpersonating(true);

        try {
            if (!user) {
                throw new Error("User not authenticated. Please log in and try again.");
            }

            const accessToken = await getAccessToken();
            if (!accessToken) {
                throw new Error("Missing admin access token.");
            }

            await impersonateAsSuperadmin({
                accessToken,
                providerUserId: userId,
                redirectPath: "/workflow",
                openInNewTab: true,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to impersonate user.");
        } finally {
            setIsImpersonating(false);
        }
    };

    return (
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-sm text-muted-foreground">
                        Monitor users, workspaces, campaigns, calls, and recent platform activity.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => loadDashboard(true)}
                        disabled={isRefreshing || isLoadingDashboard}
                    >
                        {isRefreshing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Refresh
                    </Button>
                    <Button asChild>
                        <Link href="/superadmin/runs">
                            <List className="mr-2 h-4 w-4" />
                            All Runs
                        </Link>
                    </Button>
                </div>
            </div>

            {error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            {isLoadingDashboard ? (
                <div className="flex min-h-[360px] items-center justify-center rounded-md border">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <>
                    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {metricCards.map((metric) => {
                            const Icon = metric.icon;
                            return (
                                <Card key={metric.label}>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardDescription>{metric.label}</CardDescription>
                                        <Icon className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <CardTitle className="text-2xl">{formatNumber(metric.value)}</CardTitle>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </section>

                    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Logins</CardTitle>
                                <CardDescription>Successful sign-ins from the local auth flow</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Workspace</TableHead>
                                            <TableHead>IP</TableHead>
                                            <TableHead>Browser</TableHead>
                                            <TableHead className="text-right">Time</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dashboard?.recent_logins.length ? dashboard.recent_logins.map((login) => (
                                            <TableRow key={login.id}>
                                                <TableCell>
                                                    <div className="font-medium">{login.email || `User #${login.user_id}`}</div>
                                                    <div className="text-xs text-muted-foreground">ID {login.user_id}</div>
                                                </TableCell>
                                                <TableCell>{login.organization_name || login.organization_id || "None"}</TableCell>
                                                <TableCell>{login.ip_address || "Unknown"}</TableCell>
                                                <TableCell>{getBrowserLabel(login.user_agent)}</TableCell>
                                                <TableCell className="text-right">{formatDate(login.created_at)}</TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                    No login events yet.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Support Access</CardTitle>
                                <CardDescription>Open a user workspace in a new tab</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleImpersonate} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="userId">Provider User ID</Label>
                                        <Input
                                            id="userId"
                                            value={userId}
                                            onChange={(event) => setUserId(event.target.value)}
                                            placeholder="oss_..."
                                            required
                                        />
                                    </div>
                                    <Button type="submit" disabled={isImpersonating} className="w-full">
                                        {isImpersonating ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <ArrowRight className="mr-2 h-4 w-4" />
                                        )}
                                        Impersonate
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </section>

                    <section className="grid gap-6 xl:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Users</CardTitle>
                                <CardDescription>Newest and most recently active accounts</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Usage</TableHead>
                                            <TableHead>Last Login</TableHead>
                                            <TableHead>Created</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dashboard?.recent_users.map((account) => (
                                            <TableRow key={account.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{account.email || `User #${account.id}`}</span>
                                                        {account.is_superuser && <Badge variant="secondary">Admin</Badge>}
                                                    </div>
                                                    <div className="max-w-[260px] truncate text-xs text-muted-foreground">
                                                        {account.provider_id}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">{account.voice_agent_count} agents</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {account.workflow_run_count} runs · {account.login_count} logins
                                                    </div>
                                                </TableCell>
                                                <TableCell>{formatDate(account.last_login_at)}</TableCell>
                                                <TableCell>{formatDate(account.created_at)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Workspaces</CardTitle>
                                <CardDescription>Workspace size and latest activity</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Workspace</TableHead>
                                            <TableHead>Users</TableHead>
                                            <TableHead>Build</TableHead>
                                            <TableHead>Last Activity</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dashboard?.recent_organizations.map((organization) => (
                                            <TableRow key={organization.id}>
                                                <TableCell>
                                                    <div className="font-medium">Workspace #{organization.id}</div>
                                                    <div className="max-w-[260px] truncate text-xs text-muted-foreground">
                                                        {organization.provider_id}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{organization.user_count}</TableCell>
                                                <TableCell>
                                                    <div className="text-sm">{organization.voice_agent_count} agents</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {organization.campaign_count} campaigns · {organization.workflow_run_count} runs
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                        {formatDate(organization.last_run_at || organization.last_login_at)}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </section>

                    <Card>
                        <CardHeader>
                            <CardTitle>Latest Agent Activity</CardTitle>
                            <CardDescription>Recent web calls, telephony calls, and campaign-triggered runs</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Run</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Workspace</TableHead>
                                        <TableHead>Mode</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Started</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dashboard?.recent_activity.length ? dashboard.recent_activity.map((run) => (
                                        <TableRow key={run.id}>
                                            <TableCell>
                                                <div className="font-medium">{run.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    #{run.id} · {run.workflow_name || "Unknown agent"}
                                                </div>
                                            </TableCell>
                                            <TableCell>{run.user_email || run.user_id || "Unknown"}</TableCell>
                                            <TableCell>{run.organization_name || run.organization_id || "None"}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{run.mode}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={run.is_completed ? "success" : "secondary"}>
                                                        {run.is_completed ? "Completed" : run.state}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">{run.call_type}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">{formatDate(run.created_at)}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                No agent activity yet.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </>
            )}
        </main>
    );
}
