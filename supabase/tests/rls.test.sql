begin;
select plan(10);

select has_table('public', 'transactions', 'transactions exists');
select has_function('public', 'create_household', array['text','text'], 'atomic household function exists');
select has_function('public', 'accept_household_invitation', array['text'], 'secure invitation function exists');
select has_function('public', 'reallocate_budget', array['uuid','uuid','numeric','text'], 'atomic reallocation exists');
select policies_are('public', 'transactions', array['transactions_insert','transactions_select','transactions_update'], 'transactions has explicit policies and no hard-delete policy');
select col_is_pk('public', 'household_memberships', array['household_id','user_id'], 'membership is unique');
select col_has_check('public', 'transactions', 'amount', 'transaction amount is checked');
select indexes_are('public', 'transactions', array['transactions_pkey','transactions_household_competence_idx','transactions_invoice_idx','transactions_occurrence_idx','transactions_import_fingerprint_idx'], 'transaction access paths exist');
select has_column('public', 'credit_cards', 'network', 'credit card stores its network');
select has_column('public', 'credit_cards', 'last_four', 'credit card stores only its last four digits');

select * from finish();
rollback;
