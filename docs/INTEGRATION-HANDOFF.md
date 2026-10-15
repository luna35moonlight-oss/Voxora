# Laptop integration handoff

15 October 2026. The development branch `voxora/alpha-home-and-arcade` contains the code, specifications and tests prepared in this session. It is not yet a fully connected application. Preserve ongoing changes and review the diff before merging; do not reset the checkout.

## Start on a laptop

Use Node >=22.13 and the repository-pinned pnpm 10.33.3. From the repository root:

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm --filter @voxora/contracts --filter @voxora/config --filter @voxora/design-system --filter @voxora/testing run build
corepack pnpm db:generate
node --test scripts/integrations/*.test.mjs
node scripts/integration-readiness.mjs
```

If Corepack is unavailable, use `npx --yes pnpm@10.33.3` in place of `corepack pnpm`. The cloud requires `npm_config_cache=/workspace/.cache/npm` because the default cache is read-only; a normal writable laptop does not require that override. The cloud currently uses Node 24.19.0. PostgreSQL and Redis are also needed for API startup; use the documented local settings in .env.example and keep development/test databases separate. Prisma's engine host binaries.prisma.sh must be reachable with TLS/checksum verification enabled.

The readiness command intentionally exits 1 while configuration is missing or has not been probed. It prints variable names and statuses, not secrets. It does not search, place trades or connect other services.

## Alpaca paper-account check

1. Create/access an authorised Alpaca paper account and obtain **paper** API credentials. Verify account eligibility and current provider documentation. Do not reuse live brokerage credentials.
2. Supply `ALPACA_PAPER_KEY_ID` and `ALPACA_PAPER_SECRET_KEY` through your shell's secure environment or a secret manager. Never paste them into chat, commit them, or put them in `EXPO_PUBLIC_*` variables. The CLI does not automatically load .env files.
3. Permit HTTPS to `paper-api.alpaca.markets` in the environment where the command runs. No network change or credential injection is assumed by this repository update.
4. Run:

```sh
node scripts/integration-readiness.mjs --probe
```

Only `connected_read_only` with exit 0 verifies that the account endpoint responded with the expected shape. It does not enable orders or simulate a trade. `not_configured` means missing variables; `authentication_or_access_denied` means HTTP 401/403; `provider_error` preserves only the HTTP status; `invalid_response` or `connection_failed` require diagnosis without logging credentials/raw account bodies.

Run `node --test scripts/integrations/*.test.mjs` to verify fixed paper endpoint, GET-only requests, redirect refusal, required fields, redaction and failure handling. CI runs these without credentials. These are mocked tests, separate from the real probe.

## Integration readiness matrix

| Integration                                | Available now                                             | What still prevents completion                                                                       |
| ------------------------------------------ | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Alpaca paper account                       | Executable read-only adapter, CLI, 12 mocked tests and CI | Paper credentials, network access and successful live probe                                          |
| Alpaca paper execution / market data       | No                                                        | Price source, explicit simulation settings, ledger, risk/idempotency and broker contract tests       |
| Interactive Brokers / South African broker | Candidate only                                            | Supported API/account eligibility, adapter and provider validation                                   |
| Live orders / funds                        | Disabled by absence of implementation                     | Regulatory/provider review, scoped approvals, hard controls, audit/persistence and integration tests |
| Gmail / Career Agent                       | Specification only                                        | OAuth application, scopes, secure token lifecycle, API adapter and end-to-end tests                  |
| LinkedIn / PNet / Indeed / ATS             | Specification only                                        | Permitted integration route; assisted application fallback where unsupported                         |
| Freelance / stores / publishing            | Specification only                                        | Choose permitted provider per module; adapters, permissions and contract tests                       |
| AI / voice / media                         | No connected provider                                     | Provider choice, credentials, router and consent/data controls                                       |
| API/database                               | Existing source and cloud service setup                   | Prisma download blocked in prior cloud check; migrations/API e2e pending                             |

## Merge/release gate

Readiness is per adapter, not a blanket “integrations ready” label. Require unit tests, a real credentialed sandbox check, end-to-end permission/revocation/failure tests, safe persistence and observed outcomes before enabling a feature. Cloud helpers under /workspace/.local are not repository dependencies and should not be assumed to exist on the laptop. See the saved cloud setup for cloud-only startup; native app/build signing remains a separate platform check.

On your laptop, fetch origin and switch to `voxora/alpha-home-and-arcade` to continue this work. The branch is for review and development; merging, deployment and store release remain separate steps. Historical evidence entries describe the state when their checks ran.

## Meeting workflow slice

See [Meeting and Ecosystem Specification](MEETING-AND-ECOSYSTEM-SPECIFICATION.md) for runnable transcript import/review commands and the remaining demonstration dependencies. Run `node --test scripts/integrations/*.test.mjs scripts/meetings/*.test.mjs` to exercise both local slices. Teams/Graph, transcription, AI minutes and email sending are not connected. Protect imported content/output as private; these CLIs do not upload it.

## Windows implementation increment

Use [Windows Development](WINDOWS-DEVELOPMENT.md) for PowerShell setup and the new account-backed Alpha preference editor. Prisma engine access and local migrations now pass in the cloud; API build, all 27 e2e tests and readiness have been verified. Earlier blocked-engine entries above describe the original onboarding state. This does not establish a real OAuth, model, voice or broker connection.
