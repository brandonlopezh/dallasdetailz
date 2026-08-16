-- Seed data — PLACEHOLDER pricing & durations.
-- PRD §11 Open Question 1 is BLOCKING: replace these with the real menu, real
-- prices by tier, and real TWO-PERSON durations before launch. Durations here
-- assume the crew works together (not solo estimates).

insert into business_settings (id) values (1)
  on conflict (id) do nothing;

-- Services -----------------------------------------------------------------
insert into services (id, name, description, category, base_duration_min, sort_order) values
  ('11111111-1111-1111-1111-111111111111',
   'Exterior Detail',
   'Foam wash, wheels & tires, bug/tar removal, spotless windows, hand dry, tire shine.',
   'exterior', 75, 1),
  ('22222222-2222-2222-2222-222222222222',
   'Interior Detail',
   'Full vacuum, steam & shampoo, leather/plastic wipe-down, windows, deodorize.',
   'interior', 120, 2),
  ('33333333-3333-3333-3333-333333333333',
   'Full Detail',
   'Everything in Exterior + Interior. Our most-booked package for trucks and SUVs.',
   'full', 180, 3);

-- Pricing by vehicle tier (sedan | mid_suv | large_suv | xl) ---------------
insert into service_pricing (service_id, tier, price, duration_min) values
  -- Exterior
  ('11111111-1111-1111-1111-111111111111', 'sedan',     60,  60),
  ('11111111-1111-1111-1111-111111111111', 'mid_suv',   75,  75),
  ('11111111-1111-1111-1111-111111111111', 'large_suv', 90,  90),
  ('11111111-1111-1111-1111-111111111111', 'xl',        110, 105),
  -- Interior
  ('22222222-2222-2222-2222-222222222222', 'sedan',     90,  90),
  ('22222222-2222-2222-2222-222222222222', 'mid_suv',   120, 120),
  ('22222222-2222-2222-2222-222222222222', 'large_suv', 150, 150),
  ('22222222-2222-2222-2222-222222222222', 'xl',        180, 180),
  -- Full Detail
  ('33333333-3333-3333-3333-333333333333', 'sedan',     140, 150),
  ('33333333-3333-3333-3333-333333333333', 'mid_suv',   180, 180),
  ('33333333-3333-3333-3333-333333333333', 'large_suv', 220, 210),
  ('33333333-3333-3333-3333-333333333333', 'xl',        260, 240);

-- Add-ons ------------------------------------------------------------------
insert into addons (name, description, price, duration_min, sort_order) values
  ('Pet hair removal',       'Heavy pet hair extraction from seats & carpet.', 25, 20, 1),
  ('Heavy stain treatment',  'Deep extraction for set-in stains.',             30, 30, 2),
  ('Engine bay cleaning',    'Degrease and dress the engine bay.',             30, 20, 3),
  ('Headlight restoration',  'Sand, polish, and seal foggy headlights.',       40, 30, 4),
  ('Wax / sealant',          'Hand wax or spray sealant for lasting gloss.',   50, 30, 5),
  ('Clay bar treatment',     'Clay decontamination for glass-smooth paint.',   45, 40, 6);
