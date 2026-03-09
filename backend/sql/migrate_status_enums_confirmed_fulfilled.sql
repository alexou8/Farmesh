-- STEP 1: Adds CONFIRMED/FULFILLED lifecycle statuses used by the app.
-- Run this script first in Supabase SQL Editor (or psql), then run:
--   backend/sql/backfill_statuses_confirmed_fulfilled.sql
--
-- Why split scripts?
-- Postgres raises SQLSTATE 55P04 if a newly added enum value is used
-- in the same transaction where it was added.

DO $$
BEGIN
  ALTER TYPE public.match_status ADD VALUE IF NOT EXISTS 'FULFILLED';
EXCEPTION
  WHEN undefined_object THEN
    RAISE NOTICE 'Type public.match_status not found; skipping.';
END;
$$;

DO $$
BEGIN
  ALTER TYPE public.listing_status ADD VALUE IF NOT EXISTS 'CONFIRMED';
  ALTER TYPE public.listing_status ADD VALUE IF NOT EXISTS 'FULFILLED';
EXCEPTION
  WHEN undefined_object THEN
    RAISE NOTICE 'Type public.listing_status not found; skipping.';
END;
$$;

DO $$
BEGIN
  ALTER TYPE public.request_status ADD VALUE IF NOT EXISTS 'CONFIRMED';
  ALTER TYPE public.request_status ADD VALUE IF NOT EXISTS 'FULFILLED';
EXCEPTION
  WHEN undefined_object THEN
    RAISE NOTICE 'Type public.request_status not found; skipping.';
END;
$$;
