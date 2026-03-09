-- STEP 2: Backfill listing/request statuses from related match statuses.
-- Run this only AFTER:
--   backend/sql/migrate_status_enums_confirmed_fulfilled.sql
-- has completed in a prior execution/transaction.

-- Backfill listing statuses from related matches.
WITH listing_targets AS (
  SELECT
    m.listing_id,
    CASE
      WHEN bool_or(m.status = 'FULFILLED') THEN 'FULFILLED'
      WHEN bool_or(m.status = 'CONFIRMED') THEN 'CONFIRMED'
      WHEN bool_or(m.status IN ('PROPOSED', 'AWAITING_CONFIRMATION')) THEN 'MATCHED'
      ELSE 'OPEN'
    END AS target_status
  FROM public.matches m
  GROUP BY m.listing_id
)
UPDATE public.listings l
SET status = lt.target_status::public.listing_status
FROM listing_targets lt
WHERE l.id = lt.listing_id
  AND l.status::text <> lt.target_status;

-- Backfill request statuses from related matches.
WITH request_targets AS (
  SELECT
    m.request_id,
    CASE
      WHEN bool_or(m.status = 'FULFILLED') THEN 'FULFILLED'
      WHEN bool_or(m.status = 'CONFIRMED') THEN 'CONFIRMED'
      WHEN bool_or(m.status IN ('PROPOSED', 'AWAITING_CONFIRMATION')) THEN 'MATCHED'
      ELSE 'OPEN'
    END AS target_status
  FROM public.matches m
  GROUP BY m.request_id
)
UPDATE public.requests r
SET status = rt.target_status::public.request_status
FROM request_targets rt
WHERE r.id = rt.request_id
  AND r.status::text <> rt.target_status;
