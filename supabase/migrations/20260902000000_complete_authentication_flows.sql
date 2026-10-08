create or replace function public.accept_household_invitation(raw_token text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  invitation public.household_invitations;
  user_email text;
  user_display_name text;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;

  select
    lower(email),
    coalesce(
      nullif(trim(raw_user_meta_data->>'display_name'), ''),
      split_part(lower(email), '@', 1)
    )
  into user_email, user_display_name
  from auth.users
  where id = auth.uid() and email_confirmed_at is not null;

  select *
  into invitation
  from public.household_invitations
  where token_hash = encode(extensions.digest(raw_token, 'sha256'), 'hex')
  for update;

  if invitation.id is null
    or invitation.expires_at <= now()
    or invitation.accepted_at is not null
    or invitation.revoked_at is not null
    or user_email is null
    or invitation.email_normalized <> user_email
  then
    raise exception 'invitation invalid';
  end if;

  perform 1
  from public.households
  where id = invitation.household_id
  for update;

  if (
    select count(*)
    from public.household_memberships
    where household_id = invitation.household_id and status = 'active'
  ) >= 2 then
    raise exception 'household already has two members';
  end if;

  insert into public.profiles(id, display_name)
  values (auth.uid(), user_display_name)
  on conflict (id) do nothing;

  insert into public.household_memberships(household_id, user_id)
  values (invitation.household_id, auth.uid())
  on conflict do nothing;

  update public.household_invitations
  set accepted_at = now(), accepted_by = auth.uid()
  where id = invitation.id;

  return invitation.household_id;
end $$;

revoke all on function public.accept_household_invitation(text) from public;
grant execute on function public.accept_household_invitation(text) to authenticated;
