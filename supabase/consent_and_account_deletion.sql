-- Memory Stamp — consent history + self-service account deletion
--
-- Run this once in the Supabase Dashboard → SQL Editor for this project.
-- It is additive only: it creates one new table and one new function, and
-- does not modify any existing table, policy, or data. Safe to re-run
-- (uses IF NOT EXISTS / CREATE OR REPLACE throughout).

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Append-only consent history
-- ─────────────────────────────────────────────────────────────────────────
-- One row per acceptance, never updated or deleted by the client — this is
-- what lets the app show/prove "which version of the Terms and Privacy
-- Policy did this user accept, and when," rather than a single overwritten
-- boolean.

create table if not exists public.user_consents (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  terms_version       text not null,
  privacy_version     text not null,
  source              text not null,        -- 'signup_email' | 'signup_google' | 'gate'
  client_recorded_at  timestamptz,           -- device-clock timestamp from the app; informational only
  consented_at        timestamptz not null default now(),  -- server timestamp; source of truth
  created_at          timestamptz not null default now()
);

create index if not exists user_consents_user_id_idx
  on public.user_consents (user_id, consented_at desc);

alter table public.user_consents enable row level security;

drop policy if exists "user_consents_select_own" on public.user_consents;
create policy "user_consents_select_own"
  on public.user_consents for select
  using (auth.uid() = user_id);

drop policy if exists "user_consents_insert_own" on public.user_consents;
create policy "user_consents_insert_own"
  on public.user_consents for insert
  with check (auth.uid() = user_id);

-- Deliberately no UPDATE/DELETE policy: history is immutable from the
-- client. Rows are only ever removed as a side effect of deleting the
-- owning user (see the ON DELETE CASCADE above), via delete_own_account().

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Self-service account deletion
-- ─────────────────────────────────────────────────────────────────────────
-- The anon/authenticated Supabase key the app ships with can never delete a
-- row from auth.users directly (that requires the service-role key, which
-- must never live in client code). This function runs with the privileges
-- of its owner (SECURITY DEFINER) so an authenticated user can delete only
-- their OWN account — auth.uid() is read from their own JWT, and the
-- function ignores any other id.
--
-- Storage objects (stamp photos, profile photo) are NOT deleted here —
-- deleting rows out of storage.objects via SQL only removes metadata, not
-- the physical files. The app deletes those client-side via the Storage
-- SDK (which does delete the physical files) BEFORE calling this function.

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.user_data where user_id = uid;
  -- user_consents rows cascade automatically via the FK's ON DELETE CASCADE
  -- once auth.users is deleted below — no separate delete needed here.

  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
