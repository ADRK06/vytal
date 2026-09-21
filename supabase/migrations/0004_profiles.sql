-- Username-based identity. auth.users still holds an email (an internally
-- generated `${username}@vytal.local` — see lib/username.ts), but this
-- table is what the app actually treats as the account's identity.

create table if not exists profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  -- Generated, not just an expression index, so PostgREST can filter on it
  -- directly (`.eq("username_lower", ...)`) without the caller having to
  -- reason about a SQL expression, and without the LIKE-wildcard footgun
  -- `ilike` would have on a username that legitimately contains `_`.
  username_lower text generated always as (lower(username)) stored,
  created_at timestamptz not null default now()
);

-- Case-insensitive uniqueness: "Alice" and "alice" are the same account.
create unique index if not exists profiles_username_lower_unique_idx
  on profiles (username_lower);

alter table profiles enable row level security;

-- Unlike email, a username is a public identifier by design — sign-up needs
-- to check availability, and sign-in needs to look one up, both before the
-- visitor has any session at all.
create policy "Anyone can look up usernames"
  on profiles for select
  using (true);

create policy "Users can create their own profile"
  on profiles for insert
  with check (auth.uid() = user_id);
