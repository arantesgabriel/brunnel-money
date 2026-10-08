alter table public.credit_cards
  add column network text,
  add column last_four char(4);

alter table public.credit_cards
  add constraint credit_cards_network_check
    check (network is null or network in ('visa', 'mastercard')),
  add constraint credit_cards_last_four_check
    check (last_four is null or last_four ~ '^[0-9]{4}$');

update public.credit_cards
set network = 'visa', last_four = '2048'
where id = 'cc000000-0000-4000-8000-000000000001'
  and network is null and last_four is null;

create unique index credit_cards_household_identity_idx
  on public.credit_cards(household_id, network, last_four)
  where archived_at is null and network is not null and last_four is not null;

comment on column public.credit_cards.network is
  'Card network selected by the user. MVP accepts Visa or Mastercard.';
comment on column public.credit_cards.last_four is
  'Only the final four digits are stored; full PAN must never be collected.';
