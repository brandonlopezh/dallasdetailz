-- Earliest start on weekday/Sunday evenings is 6 pm (not 5 pm). Sat unchanged.
update business_settings set working_hours = '{
  "mon": [["18:00","21:00"]],
  "tue": [["18:00","21:00"]],
  "wed": [["18:00","21:00"]],
  "thu": [["18:00","21:00"]],
  "fri": [["18:00","21:00"]],
  "sat": [["09:00","21:00"]],
  "sun": [["18:00","21:00"]]
}'::jsonb where id = 1;
