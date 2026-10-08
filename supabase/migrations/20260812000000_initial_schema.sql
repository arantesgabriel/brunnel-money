create extension if not exists pgcrypto with schema extensions;

create type public.household_role as enum ('admin');
create type public.membership_status as enum ('active', 'inactive');
create type public.category_type as enum ('income', 'expense', 'both');
create type public.account_type as enum ('checking', 'wallet', 'cash', 'savings', 'investment');
create type public.transaction_kind as enum ('income', 'expense', 'transfer');
create type public.transaction_status as enum ('planned', 'pending', 'paid');
create type public.payment_method as enum ('credit_card', 'debit_card', 'pix', 'cash', 'bank_transfer', 'other');
create type public.invoice_status as enum ('open', 'closed', 'paid');
create type public.month_status as enum ('open', 'closed');
create type public.import_status as enum ('preview', 'completed', 'failed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (length(trim(display_name)) between 1 and 100),
  avatar_url text,
  locale text not null default 'pt-BR',
  timezone text not null default 'America/Sao_Paulo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 100),
  currency char(3) not null default 'BRL',
  timezone text not null default 'America/Sao_Paulo',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id)
);

create table public.household_memberships (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.household_role not null default 'admin',
  status public.membership_status not null default 'active',
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table public.household_invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  email_normalized text not null check (email_normalized = lower(trim(email_normalized))),
  token_hash text not null unique,
  created_by uuid not null references auth.users(id),
  expires_at timestamptz not null default (now() + interval '72 hours'),
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id),
  name text not null,
  normalized_name text generated always as (lower(trim(name))) stored,
  parent_id uuid references public.categories(id),
  type public.category_type not null,
  color text,
  position integer not null default 0,
  is_system boolean not null default false,
  church_percentage numeric(5,4) check (church_percentage between 0 and 1),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique nulls not distinct (household_id, parent_id, normalized_name, archived_at)
);

create table public.tags (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id),
  name text not null, normalized_name text generated always as (lower(trim(name))) stored, color text,
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  unique nulls not distinct (household_id, normalized_name, archived_at)
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id),
  name text not null, type public.account_type not null, institution text,
  opening_balance numeric(14,2) not null default 0, opening_balance_date date not null default current_date,
  counts_as_reserve boolean not null default false, active boolean not null default true,
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  unique (household_id, name)
);

create table public.account_adjustments (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id), account_id uuid not null references public.accounts(id),
  amount numeric(14,2) not null check (amount <> 0), occurred_on date not null, reason text not null check (length(trim(reason)) > 2),
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now()
);

create table public.credit_cards (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id), name text not null, institution text,
  holder_user_id uuid references auth.users(id), default_payment_account_id uuid references public.accounts(id),
  closing_day smallint not null check (closing_day between 1 and 31), due_day smallint not null check (due_day between 1 and 31),
  bank_limit numeric(14,2) check (bank_limit > 0), monthly_goal numeric(14,2) check (monthly_goal > 0), active boolean not null default true,
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  unique (household_id, name)
);

create table public.credit_card_invoices (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id), credit_card_id uuid not null references public.credit_cards(id),
  reference_month date not null check (extract(day from reference_month) = 1), closing_date date not null, due_date date not null,
  status public.invoice_status not null default 'open', closed_at timestamptz, paid_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (credit_card_id, reference_month)
);

create table public.transaction_series (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id), description text not null,
  amount numeric(14,2) not null check (amount > 0), interval_months smallint not null default 1 check (interval_months > 0), desired_day smallint not null check (desired_day between 1 and 31),
  starts_on date not null, ends_on date, initial_status public.transaction_status not null, template jsonb not null default '{}'::jsonb,
  active boolean not null default true, last_generated_month date, created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.installment_plans (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id), credit_card_id uuid not null references public.credit_cards(id),
  total_amount numeric(14,2) not null check (total_amount > 0), installment_count smallint not null check (installment_count between 2 and 120),
  first_invoice_month date not null check (extract(day from first_invoice_month) = 1), description text not null,
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.import_batches (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id), file_name text not null,
  sha256 text not null, status public.import_status not null default 'preview', row_count integer not null default 0 check (row_count between 0 and 10000),
  imported_count integer not null default 0, error_summary jsonb not null default '[]'::jsonb,
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), completed_at timestamptz,
  unique (household_id, sha256)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id),
  kind public.transaction_kind not null, status public.transaction_status not null, description text not null check (length(trim(description)) between 1 and 200),
  amount numeric(14,2) not null check (amount > 0), occurrence_date date not null, due_date date, paid_at timestamptz,
  competence_month date not null check (extract(day from competence_month) = 1), category_id uuid references public.categories(id),
  account_id uuid references public.accounts(id), destination_account_id uuid references public.accounts(id), credit_card_id uuid references public.credit_cards(id), invoice_id uuid references public.credit_card_invoices(id),
  payment_method public.payment_method not null, essential boolean not null default false, responsible_user_id uuid not null references auth.users(id), created_by uuid not null references auth.users(id),
  notes text, series_id uuid references public.transaction_series(id), installment_plan_id uuid references public.installment_plans(id),
  installment_number smallint, installment_count smallint, reimbursement_for_id uuid references public.transactions(id), reversal_of_id uuid references public.transactions(id),
  origin text not null default 'manual' check (origin in ('manual','recurrence','installment','import','seed')),
  import_batch_id uuid references public.import_batches(id), import_fingerprint text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, deleted_by uuid references auth.users(id),
  constraint paid_timestamp check ((status = 'paid' and paid_at is not null) or (status <> 'paid' and paid_at is null)),
  constraint transfer_shape check ((kind = 'transfer' and account_id is not null and destination_account_id is not null and account_id <> destination_account_id and category_id is null and credit_card_id is null and invoice_id is null and payment_method = 'bank_transfer') or kind <> 'transfer'),
  constraint card_shape check ((payment_method = 'credit_card' and credit_card_id is not null and invoice_id is not null) or payment_method <> 'credit_card'),
  constraint category_shape check ((kind in ('income','expense') and category_id is not null) or kind = 'transfer'),
  constraint installment_shape check ((installment_plan_id is null and installment_number is null and installment_count is null) or (installment_plan_id is not null and installment_number between 1 and installment_count)),
  constraint one_credit_link check (num_nonnulls(reimbursement_for_id, reversal_of_id) <= 1)
);

create table public.transaction_tags (
  household_id uuid not null references public.households(id), transaction_id uuid not null references public.transactions(id) on delete cascade,
  tag_id uuid not null references public.tags(id), primary key (transaction_id, tag_id)
);

create table public.invoice_payments (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id), invoice_id uuid not null references public.credit_card_invoices(id),
  account_id uuid not null references public.accounts(id), amount numeric(14,2) not null check (amount > 0), paid_on date not null,
  notes text, created_by uuid not null references auth.users(id), created_at timestamptz not null default now()
);

create table public.financial_months (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id), month date not null check (extract(day from month) = 1),
  status public.month_status not null default 'open', closed_at timestamptz, closed_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (household_id, month)
);

create table public.monthly_budgets (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id), month date not null check (extract(day from month) = 1),
  attention_threshold numeric(5,4) not null default .8, critical_threshold numeric(5,4) not null default 1,
  copied_from uuid references public.monthly_budgets(id), created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (household_id, month)
);

create table public.budget_lines (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id), budget_id uuid not null references public.monthly_budgets(id) on delete cascade,
  category_id uuid not null references public.categories(id), allocated numeric(14,2) not null check (allocated >= 0),
  church_percentage_enabled boolean not null default false, manual_override numeric(14,2) check (manual_override >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (budget_id, category_id)
);

create table public.budget_reallocations (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id), budget_id uuid not null references public.monthly_budgets(id),
  from_category_id uuid not null references public.categories(id), to_category_id uuid not null references public.categories(id), amount numeric(14,2) not null check (amount > 0),
  reason text, created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), check (from_category_id <> to_category_id)
);

create table public.savings_goals (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id), name text not null, account_id uuid not null references public.accounts(id),
  target_amount numeric(14,2) not null check (target_amount > 0), target_date date, priority smallint not null default 0, active boolean not null default true, completed_at timestamptz,
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, deleted_by uuid references auth.users(id)
);

create table public.weekly_food_budgets (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id), month date not null check (extract(day from month) = 1),
  starts_on date not null, ends_on date not null, allocated numeric(14,2) not null check (allocated >= 0), created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (starts_on <= ends_on), unique (household_id, month, starts_on)
);

create table public.audit_logs (
  id bigint generated always as identity primary key, household_id uuid not null references public.households(id), actor_id uuid not null references auth.users(id),
  action text not null, entity_type text not null, entity_id text not null, changed_fields jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

do $$ declare table_name text; begin
  foreach table_name in array array['profiles','households','categories','tags','accounts','credit_cards','credit_card_invoices','transaction_series','installment_plans','transactions','financial_months','monthly_budgets','budget_lines','savings_goals','weekly_food_budgets'] loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name);
  end loop;
end $$;

create or replace function public.is_household_member(target_household uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.household_memberships hm where hm.household_id = target_household and hm.user_id = auth.uid() and hm.status = 'active')
$$;
revoke all on function public.is_household_member(uuid) from public;
grant execute on function public.is_household_member(uuid) to authenticated;

create or replace function public.create_household(household_name text, display_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare new_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  insert into public.profiles(id, display_name) values(auth.uid(), trim(display_name)) on conflict(id) do update set display_name = excluded.display_name;
  insert into public.households(name, created_by) values(trim(household_name), auth.uid()) returning id into new_id;
  insert into public.household_memberships(household_id, user_id) values(new_id, auth.uid());
  return new_id;
end $$;
revoke all on function public.create_household(text,text) from public;
grant execute on function public.create_household(text,text) to authenticated;

create or replace function public.accept_household_invitation(raw_token text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare invitation public.household_invitations; user_email text;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  select lower(email) into user_email from auth.users where id = auth.uid() and email_confirmed_at is not null;
  select * into invitation from public.household_invitations where token_hash = encode(extensions.digest(raw_token, 'sha256'), 'hex') for update;
  if invitation.id is null or invitation.expires_at <= now() or invitation.accepted_at is not null or invitation.revoked_at is not null or invitation.email_normalized <> user_email then
    raise exception 'invitation invalid';
  end if;
  insert into public.household_memberships(household_id, user_id) values(invitation.household_id, auth.uid()) on conflict do nothing;
  update public.household_invitations set accepted_at = now(), accepted_by = auth.uid() where id = invitation.id;
  return invitation.household_id;
end $$;
revoke all on function public.accept_household_invitation(text) from public;
grant execute on function public.accept_household_invitation(text) to authenticated;

create or replace function public.reallocate_budget(source_line uuid, destination_line uuid, transfer_amount numeric, transfer_reason text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare source public.budget_lines; destination public.budget_lines;
begin
  select * into source from public.budget_lines where id = source_line for update;
  select * into destination from public.budget_lines where id = destination_line for update;
  if not public.is_household_member(source.household_id) or source.household_id <> destination.household_id or source.budget_id <> destination.budget_id or transfer_amount <= 0 or source.allocated < transfer_amount then raise exception 'invalid reallocation'; end if;
  update public.budget_lines set allocated = allocated - transfer_amount where id = source_line;
  update public.budget_lines set allocated = allocated + transfer_amount where id = destination_line;
  insert into public.budget_reallocations(household_id,budget_id,from_category_id,to_category_id,amount,reason,created_by) values(source.household_id,source.budget_id,source.category_id,destination.category_id,transfer_amount,transfer_reason,auth.uid());
end $$;
revoke all on function public.reallocate_budget(uuid,uuid,numeric,text) from public;
grant execute on function public.reallocate_budget(uuid,uuid,numeric,text) to authenticated;

alter table public.profiles enable row level security;
create policy profiles_select on public.profiles for select to authenticated using (id = auth.uid() or exists(select 1 from public.household_memberships mine join public.household_memberships theirs using(household_id) where mine.user_id = auth.uid() and mine.status = 'active' and theirs.user_id = profiles.id and theirs.status = 'active'));
create policy profiles_insert on public.profiles for insert to authenticated with check (id = auth.uid());
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

alter table public.households enable row level security;
create policy households_select on public.households for select to authenticated using (public.is_household_member(id));
create policy households_update on public.households for update to authenticated using (public.is_household_member(id)) with check (public.is_household_member(id));

alter table public.household_memberships enable row level security;
create policy memberships_select on public.household_memberships for select to authenticated using (public.is_household_member(household_id));
create policy memberships_update on public.household_memberships for update to authenticated using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));

do $$ declare table_name text; begin
  foreach table_name in array array['household_invitations','categories','tags','accounts','account_adjustments','credit_cards','credit_card_invoices','transaction_series','installment_plans','import_batches','transactions','transaction_tags','invoice_payments','financial_months','monthly_budgets','budget_lines','budget_reallocations','savings_goals','weekly_food_budgets','audit_logs'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_household_member(household_id))', table_name || '_select', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_household_member(household_id))', table_name || '_insert', table_name);
    execute format('create policy %I on public.%I for update to authenticated using (public.is_household_member(household_id)) with check (public.is_household_member(household_id))', table_name || '_update', table_name);
  end loop;
end $$;

create index memberships_user_active_idx on public.household_memberships(user_id, household_id) where status = 'active';
create index transactions_household_competence_idx on public.transactions(household_id, competence_month, status) where deleted_at is null;
create index transactions_invoice_idx on public.transactions(invoice_id) where deleted_at is null;
create index transactions_occurrence_idx on public.transactions(household_id, occurrence_date) where deleted_at is null;
-- Apenas linhas realmente importadas participam da idempotência. NULL representa
-- origem manual/recorrência/seed e, portanto, pode aparecer em muitas linhas.
create unique index transactions_import_fingerprint_idx
  on public.transactions(household_id, import_batch_id, import_fingerprint)
  where import_batch_id is not null and import_fingerprint is not null;
create index categories_household_parent_idx on public.categories(household_id, parent_id);
create index invoices_household_due_idx on public.credit_card_invoices(household_id, due_date, status);
create index audit_household_created_idx on public.audit_logs(household_id, created_at desc);

comment on function public.create_household(text,text) is 'Creates household, profile and first admin membership atomically; validates auth.uid internally.';
comment on function public.accept_household_invitation(text) is 'Consumes a single-use SHA-256 invitation token only when the verified user email matches.';
comment on function public.reallocate_budget(uuid,uuid,numeric,text) is 'Moves budget allocation atomically without changing the total or allowing a negative source.';
