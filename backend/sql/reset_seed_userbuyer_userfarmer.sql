-- Reset and seed listings/requests/matches for demo users `devfarmer` and `devbuyer`.
-- This script keeps `public.users` untouched and repopulates normalized data.

DO $$
DECLARE
  v_farmer_id uuid;
  v_buyer_id uuid;
  v_now timestamptz := timezone('utc', now());
BEGIN
  SELECT id
    INTO v_farmer_id
    FROM public.users
   WHERE lower(name) = 'devfarmer'
      OR lower(split_part(email, '@', 1)) = 'devfarmer'
      OR lower(email) LIKE '%devfarmer%'
   LIMIT 1;

  IF v_farmer_id IS NULL THEN
    RAISE EXCEPTION 'Could not find devfarmer in public.users';
  END IF;

  SELECT id
    INTO v_buyer_id
    FROM public.users
   WHERE lower(name) = 'devbuyer'
      OR lower(split_part(email, '@', 1)) = 'devbuyer'
      OR lower(email) LIKE '%devbuyer%'
   LIMIT 1;

  IF v_buyer_id IS NULL THEN
    RAISE EXCEPTION 'Could not find devbuyer in public.users';
  END IF;

  DELETE FROM public.matches;
  DELETE FROM public.requests;
  DELETE FROM public.listings;

  INSERT INTO public.listings (
    id,
    vendor_id,
    raw_input,
    status,
    created_at,
    expiration_date,
    original_product,
    original_quantity,
    original_unit,
    original_price_per_unit,
    normalized_product,
    product_category,
    canonical_quantity,
    canonical_unit,
    canonical_price_per_canonical_unit,
    assumptions
  )
  VALUES
    (
      gen_random_uuid(),
      v_farmer_id,
      'SEED_devfarmer_listing_1: 120 lb carrots at 1.95/lb',
      'OPEN',
      v_now - interval '30 minutes',
      v_now + interval '9 days',
      'Carrots',
      120,
      'lb',
      1.95,
      'Carrots',
      'produce',
      54.43,
      'kg',
      4.30,
      ARRAY['Converted 120 lb to 54.43 kg']::text[]
    ),
    (
      gen_random_uuid(),
      v_farmer_id,
      'SEED_devfarmer_listing_2: 75 lb yellow onions at 2.10/lb',
      'OPEN',
      v_now - interval '20 minutes',
      v_now + interval '8 days',
      'Yellow Onions',
      75,
      'lb',
      2.10,
      'Yellow Onions',
      'produce',
      34.02,
      'kg',
      4.63,
      ARRAY['Converted 75 lb to 34.02 kg']::text[]
    ),
    (
      gen_random_uuid(),
      v_farmer_id,
      'SEED_devfarmer_listing_3: 35 lb spinach at 4.20/lb',
      'OPEN',
      v_now - interval '10 minutes',
      v_now + interval '6 days',
      'Spinach',
      35,
      'lb',
      4.20,
      'Spinach',
      'produce',
      15.88,
      'kg',
      9.26,
      ARRAY['Converted 35 lb to 15.88 kg']::text[]
    ),
    (
      gen_random_uuid(),
      v_farmer_id,
      'SEED_devfarmer_listing_4: 90 lb mixed baby greens at 4.60/lb',
      'OPEN',
      v_now - interval '5 minutes',
      v_now + interval '7 days',
      'Mixed Baby Greens',
      90,
      'lb',
      4.60,
      'Mixed Baby Greens',
      'produce',
      40.82,
      'kg',
      10.14,
      ARRAY['Converted 90 lb to 40.82 kg']::text[]
    );

  INSERT INTO public.requests (
    id,
    buyer_id,
    raw_input,
    status,
    created_at,
    original_product,
    original_quantity,
    original_unit,
    original_price_per_unit,
    normalized_product,
    product_category,
    canonical_quantity,
    canonical_unit,
    canonical_price_per_canonical_unit,
    needed_date,
    assumptions
  )
  VALUES
    (
      gen_random_uuid(),
      v_buyer_id,
      'SEED_devbuyer_request_1: Need 70 lb carrots by Tuesday at max 2.30/lb',
      'OPEN',
      v_now - interval '25 minutes',
      'Carrots',
      70,
      'lb',
      2.30,
      'Carrots',
      'produce',
      31.75,
      'kg',
      5.07,
      v_now + interval '2 days',
      ARRAY['Converted 70 lb to 31.75 kg']::text[]
    ),
    (
      gen_random_uuid(),
      v_buyer_id,
      'SEED_devbuyer_request_2: Need 100 lb salad greens by Wednesday at max 5.20/lb',
      'OPEN',
      v_now - interval '15 minutes',
      'Salad Greens',
      100,
      'lb',
      5.20,
      'Salad Greens',
      'produce',
      45.36,
      'kg',
      11.46,
      v_now + interval '3 days',
      ARRAY['Converted 100 lb to 45.36 kg']::text[]
    ),
    (
      gen_random_uuid(),
      v_buyer_id,
      'SEED_devbuyer_request_3: Need 30 lb spinach by Thursday at max 4.80/lb',
      'OPEN',
      v_now - interval '8 minutes',
      'Spinach',
      30,
      'lb',
      4.80,
      'Spinach',
      'produce',
      13.61,
      'kg',
      10.58,
      v_now + interval '4 days',
      ARRAY['Converted 30 lb to 13.61 kg']::text[]
    );
END;
$$;

-- After running this script, use the app "Run Matching" button (or POST /api/match)
-- to generate fresh matches from the seeded OPEN listings/requests.
