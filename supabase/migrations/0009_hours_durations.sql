-- Real working hours + job lengths.
-- Mon–Fri and Sun: evenings only (5 pm – 9 pm). Sat: 9 am – 9 pm.
update business_settings set working_hours = '{
  "mon": [["17:00","21:00"]],
  "tue": [["17:00","21:00"]],
  "wed": [["17:00","21:00"]],
  "thu": [["17:00","21:00"]],
  "fri": [["17:00","21:00"]],
  "sat": [["09:00","21:00"]],
  "sun": [["17:00","21:00"]]
}'::jsonb where id = 1;

-- Slot length, same for every vehicle size: Exterior 1 h, Interior 2 h, Full 3 h.
update service_pricing sp set duration_min = case s.category
    when 'exterior' then 60
    when 'interior' then 120
    when 'full' then 180
  end
from services s where s.id = sp.service_id;

update services set base_duration_min = case category
    when 'exterior' then 60
    when 'interior' then 120
    when 'full' then 180
  end;
