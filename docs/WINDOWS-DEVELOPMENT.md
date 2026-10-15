# Windows: run the Alpha preferences slice

Use PowerShell, Git, Node >=22.13 and Docker Desktop with Linux containers (or an existing PostgreSQL and Redis installation). These Windows instructions have not been executed on a Windows machine here. Database migrations, API behaviour and application checks were verified in the Linux cloud environment.

## Update the checkout

In your existing Voxora folder, preserve any local changes before pulling:

```powershell
git status
git fetch origin
git switch voxora/alpha-home-and-arcade
git pull --ff-only
npx --yes pnpm@10.33.3 install --frozen-lockfile
```

## Local databases

If you do not already have development services, create dedicated containers. The following local-only password is for development, never production. Ports are exposed only on loopback. If these container names or ports already exist, reuse/inspect your services rather than deleting data.

```powershell
docker run --name voxora-dev-postgres -e POSTGRES_USER=voxora -e POSTGRES_PASSWORD=voxora -e POSTGRES_DB=voxora -p 127.0.0.1:5432:5432 -v voxora-dev-postgres:/var/lib/postgresql/data -d postgres:16
docker run --name voxora-dev-redis -p 127.0.0.1:6379:6379 -d redis:7
docker exec voxora-dev-postgres pg_isready -U voxora
docker exec voxora-dev-redis redis-cli ping
```

For subsequent sessions, `docker start voxora-dev-postgres voxora-dev-redis` reuses them. Do not delete volumes to refresh code.

## API terminal

Set configuration before running the API or migration commands. Keep this terminal open; generated development secrets are session-only and are never committed. Restarting with new JWT secrets invalidates old sessions; generating a new MFA encryption key cannot decrypt factors previously stored with the old key. Retain the same MFA key securely if testing persistent MFA accounts.

```powershell
$env:DATABASE_URL = 'postgresql://voxora:voxora@127.0.0.1:5432/voxora?schema=public'
$env:REDIS_URL = 'redis://127.0.0.1:6379'
$env:NODE_ENV = 'development'
$env:API_HOST = '127.0.0.1'
$env:API_PORT = '3000'
$env:EMAIL_PROVIDER = 'dev'
$env:PHONE_PROVIDER = 'dev'
$env:JWT_ACCESS_SECRET = node -e 'process.stdout.write(require("node:crypto").randomBytes(32).toString("hex"))'
$env:JWT_REFRESH_SECRET = node -e 'process.stdout.write(require("node:crypto").randomBytes(32).toString("hex"))'
$env:MFA_ENCRYPTION_KEY = node -e 'process.stdout.write(require("node:crypto").randomBytes(32).toString("hex"))'
npx --yes pnpm@10.33.3 db:generate
npx --yes pnpm@10.33.3 db:migrate:deploy
npx --yes pnpm@10.33.3 build
npx --yes pnpm@10.33.3 api:dev
```

`dev` email/phone providers capture development verification artifacts; they do not send real email/SMS. Use only isolated test accounts. Never enable these as production delivery.

In another PowerShell terminal, verify service readiness:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/v1/health/ready
```

Expected: status `ready`, database `up`, redis `up`. For Android emulator access to the API, use the emulator host bridge (normally `http://10.0.2.2:3000`) in `EXPO_PUBLIC_API_URL` in the mobile terminal. For a USB device with adb, reverse ports 3000/8081 and use loopback. A physical device over Wi-Fi requires a reachable host address and deliberate firewall/network configuration; do not expect phone localhost to mean the laptop.

## Mobile terminal

The app includes native Rive/Nitro modules, so use a compatible Android development build/emulator; Expo Go is not assumed compatible. Android Studio/SDK/device setup is a separate prerequisite and was not validated here.

```powershell
$env:EXPO_PUBLIC_API_URL = 'http://10.0.2.2:3000'
npx --yes pnpm@10.33.3 --filter @voxora/mobile android
```

After a native development build is installed, start Metro using `npx --yes pnpm@10.33.3 mobile:start` when needed. Sign in, complete the existing onboarding path, then open **Account settings → Your Alpha**. Change a buddy name/preferences, save, leave settings and reopen: the saved values should reload. Reset requests confirmation and removes the saved preferences. The home displays the chosen name/humour/voice preference; this does not connect a language model or voice provider.

## Automated checks

```powershell
npx --yes pnpm@10.33.3 typecheck
npx --yes pnpm@10.33.3 test
npx --yes pnpm@10.33.3 --filter @voxora/api lint
```

API end-to-end tests delete fixture data. Use a separate `voxora_test` database only and the environment in .github/workflows/ci.yml, including NODE_ENV=test and dev delivery providers, before running `test:e2e`. Never aim those tests at the development or production database.
