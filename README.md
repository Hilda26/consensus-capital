# Consensus Capital

A GenLayer-native investment opportunity intelligence layer. Many minds. One capital consensus.

## Stack

- Next.js 15 (App Router) + TypeScript strict
- Tailwind CSS (Conviction Salon palette)
- GenLayer JS SDK 1.2+
- wagmi + viem (injected wallet)
- Supabase (indexing and UX cache only)
- GenLayer Studionet (chainId 61999)

## Setup

```
npm install
cp .env.example .env.local
# Fill in Supabase + NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS once the contract is deployed
npm run dev
```

## Contract

The single intelligent contract lives at [contract/consensus_capital.py](contract/consensus_capital.py). Deploy it to GenLayer Studionet and put its address in `NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS`.

If the contract address is empty, the app shows empty states everywhere - no fake scores, no fake model outputs, no fake transaction hashes.

## Supabase

Run [supabase/migrations/0001_init.sql](supabase/migrations/0001_init.sql) in your Supabase project. Supabase only mirrors GenLayer state; it never overrides consensus truth.

## Pipeline

1. User submits opportunity
2. Contract stores canonical opportunity JSON
3. Seven independent GenLayer evaluators (risk, upside, market fit, team quality, timing, traction, moat) judge the opportunity
4. Contract stores each model output
5. Aggregator produces consensus score, confidence, disagreement index, and recommendation band
6. Frontend renders the Consensus Ledger

## Routes

`/`, `/submit`, `/explore`, `/opportunity/[opportunityId]`, `/opportunity/[opportunityId]/update`, `/dashboard`, `/dashboard/watchlist`, `/dashboard/history`, `/profile/[wallet]`, `/methodology`, `/consensus`.
