create table public.survey_responses (
  id uuid not null default gen_random_uuid (),
  song_id text not null,
  mood_before integer not null,
  mood_after integer not null,
  energy_level integer not null,
  focus_level integer not null,
  comments text not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint survey_responses_pkey primary key (id),
  constraint survey_responses_energy_level_check check (
    (
      (energy_level >= 1)
      and (energy_level <= 5)
    )
  ),
  constraint survey_responses_focus_level_check check (
    (
      (focus_level >= 1)
      and (focus_level <= 5)
    )
  ),
  constraint survey_responses_mood_after_check check (
    (
      (mood_after >= 1)
      and (mood_after <= 5)
    )
  ),
  constraint survey_responses_mood_before_check check (
    (
      (mood_before >= 1)
      and (mood_before <= 5)
    )
  )
) TABLESPACE pg_default; 