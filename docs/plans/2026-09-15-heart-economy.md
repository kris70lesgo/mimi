# Mimi Heart and XP Economy Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make Mimi's hearts, XP, lesson attempts, completions, and one-day unlimited-hearts pass durable account data rather than browser-only state.

**Architecture:** Supabase is the system of record. A small set of authenticated database functions records learning results atomically, maintains the daily five-heart allowance, awards idempotent XP ledger entries, and writes audit events. A Stripe Checkout + webhook integration is included as a configuration-gated path for the fixed $1, 24-hour heart pass. The client displays server-returned balances and never writes XP or heart balances directly.

**Tech Stack:** React + TypeScript, Supabase Postgres/RLS/RPC, Supabase Edge Functions, Stripe Checkout.

---

## Work items

1. Add database tables for XP events, heart events, paid heart entitlements, and payment orders; enable RLS and expose user-owned reads only.
2. Add server-side functions for daily heart grants and atomic learning-result recording. Use fixed XP awards and idempotency keys so retries cannot duplicate rewards.
3. Lock direct browser writes to progress, attempts, and completions; update the React client to use the result RPC and display authoritative balances.
4. Add the fixed-price one-day unlimited-heart product plus a Stripe Checkout Edge Function and webhook source. Do not activate checkout without Stripe secrets and webhook configuration.
5. Add the Shop UI for the $1 pass, run type checks/build, apply the database migration, run Supabase security advisors, then commit and push.

## Acceptance checks

- A signed-in learner starts each new UTC day with five hearts.
- An incorrect activity deducts one heart; a correct activity awards XP once only.
- Lesson completion earns XP once and persists the best score.
- A learner cannot directly update their own XP/hearts using the browser API.
- Payment records and entitlements are server-managed and private to the user.
- The UI builds, and the migration passes Supabase security-advisor checks.

## Stripe activation (owner action required)

The database product is fixed at **$1.00 USD** for a 24-hour pass. Before enabling the visible checkout button in production, set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SIGNING_SECRET` as Supabase Edge Function secrets, deploy `create-heart-pass-checkout` and `stripe-heart-pass-webhook`, and register the deployed webhook URL in Stripe for `checkout.session.completed`. Do not put either Stripe secret in the browser environment.
