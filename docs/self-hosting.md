# Self-Hosting Guide

This document covers running the OurDAO frontend as a containerized standalone service.

## Architecture

The frontend uses Next.js with `output: 'standalone'` in `next.config.ts`. In standalone mode, Next.js produces a self-contained Node.js server under `.next/standalone` that includes only the necessary dependencies, omitting unused packages from `node_modules`.

Static assets (`public/` and `.next/static/`) are copied alongside the standalone server, and served by the standalone Node process or via a reverse proxy (e.g. Nginx, Caddy, Cloudflare).

## Environment Variables: Build-time vs Runtime

Next.js embeds environment variables prefixed with `NEXT_PUBLIC_` into client-side JavaScript bundles at **build time**. Non-prefixed variables are read at **runtime** by server-side routes (such as `/api/documents`).

### Build-time Variables (`ARG` in Dockerfile)

| Variable | Description | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_SOROBAN_RPC_URL` | Soroban RPC endpoint | `https://soroban-testnet.stellar.org` |
| `NEXT_PUBLIC_NETWORK_PASSPHRASE` | Stellar network passphrase | `Test SDF Network ; September 2015` |
| `NEXT_PUBLIC_BACKEND_URL` | OurDAO backend API URL | `http://localhost:4000` |
| `NEXT_PUBLIC_IPFS_GATEWAY` | IPFS gateway(s) for document retrieval | `https://gateway.pinata.cloud/ipfs/` |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Deployed DAO contract ID | `""` |
| `NEXT_PUBLIC_APP_VERSION` | Application version | from `package.json` |
| `NEXT_PUBLIC_GIT_SHA` | Git commit SHA for build tracking | `""` |

### Runtime Variables (`ENV` in container)

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | Listening port for Node server | `3000` |
| `HOSTNAME` | Listening interface | `0.0.0.0` |
| `PINATA_JWT` | Secret Pinata JWT for `/api/documents` uploads | `""` |

> **Important**: Changing any `NEXT_PUBLIC_*` variable requires rebuilding the container image so the new values are compiled into client JS bundles.

## Building and Running with Docker

### Build the Image

```bash
docker build \
  --build-arg NEXT_PUBLIC_SOROBAN_RPC_URL="https://soroban-testnet.stellar.org" \
  --build-arg NEXT_PUBLIC_NETWORK_PASSPHRASE="Test SDF Network ; September 2015" \
  --build-arg NEXT_PUBLIC_BACKEND_URL="https://api.yourdao.org" \
  --build-arg NEXT_PUBLIC_IPFS_GATEWAY="https://gateway.pinata.cloud/ipfs/" \
  -t ourdao-frontend:latest .
```

### Run the Container

```bash
docker run -d \
  --name ourdao-frontend \
  -p 3000:3000 \
  -e PINATA_JWT="your-pinata-jwt" \
  ourdao-frontend:latest
```

## Running with Docker Compose

A pre-configured `docker-compose.yml` is provided in the repository root.

1. Create a `.env` file or export your desired environment variables:
   ```env
   NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
   NEXT_PUBLIC_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
   NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
   NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
   PINATA_JWT=your-pinata-jwt
   ```

2. Start the service:
   ```bash
   docker compose up -d --build
   ```

3. Access the application at `http://localhost:3000`.
