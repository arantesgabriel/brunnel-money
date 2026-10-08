# Brunnel Finanças

Aplicação web/PWA para planejamento financeiro pessoal e familiar. O painel responde primeiro quanto da renda já está comprometido e quanto ainda pode ser gasto com segurança. O modelo distingue ocorrência de competência, planejamento de compromisso e pagamento, transferência de despesa, compra de cartão de pagamento de fatura e reembolso de estorno.

Esta primeira versão inclui interface responsiva completa com demonstração fictícia, domínio financeiro testado, autenticação Supabase por magic link/Google, onboarding/família, migrations PostgreSQL com RLS, seed local, importador `.xlsx` server-only com prévia, export JSON/CSV e PWA online-first.

## Stack e requisitos

- Node.js 24 LTS (`engines.node: 24.x`) e npm;
- Next.js 16.2.12, React 19.2.8 e TypeScript 5.9.3 strict;
- Tailwind CSS 4.3.3, componentes próprios inspirados nas primitivas shadcn;
- Supabase Auth/PostgreSQL/RLS/CLI, sem ORM;
- Vitest 4.1.10, pgTAP e Playwright 1.62.1;
- Docker Desktop para o Supabase local.

## Instalação rápida

```bash
nvm install 24
nvm use 24
npm install
cp .env.example .env.local
npx supabase start
npx supabase db reset
npm run dev
```

Abra `http://localhost:3000`. Para navegar imediatamente sem Supabase, mantenha `BRUNNEL_DEMO_MODE=true`. Esse adapter existe apenas para desenvolvimento local; Preview e Production devem usar `false`.

## Variáveis

- `NEXT_PUBLIC_SUPABASE_URL`: URL local ou do projeto Supabase.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: chave pública/anon; pode ir ao navegador.
- `SUPABASE_SERVICE_ROLE_KEY`: somente ações server-side de convite e scripts/seed explicitamente controlados. Ela nunca pode ter prefixo `NEXT_PUBLIC_` e nunca é enviada ao navegador.
- `NEXT_PUBLIC_APP_URL`: origem canônica para callbacks.
- `BRUNNEL_DEMO_MODE`: `true` somente local; não configure em produção.

Nunca versione `.env.local`. O service role não deve aparecer em bundle, HTML, logs ou variáveis públicas.

## Banco, migrations e tipos

`supabase/migrations` é a fonte única de verdade. O schema usa UUID, `numeric(14,2)`, datas civis, competências normalizadas, constraints, índices, funções transacionais e RLS por membership ativa.

```bash
npx supabase start
npx supabase db reset
npm run types:db
npm run test:db
```

O reset aplica `supabase/seed.sql`, que cria dados fictícios determinísticos. Após alterar schema, gere os tipos e revise o diff; o arquivo no repositório é um subconjunto tipado suficiente para o app antes do primeiro reset.

### Usuários exclusivamente locais

- `gabriel@brunnel.local` / `brunnel-local`
- `brunna@brunnel.local` / `brunnel-local`

Ambos pertencem à família fictícia Brunnel como administradores. Nunca replique essas contas em produção.

## Autenticação

Magic link é o caminho principal. No Supabase, configure Site URL e redirects:

- Local: `http://localhost:3000/auth/callback` e `http://127.0.0.1:3000/auth/callback`;
- Preview: `https://<preview>.vercel.app/auth/callback`;
- Produção: `https://<dominio>/auth/callback`.

Para Google, crie credenciais OAuth no Google Cloud, ative o provider no Supabase e use a callback informada pelo painel Supabase. A UI usa `signInWithOAuth`; secrets ficam no provedor, nunca no repositório. Magic link e convites devem apontar para a rota correta e preservar `next`. Para enviar convites, configure também `SUPABASE_SERVICE_ROLE_KEY` apenas no ambiente server-side; o app usa `inviteUserByEmail` e nunca expõe essa chave. Mensagens de login são neutras e não confirmam a existência de e-mails.

## Verificação

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
npm run verify
npm run test:db
npx playwright install chromium webkit
npm run test:e2e
npm audit --omit=dev
```

Os testes unitários cobrem BRL/centavos, ciclo de fatura, competência, parcelas, recorrência, orçamento, status, valor seguro, conta, fatura, Igreja, semanas e CSV seguro. pgTAP verifica a estrutura e políticas; E2E cobre a promessa central, navegação e política PWA.

### Resultado desta entrega (12/08/2026)

- `npm run verify`: passou (format, lint, typecheck, 14 testes unitários e build de produção);
- `npm run test:e2e`: 6/6 passaram em Chromium desktop e WebKit/iPhone;
- `npm audit`: zero vulnerabilidades em produção e desenvolvimento;
- QA visual: 320 px e 1440 px sem overflow; alvos interativos visíveis com mínimo de 44 px;
- `npm run test:db`: pendente porque o Docker Desktop não estava em execução no ambiente da entrega. Rode após iniciar o daemon e execute `npx supabase start`.

O ambiente da entrega tinha Node 25.2.1 e exibiu o aviso esperado de `engines`; build/testes passaram, mas Node 24.x continua sendo a versão suportada e obrigatória para CI/deploy.

## Importação da planilha

Configurações → Importar planilha executa quatro passos: enviar `.xlsx` (máximo 5 MB/10 mil linhas), analisar server-side, revisar e confirmar. O parser lê dados, nunca macros/fórmulas como código. Abas/colunas são reconhecidas sem depender de acentos e espaços. O hash SHA-256 do arquivo e fingerprints por linha suportam idempotência.

`Planejado`, `Pendente` e `Pago` têm mapeamento direto. `Lançado` é ambíguo: a revisão propõe pendente para crédito e pago para débito/Pix/dinheiro, sem vínculo silencioso. Reembolsos de baixa confiança também exigem revisão. A prévia já está operacional; a confirmação persistente deve ser usada com Supabase configurado e uma sessão recente.

## Exportação e backup

- `/api/export?format=json`: snapshot portátil;
- `/api/export?format=csv`: lançamentos CSV com neutralização de formula injection.

Além da exportação do app, faça dump periódico:

```bash
supabase db dump --project-ref <ref> --file backup.sql
```

Restaure sempre primeiro num projeto de teste com `psql`; valide contagens, memberships, RLS e totais antes de considerar o backup utilizável. O free tier pode pausar por inatividade e não substitui política própria de backup.

## PWA e celular

No iPhone: abra no Safari → Compartilhar → Adicionar à Tela de Início → Abrir como App da Web. No Android, use “Instalar app” no menu do navegador quando disponível. Não exige Apple Developer Program.

O service worker é online-first e mínimo: cacheia apenas fallback offline, manifest e ícones. Nunca cacheia HTML autenticado, Supabase, rotas financeiras, import ou export; não há escrita offline, fila ou sincronização em segundo plano. Uma atualização é aplicada após o navegador instalar a nova versão do worker.

## Segurança

- RLS em todas as tabelas expostas, baseada em membership ativa no `household_id`;
- funções `security definer` com `search_path` vazio, grants mínimos e validação interna;
- inputs mutáveis validados no servidor com Zod;
- respostas financeiras `private, no-store`, headers CSP/nosniff/referrer/permissions/frame;
- soft delete e trilha de auditoria sem secrets/PII financeira em logs;
- import limitado, server-only e sem execução de conteúdo; export CSV seguro;
- atualização concorrente baseada em `updated_at` deve rejeitar sobrescrita obsoleta nos fluxos sensíveis.

## Deploy

Use um projeto Vercel e projetos Supabase separados para desenvolvimento/produção quando possível. A ordem segura é: backup → migrations revisadas → tipos → testes/build → deploy da aplicação. Migrations nunca rodam em request ou boot. O passo a passo completo está em [docs/deployment.md](docs/deployment.md).

## Decisões e limites

É um monólito Next.js, sem ORM, microserviços ou estado global de dados. O PostgreSQL preserva relações/invariantes; o domínio TypeScript usa centavos. A interface usa uma família ativa e RLS deixa o schema pronto para isolamento futuro.

Não há Open Finance, conciliação bancária, múltiplas moedas, dados privados, OCR, push, escrita offline ou app nativo. A projeção não inventa inflação/juros. A prévia de importação e a base transacional estão prontas; a confirmação de todos os mapeamentos históricos, a cobertura integral dos fluxos E2E e o expurgo permanente após 30 dias são extensões conhecidas antes de produção familiar real.

## Troubleshooting

- Link expirado: gere novo magic link e confira Site URL/redirects.
- Cookie não persiste: use HTTPS em Preview/Production e confira domínio do callback; `proxy.ts` renova a sessão.
- RLS retorna vazio: confirme membership `active`, `auth.uid()` e projeto/chave do mesmo ambiente.
- Google/CORS: confira origem autorizada no Google e redirect exato no Supabase.
- E-mail local: veja Inbucket em `http://localhost:54324` após `supabase start`.
- Projeto pausado: restaure o Supabase no dashboard, aguarde e valide health/auth; isso não recupera backup ausente.
- Node: o desenvolvimento e CI devem usar 24.x. Versões 25 podem instalar com `EBADENGINE` e não são a base suportada.

Veja também [PRODUCT.md](PRODUCT.md), [DESIGN.md](DESIGN.md) e [docs/data-model.md](docs/data-model.md).
