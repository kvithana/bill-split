# Split // it

A Next.js application for splitting bills with friends. No fuss.

## Prerequisites

- Node.js (version compatible with Next.js 15.1.7)
- npm, yarn, pnpm, or bun

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
OPENAI_API_KEY=your_openai_api_key
BLOB_READ_WRITE_TOKEN=your_blob_read_write_token
```

## Getting Started

First, run the development server:

```bash
pnpm install
```

## Development

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Progressive Web App (PWA)

The application is configured as a PWA using Serwist (formerly Workbox). The service worker configuration can be found in `app/sw.ts`.
