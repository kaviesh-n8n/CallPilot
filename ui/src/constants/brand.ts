export const PRODUCT_NAME = "CallPilot AI";
export const PRODUCT_SHORT_NAME = "CallPilot";
export const PRODUCT_TAGLINE = "Voice AI campaigns with your own model, voice, and telephony keys.";

export const PRICING_PLANS = [
  {
    name: "Free",
    price: "$0",
    cadence: "trial",
    description: "Validate your first agent before spending on platform access.",
    features: [
      "5 demo calls",
      "1 voice agent",
      "BYOK required",
      "Web call testing",
    ],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Starter",
    price: "$19",
    cadence: "month",
    description: "Launch a small calling workflow with your own AI and phone providers.",
    features: [
      "1 workspace",
      "Limited campaigns",
      "Provider key vault",
      "Basic call analytics",
    ],
    cta: "Choose Starter",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$79",
    cadence: "month",
    description: "Run serious outbound motion with campaigns, agents, and reporting.",
    features: [
      "More agents",
      "Campaign controls",
      "Advanced analytics",
      "Team workflows",
    ],
    cta: "Choose Pro",
    highlighted: true,
  },
  {
    name: "Agency",
    price: "$199",
    cadence: "month",
    description: "Manage multiple clients with white-label operations and admin visibility.",
    features: [
      "Multiple clients",
      "White-label workspace",
      "Admin dashboard",
      "Priority support",
    ],
    cta: "Talk to sales",
    highlighted: false,
  },
] as const;

