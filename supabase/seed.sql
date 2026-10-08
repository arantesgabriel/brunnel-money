-- Dados integralmente fictícios para desenvolvimento local.
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'gabriel@brunnel.local', crypt('brunnel-local', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Gabriel"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'brunna@brunnel.local', crypt('brunnel-local', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Brunna"}', now(), now())
on conflict (id) do nothing;

insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
values
  ('11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '{"sub":"11111111-1111-4111-8111-111111111111","email":"gabriel@brunnel.local"}', 'email', '11111111-1111-4111-8111-111111111111', now(), now(), now()),
  ('22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', '{"sub":"22222222-2222-4222-8222-222222222222","email":"brunna@brunnel.local"}', 'email', '22222222-2222-4222-8222-222222222222', now(), now(), now())
on conflict (provider_id, provider) do nothing;

insert into public.profiles(id, display_name) values
  ('11111111-1111-4111-8111-111111111111', 'Gabriel'),
  ('22222222-2222-4222-8222-222222222222', 'Brunna')
on conflict(id) do nothing;

insert into public.households(id, name, created_by) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Brunnel', '11111111-1111-4111-8111-111111111111')
on conflict(id) do nothing;

insert into public.household_memberships(household_id, user_id) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '22222222-2222-4222-8222-222222222222')
on conflict do nothing;

insert into public.categories(id,household_id,name,type,color,position,is_system,church_percentage,created_by) values
  ('c0000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Moradia','expense','blue',1,true,null,'11111111-1111-4111-8111-111111111111'),
  ('c0000000-0000-4000-8000-000000000002','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Alimentação','expense','green',2,true,null,'11111111-1111-4111-8111-111111111111'),
  ('c0000000-0000-4000-8000-000000000003','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Transporte','expense','cyan',3,true,null,'11111111-1111-4111-8111-111111111111'),
  ('c0000000-0000-4000-8000-000000000004','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Saúde','expense','red',4,true,null,'11111111-1111-4111-8111-111111111111'),
  ('c0000000-0000-4000-8000-000000000005','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Educação/Trabalho','expense','indigo',5,true,null,'11111111-1111-4111-8111-111111111111'),
  ('c0000000-0000-4000-8000-000000000006','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Igreja','expense','amber',6,true,.1,'11111111-1111-4111-8111-111111111111'),
  ('c0000000-0000-4000-8000-000000000007','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Lazer/Vida pessoal','expense','orange',7,true,null,'11111111-1111-4111-8111-111111111111'),
  ('c0000000-0000-4000-8000-000000000008','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Dívidas','expense','slate',8,true,null,'11111111-1111-4111-8111-111111111111'),
  ('c0000000-0000-4000-8000-000000000009','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Salário','income','green',9,true,null,'11111111-1111-4111-8111-111111111111'),
  ('c0000000-0000-4000-8000-000000000010','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Receita extra','income','green',10,true,null,'11111111-1111-4111-8111-111111111111'),
  ('c0000000-0000-4000-8000-000000000011','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Reembolso','income','cyan',11,true,null,'11111111-1111-4111-8111-111111111111')
on conflict(id) do nothing;

insert into public.accounts(id,household_id,name,type,institution,opening_balance,opening_balance_date,counts_as_reserve,created_by) values
  ('a0000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Santander','checking','Santander',4200,'2026-08-01',false,'11111111-1111-4111-8111-111111111111'),
  ('a0000000-0000-4000-8000-000000000002','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Mercado Pago','wallet','Mercado Pago',600,'2026-08-01',false,'11111111-1111-4111-8111-111111111111'),
  ('a0000000-0000-4000-8000-000000000003','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Dinheiro','cash',null,180,'2026-08-01',false,'11111111-1111-4111-8111-111111111111'),
  ('a0000000-0000-4000-8000-000000000004','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Reserva de Emergência','savings','Santander',7350,'2026-08-01',true,'11111111-1111-4111-8111-111111111111')
on conflict(id) do nothing;

insert into public.credit_cards(id,household_id,name,institution,holder_user_id,default_payment_account_id,closing_day,due_day,bank_limit,monthly_goal,network,last_four,created_by) values
  ('cc000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Santander','Santander','11111111-1111-4111-8111-111111111111','a0000000-0000-4000-8000-000000000001',7,12,23000,3000,'visa','2048','11111111-1111-4111-8111-111111111111')
on conflict(id) do nothing;

insert into public.credit_card_invoices(id,household_id,credit_card_id,reference_month,closing_date,due_date,status,closed_at,paid_at) values
  ('f0000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','cc000000-0000-4000-8000-000000000001','2026-07-01','2026-07-07','2026-07-12','paid','2026-07-08','2026-07-11'),
  ('f0000000-0000-4000-8000-000000000002','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','cc000000-0000-4000-8000-000000000001','2026-08-01','2026-08-07','2026-08-12','open',null,null),
  ('f0000000-0000-4000-8000-000000000003','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','cc000000-0000-4000-8000-000000000001','2026-09-01','2026-09-07','2026-09-12','open',null,null)
on conflict(id) do nothing;

insert into public.monthly_budgets(id,household_id,month,created_by) values
  ('b0000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','2026-08-01','11111111-1111-4111-8111-111111111111')
on conflict(id) do nothing;

insert into public.budget_lines(household_id,budget_id,category_id,allocated,church_percentage_enabled) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','b0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000001',1500,false),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','b0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000002',1000,false),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','b0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000003',700,false),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','b0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000004',200,false),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','b0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000005',650,false),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','b0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000006',900,true),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','b0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000007',800,false),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','b0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000008',400,false)
on conflict(budget_id,category_id) do nothing;

insert into public.transactions(id,household_id,kind,status,description,amount,occurrence_date,paid_at,competence_month,category_id,account_id,destination_account_id,credit_card_id,invoice_id,payment_method,essential,responsible_user_id,created_by,origin) values
  ('d0000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','income','paid','Salário Gabriel',6200,'2026-08-05','2026-08-05 12:00:00+00','2026-08-01','c0000000-0000-4000-8000-000000000009','a0000000-0000-4000-8000-000000000001',null,null,null,'pix',true,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','seed'),
  ('d0000000-0000-4000-8000-000000000002','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','income','pending','Salário Brunna',3800,'2026-08-08',null,'2026-08-01','c0000000-0000-4000-8000-000000000009','a0000000-0000-4000-8000-000000000001',null,null,null,'pix',true,'22222222-2222-4222-8222-222222222222','22222222-2222-4222-8222-222222222222','seed'),
  ('d0000000-0000-4000-8000-000000000003','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','expense','paid','Aluguel',1500,'2026-08-06','2026-08-06 12:00:00+00','2026-08-01','c0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001',null,null,null,'pix',true,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','seed'),
  ('d0000000-0000-4000-8000-000000000004','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','expense','pending','Mercado do mês',615,'2026-08-04',null,'2026-08-01','c0000000-0000-4000-8000-000000000002',null,null,'cc000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002','credit_card',true,'22222222-2222-4222-8222-222222222222','22222222-2222-4222-8222-222222222222','seed'),
  ('d0000000-0000-4000-8000-000000000005','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','expense','pending','Faculdade',650,'2026-08-03',null,'2026-08-01','c0000000-0000-4000-8000-000000000005',null,null,'cc000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002','credit_card',true,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','seed'),
  ('d0000000-0000-4000-8000-000000000006','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','expense','planned','Jantar de aniversário',280,'2026-08-23',null,'2026-08-01','c0000000-0000-4000-8000-000000000007',null,null,'cc000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000003','credit_card',false,'22222222-2222-4222-8222-222222222222','22222222-2222-4222-8222-222222222222','seed'),
  ('d0000000-0000-4000-8000-000000000007','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','transfer','paid','Aporte mensal',500,'2026-08-05','2026-08-05 13:00:00+00','2026-08-01',null,'a0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000004',null,null,'bank_transfer',true,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','seed')
on conflict(id) do nothing;

insert into public.savings_goals(id,household_id,name,account_id,target_amount,target_date,priority,created_by) values
  ('e0000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Reserva de emergência','a0000000-0000-4000-8000-000000000004',15000,'2027-06-30',1,'11111111-1111-4111-8111-111111111111')
on conflict(id) do nothing;

insert into public.weekly_food_budgets(household_id,month,starts_on,ends_on,allocated,created_by) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','2026-08-01','2026-08-01','2026-08-02',100,'11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','2026-08-01','2026-08-03','2026-08-09',225,'11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','2026-08-01','2026-08-10','2026-08-16',225,'11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','2026-08-01','2026-08-17','2026-08-23',225,'11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','2026-08-01','2026-08-24','2026-08-30',175,'11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','2026-08-01','2026-08-31','2026-08-31',50,'11111111-1111-4111-8111-111111111111')
on conflict(household_id,month,starts_on) do nothing;

do $$
declare budget_total numeric; member_count integer;
begin
  select sum(allocated) into budget_total from public.budget_lines where budget_id='b0000000-0000-4000-8000-000000000001';
  select count(*) into member_count from public.household_memberships where household_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  if budget_total <> 6150 then raise exception 'seed budget does not reconcile: %', budget_total; end if;
  if member_count <> 2 then raise exception 'seed household must have two members'; end if;
end $$;
