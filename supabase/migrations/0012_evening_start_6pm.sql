-- Mon–Fri: start times 6:00, 6:30, 7:00, 7:30 pm (third value = latest start;
-- close is 10:30 pm so a 3 h job starting 7:30 still fits). Sun: same as Mon–Fri. Sat unchanged.
update business_settings set working_hours = '{
  "mon": [["18:00","22:30","19:30"]],
  "tue": [["18:00","22:30","19:30"]],
  "wed": [["18:00","22:30","19:30"]],
  "thu": [["18:00","22:30","19:30"]],
  "fri": [["18:00","22:30","19:30"]],
  "sat": [["09:00","21:00"]],
  "sun": [["18:00","22:30","19:30"]]
}'::jsonb where id = 1;
