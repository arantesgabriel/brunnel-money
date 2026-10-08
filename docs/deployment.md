# Checklist de deploy

## Local

1. Use Node 24 LTS e npm.
2. Copie `.env.example` para `.env.local` e rode `npx supabase start`.
3. Rode `npx supabase db reset` para aplicar migrations e o seed fictício.
4. Gere tipos com `npm run types:db`; revise o diff.
5. Rode `npm run verify`, `npm run test:db` e `npm run test:e2e`.

## Preview

1. Crie um projeto Supabase de desenvolvimento separado.
2. Aplique migrations revisadas com `supabase db push`; nunca durante request ou boot.
3. Configure URL, publishable key e URL pública no ambiente Preview da Vercel.
4. Cadastre o callback `https://<preview>/auth/callback` no Supabase Auth.
5. Desative `BRUNNEL_DEMO_MODE`; valide login, RLS, convite, exportação e importação.

## Production

1. Faça backup do Supabase de produção e teste a restauração em outro projeto.
2. Revise o SQL e aplique migrations antes da aplicação que depende delas.
3. Regere e confira os tipos; rode toda a verificação em Node 24.
4. Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `NEXT_PUBLIC_APP_URL`. Para habilitar o envio de convites, configure também `SUPABASE_SERVICE_ROLE_KEY` exclusivamente no ambiente server-side; ela nunca pode chegar ao navegador.
5. Cadastre domínio e callbacks de magic link/Google; faça deploy na Vercel.
6. Valide CSP, cookies, modo standalone, export e um fluxo financeiro pequeno.
7. Monitore logs sem valores, descrições, notas, tokens ou payloads financeiros.

Rollback da aplicação não desfaz migrations. Use migrations aditivas/reversíveis e um plano SQL separado, sempre validado numa restauração de teste.
