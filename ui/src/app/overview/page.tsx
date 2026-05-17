"use client";

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PRODUCT_NAME, PRODUCT_SHORT_NAME } from '@/constants/brand';
import { useAuth } from '@/lib/auth';

export default function OverviewPage() {
    const { user, provider } = useAuth();
    const isOSSMode = provider !== 'stack';

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                {/* Welcome Card */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="text-3xl">
                            {isOSSMode ? (
                                `Welcome to ${PRODUCT_SHORT_NAME}`
                            ) : (
                                `Welcome${user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}!`
                            )}
                        </CardTitle>
                        <CardDescription className="text-lg mt-2">
                            {isOSSMode ? (
                                <>
                                    Build, test, and launch voice AI agents with your own model, voice, and telephony providers.
                                </>
                            ) : (
                                "Get started with building voice AI workflows"
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isOSSMode && (
                            <div className="mb-6 text-sm text-muted-foreground">
                                Free setup includes local testing and 5 demo-call positioning. Real outbound calls require a connected telephony provider.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create and Manage your Voice Agents</CardTitle>
                            <CardDescription>
                                Build powerful AI Voice Agents with our visual editor
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild>
                                <Link href="/workflow">
                                    Go to Agents
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Configure Services</CardTitle>
                            <CardDescription>
                                Set up your AI services like LLM, TTS, and STT providers
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild variant="outline">
                                <Link href="/model-configurations">
                                    Configure Models
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Launch Voice Campaigns</CardTitle>
                            <CardDescription>
                                Upload leads, pace outbound calls, and monitor progress from one workspace
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild variant="outline">
                                <Link href="/campaigns">
                                    Open Campaigns
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Pick a Plan</CardTitle>
                            <CardDescription>
                                Compare Free, Starter, Pro, and Agency levels for {PRODUCT_NAME}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild variant="outline">
                                <Link href="/pricing">
                                    View Pricing
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Resources Section */}
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>Resources</CardTitle>
                        <CardDescription>
                            Set up the core parts of your {PRODUCT_SHORT_NAME} workspace
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4">
                            <Button asChild variant="outline">
                                <Link href="/model-configurations">Connect AI Keys</Link>
                            </Button>
                            <Button asChild variant="outline">
                                <Link href="/telephony-configurations">Connect Telephony</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
