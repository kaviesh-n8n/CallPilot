# CallPilot AI

CallPilot AI is a white-label voice AI SaaS for building agents, connecting user-owned AI/telephony keys, and running outbound campaigns from one dashboard.

## Product Positioning

- **BYOK-first**: users connect their own OpenAI, Gemini, Groq, NVIDIA, STT, TTS, and telephony provider keys.
- **Campaign-ready**: upload leads, set pacing, retry failed calls, and track call progress.
- **White-label SaaS**: brandable interface, admin dashboard, workspace-level controls, and usage visibility.
- **Self-hostable foundation**: FastAPI backend, Next.js frontend, PostgreSQL, Redis, and S3-compatible audio storage.

## Pricing Levels

| Plan | Price | Included |
| --- | --- | --- |
| Free | $0 trial | 5 demo calls, 1 voice agent, BYOK required |
| Starter | $19/month | 1 workspace, limited campaigns, provider key vault |
| Pro | $79/month | More agents, campaigns, analytics, team workflows |
| Agency | $199/month | Multiple clients, white-label workspace, admin dashboard |

Provider usage is billed by the connected provider accounts. Real outbound calls still require paid telephony minutes and phone numbers.

## Local Development

```bash
./scripts/start_services_dev.sh
```

Backend environment lives in `api/.env`; frontend environment lives in `ui/.env`.

## Deployment Notes

Supabase can provide the managed Postgres database by setting `DATABASE_URL` in the backend environment. The stack still needs Redis for queues/cache and S3-compatible storage for recordings and uploaded files, so pair Supabase with a managed Redis service and either S3/R2 or the included MinIO container. Do not commit provider API keys; users should connect their own keys through the app.

## Main Apps

- `api/`: FastAPI backend
- `ui/`: Next.js frontend
- `docs/`: documentation source
- `docker-compose.yaml`: self-hosted deployment
- `docker-compose-local.yaml`: local development services

## Security Notes

- User API keys should never be exposed to browser code.
- Superadmin endpoints reject platform API-key authentication.
- Store provider credentials only through backend settings flows.
- Campaign calling should be operated with consent, DNC, opt-out, and regional telephony compliance controls.

## License

This project preserves the upstream BSD 2-Clause license. See [LICENSE](LICENSE).
