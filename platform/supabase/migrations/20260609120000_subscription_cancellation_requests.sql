-- Subscription cancellation requests.
--
-- Therapists can't self-cancel in Stripe anymore: they fill out a long
-- cancellation questionnaire which lands here as a `pending` request. An admin
-- reviews the feedback, cancels the subscription manually in the Stripe
-- dashboard, then marks the request `completed`. This table is the feedback
-- ledger + the admin work queue.

create table if not exists public.subscription_cancellation_requests (
  id                      uuid primary key default gen_random_uuid(),
  therapist_id            uuid not null references public.user_roles(id) on delete cascade,
  status                  text not null default 'pending'
                            check (status in ('pending', 'completed', 'dismissed')),
  primary_reason          text,                      -- q1 answer, denormalised for fast admin scanning
  responses               jsonb not null,            -- full {questionId: answer} map
  stripe_subscription_id  text,                      -- snapshot at request time, so admin knows what to cancel
  tier_name               text,                      -- snapshot of the plan name
  admin_notes             text,
  processed_by            uuid references public.user_roles(id),
  processed_at            timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists subscription_cancellation_requests_status_idx
  on public.subscription_cancellation_requests (status, created_at desc);

create index if not exists subscription_cancellation_requests_therapist_idx
  on public.subscription_cancellation_requests (therapist_id);

alter table public.subscription_cancellation_requests enable row level security;

-- Therapists may file a request for themselves.
create policy "therapist_insert_own_cancellation_request"
  on public.subscription_cancellation_requests
  for insert
  with check (
    has_role('therapist') and therapist_id = (select auth.uid())
  );

-- Therapists may read their own requests.
create policy "therapist_select_own_cancellation_request"
  on public.subscription_cancellation_requests
  for select
  using (therapist_id = (select auth.uid()));

-- Admins may read every request (the work queue).
create policy "admin_select_cancellation_requests"
  on public.subscription_cancellation_requests
  for select
  using (has_role('admin'));

-- Admins may update status / notes after processing.
create policy "admin_update_cancellation_requests"
  on public.subscription_cancellation_requests
  for update
  using (has_role('admin'))
  with check (has_role('admin'));
