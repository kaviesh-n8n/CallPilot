"use client";

import { ArrowRight, Bot, Building2, List, Loader2, Megaphone, PhoneCall, Users } from 'lucide-react';
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/lib/auth';
import { impersonateAsSuperadmin } from "@/lib/utils";

export default function SuperadminPage() {
    const [userId, setUserId] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState<{
        total_users: number;
        total_organizations: number;
        total_voice_agents: number;
        total_campaigns: number;
        total_calls: number;
    } | null>(null);
    const { user, getAccessToken } = useAuth();

    useEffect(() => {
        let cancelled = false;

        async function loadStats() {
            try {
                const accessToken = await getAccessToken();
                if (!accessToken) return;

                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || window.location.origin;
                const response = await fetch(`${backendUrl}/api/v1/superuser/stats`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                if (!response.ok) {
                    throw new Error("Failed to load admin stats");
                }

                const data = await response.json();
                if (!cancelled) {
                    setStats(data);
                }
            } catch (err) {
                console.error("Failed to load admin stats:", err);
            }
        }

        loadStats();

        return () => {
            cancelled = true;
        };
    }, [getAccessToken]);

    const handleImpersonate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            if (!user) {
                setError("User not authenticated. Please log in and try again.");
                setIsLoading(false);
                return;
            }
            const accessToken = await getAccessToken();
            if (!accessToken) {
                throw new Error('Missing admin access token');
            }

            await impersonateAsSuperadmin({
                accessToken: accessToken,
                providerUserId: userId,
                redirectPath: '/workflow',
                openInNewTab: true,
            });
        } catch (err) {
            setError("Failed to impersonate user. Please try again.");
            console.error("Impersonation error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <main className="container mx-auto p-6 space-y-6 max-w-4xl">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-2">CallPilot Admin</h1>
                    <p className="text-sm text-muted-foreground">Track users, workspaces, agents, campaigns, and calls</p>
                </div>

                <div className="grid gap-4 md:grid-cols-5">
                    {[
                        { label: "Users", value: stats?.total_users, icon: Users },
                        { label: "Workspaces", value: stats?.total_organizations, icon: Building2 },
                        { label: "Voice Agents", value: stats?.total_voice_agents, icon: Bot },
                        { label: "Campaigns", value: stats?.total_campaigns, icon: Megaphone },
                        { label: "Calls", value: stats?.total_calls, icon: PhoneCall },
                    ].map((metric) => {
                        const Icon = metric.icon;
                        return (
                            <Card key={metric.label}>
                                <CardHeader className="space-y-2 pb-3">
                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                    <CardDescription>{metric.label}</CardDescription>
                                    <CardTitle className="text-2xl">
                                        {metric.value ?? "—"}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                        );
                    })}
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                        {/* User Impersonation Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>User Impersonation</CardTitle>
                                <CardDescription>
                                    Impersonate a user account for debugging or support purposes
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleImpersonate} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="userId">Provider User ID</Label>
                                        <Input
                                            id="userId"
                                            value={userId}
                                            onChange={(e) => setUserId(e.target.value)}
                                            placeholder="Enter provider user ID"
                                            required
                                        />
                                    </div>

                                    {error && (
                                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                                            {error}
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            'Impersonate User'
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Workflow Runs Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Workflow Runs</CardTitle>
                                <CardDescription>
                                    View and manage all workflow runs across organizations
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        Access detailed information about all workflow runs, including status,
                                        recordings, transcripts, and usage data.
                                    </p>
                                    <Link href="/superadmin/runs">
                                        <Button className="w-full">
                                            <List className="mr-2 h-4 w-4" />
                                            View All Runs
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                </div>
            </main>
        </>
    );
}
