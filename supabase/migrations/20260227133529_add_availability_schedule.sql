ALTER TABLE trainers
ADD COLUMN IF NOT EXISTS availability_schedule jsonb DEFAULT '[]'::jsonb;

UPDATE trainers
SET availability_schedule = (
  SELECT jsonb_agg(jsonb_build_object('day', day, 'start', '16:00', 'end', '20:00'))
  FROM unnest(availability) AS day
)
WHERE availability IS NOT NULL AND array_length(availability, 1) > 0
  AND (availability_schedule IS NULL OR availability_schedule = '[]'::jsonb);
