# Modules 41–48: Voxora Money Maker

15 October 2026 · Product specification and first read-only integration slice. No financial accounts are connected and no orders are enabled.

The [original request](blueprint/money-maker-request.txt) is preserved verbatim. Capital preservation, evidence, realistic expenses and user control take precedence over chasing profit. No income or investment return is guaranteed. Alpha must not encourage revenge trading, more deposits to recover losses, or automatically expanding budgets after profitable simulations.

## Modules and repository mapping

| Module                       | Capability                                                                              | Current implementation / dependencies                                                                                                                  |
| ---------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 41 Alpha Trading Agent       | Research, Strategy Lab, Risk Guardian, portfolio history, approved broker orders        | Read-only Alpaca paper account-check adapter and CLI implemented under scripts/integrations; no market feed, simulator, portfolio storage or execution |
| 42 Freelance Income Agent    | Opportunity discovery, portfolios, estimates, proposals and approved bids               | Planned; permitted Upwork/Fiverr/Freelancer/local-client adapters, document tools and approval workflow needed                                         |
| 43 Digital Product Studio    | Templates, planners, graphics, business forms, listings and customer communications     | Planned; creative/document production, supported stores and publish approvals needed                                                                   |
| 44 Content Business Agent    | Niche research, scripts, licensed media, calendars, analytics and eligible monetisation | Planned; research/media engines, originality checks, disclosure rules and permitted publishers needed                                                  |
| 45 Business Launch Assistant | Competitors, pricing, websites, marketing, enquiries and customer service               | Planned; research, work tools, scoped automation and cost tracking needed                                                                              |
| 46 Opportunity Radar         | Jobs, projects, tenders, grants and paid research                                       | Planned; reuse Career Agent evidence/eligibility/deduplication, source/date/deadline verification                                                      |
| 47 Online Selling Assistant  | Inventory, photography, listings, competitor pricing and resale workflows               | Planned; legitimate marketplace adapters and publish approvals needed                                                                                  |
| 48 Financial Growth Planner  | Spending, subscriptions, savings and sourced product comparisons                        | Planned; consent-scoped financial records, explicit import and read-only connections needed                                                            |

The proposed Wealth & Income Centre groups Trading Lab, Opportunity Radar, Freelance Work, My Digital Store, Money Manager and Risk Guardian. It must distinguish paper values from real holdings and unavailable balances. Do not add dummy account balances or clickable claims that an integration exists. These areas fit under Work and My World without replacing the six-space navigation.

## Delivery sequence

1. Opportunity research, freelance preparation, manually entered financial tracking and an explicitly enabled simulation environment. Label price sources/delay, model fees, slippage, drawdown and execution assumptions. Backtests must avoid look-ahead and survivorship bias and report limitations.
2. Digital products, portfolio/invoice assistance and supported marketplace integrations.
3. Read-only broker portfolios before any live execution. Current adapter only probes a paper account; it is not a portfolio tracker or simulation engine. Interactive Brokers and locally compatible brokers remain candidate adapters.
4. Individually approved live orders only after provider eligibility, legal/regulatory scope, security and operational readiness are established. Controlled automation is later work requiring independent controls and authorisation; autonomous investment management is excluded from initial release.

Initial live scope, if authorised later: supported unleveraged stocks/ETFs; JSE securities depend on a compatible broker. FX and cryptocurrency research can be scoped separately by jurisdiction and provider support. Exclude leveraged CFDs, margin, options and automated speculative execution initially. Verify relevant provider authorisations, including the supplied FSCA entity-search reference for South African services; broker API availability alone does not establish user eligibility or Voxora's authorisation to provide regulated services.

## Permission and execution boundary

Research/news, drafting and backtesting require authorised source/data access. Simulation requires explicit enablement. Preparing an order requires configured permission, but cannot execute it. Publishing listings, submitting bids, sending proposals, purchases, transfers and financial agreements each require their appropriate scoped authorisation. Never infer them from a conversational “get started.”

Future live proposals must show account, instrument, side, quantity, order type, price assumptions, estimated fees/currency, exposure and downside. Approval binds exact proposal contents and expires; edits invalidate it. Persist idempotency before dispatch and reconcile uncertain outcomes by provider order ID before retrying. A timeout is not proof an order failed, and an acknowledgement is not a fill. Track partial fills, rejects, cancellations, fees and timestamps explicitly.

Risk controls must be enforced outside the model: allocated-capital ceiling, maximum position and concentration limits, daily loss controls, allowed instruments/trading hours, stale-data checks, API-key isolation, audit records and a kill switch that blocks new dispatch immediately. Persist limits and approvals; the AI cannot expand them. Account-level loss-alert percentages (e.g. 1%, 2%, 10%) are illustrative preferences, not guaranteed stop losses. Gaps, slippage and open orders can exceed thresholds. The kill switch must distinguish stopping new orders from broker-confirmed cancellation of existing ones.

## Opportunity scoring and Scam Detection Gate

Record source, retrieval time, evidence and uncertainty for legitimacy, upfront cost, realistic downside, skills match, time commitment, net profit potential, confidence and licensing/tax/platform/contract considerations. Unknown factors remain unknown rather than getting a favourable default score. Any scoring weights must be visible and configurable; no opaque “safe” score or guaranteed earning estimate.

Flag suspicious upfront fees, unrealistic returns and requests for private banking credentials before any proposal is approved. A detector's silence is not a legitimacy guarantee. Include cost assumptions and eligibility/deadline checks. Reuse Career Agent for job opportunities rather than building duplicate application flows. Skills, reusable products and diverse income streams are first-class outcomes, not merely trading alternatives.

## Current integration slice

`scripts/integrations/alpaca-paper.mjs` uses a fixed HTTPS paper endpoint and only `GET /v2/account`. It validates required response fields, refuses redirects, times out, redacts credentials/account identifiers/balances and reports missing credentials, denied access, provider errors or malformed responses honestly. It exposes no orders, transfers, live endpoint or budget settings. It is a server/laptop diagnostic; never bundle broker secrets into the mobile application. Account connectivity does not imply trading eligibility, balance correctness or permission for execution.

The adapter uses Alpaca's API-key header conventions and account route. Official reference for provider review: https://docs.alpaca.markets/ and its paper-trading/account API documentation. A real credentialed contract test remains required; mocked tests cannot establish provider connectivity. No broker credentials were available in this environment.

Follow [Integration Handoff](INTEGRATION-HANDOFF.md) for executable checks and the exact remaining prerequisites. No trading model, live brokerage service, financial advice engine or income platform is presented as complete by this update.
