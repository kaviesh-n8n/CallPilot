"use client";

import { Check, KeyRound, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PRICING_PLANS, PRODUCT_NAME, PRODUCT_TAGLINE } from "@/constants/brand";
import { cn } from "@/lib/utils";

export default function PricingPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8">
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          White-label voice AI SaaS
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {PRODUCT_NAME} pricing
            </h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
              {PRODUCT_TAGLINE} Platform plans cover workspace, campaigns, analytics, and admin tools. Provider usage is billed by the accounts users connect.
            </p>
          </div>
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <KeyRound className="h-4 w-4" />
                Bring your own keys
              </CardTitle>
              <CardDescription>
                Connect OpenAI, Gemini, Groq, NVIDIA, STT, TTS, and telephony providers from the Models and Telephony pages.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PRICING_PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={cn(
              "flex h-full flex-col",
              plan.highlighted && "border-primary shadow-sm"
            )}
          >
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{plan.name}</CardTitle>
                {plan.highlighted && (
                  <span className="rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                    Popular
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-semibold">{plan.price}</span>
                <span className="text-sm text-muted-foreground">/{plan.cadence}</span>
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between gap-6">
              <ul className="space-y-3 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button asChild variant={plan.highlighted ? "default" : "outline"} className="w-full">
                <Link href={plan.name === "Free" ? "/workflow/create" : "/settings"}>
                  {plan.cta}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4" />
              Free level
            </CardTitle>
            <CardDescription>
              The free plan is intended for setup validation. Real outbound calls still require a connected telephony account.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Provider billing</CardTitle>
            <CardDescription>
              Users pay OpenAI, Gemini, Groq, NVIDIA, Deepgram, ElevenLabs, Twilio, Telnyx, or other providers directly.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Campaign controls</CardTitle>
            <CardDescription>
              Campaign pacing, retries, analytics, call logs, and admin reporting stay inside {PRODUCT_NAME}.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </main>
  );
}

