# Gabinete Online v2

Aplicação SaaS (frontend) para gestão de demandas de um gabinete, com foco em **offline-first** (IndexedDB como fonte local) e sincronização com uma **API REST externa**.

## Stack

- Frontend: Vite + React + TypeScript + Tailwind CSS
- Estado: Zustand
- Persistência local: IndexedDB (via `idb`)
- Validação: Zod + React Hook Form
- UI/UX: SweetAlert2, Lucide Icons, Swiper
- Gráficos/Mapa: ApexCharts, React Leaflet, JVectorMap

## Principais módulos

- Dashboard: métricas, gráficos e mapa demográfico
- Demandas: listagem, criação, edição, detalhes, Kanban, timeline e tratativas
- Contatos: cadastro e filtros (inclui espectro político)
- Membros: cadastro e papéis (roles)
- Configurações: categorias, urgências, status, tratativas, roles, espectro político e localização

## Arquitetura do repositório

```
src/
├── features/           # módulos por domínio (demands, contacts, members, settings, dashboard)
├── shared/             # componentes, layout, hooks, store, utils e serviços compartilhados
```

## Offline-first e sincronização

O frontend usa o IndexedDB como base local (para funcionar mesmo sem internet) e sincroniza com a API quando possível.

- IndexedDB: schema/upgrade e operações em [db.ts](file:///Users/maycrodrigues/Desktop/labs/gabinete-online-v2/src/shared/services/db.ts)
  - Stores principais: `demands`, `contacts`, `members`, `settings`
  - Itens possuem flag `synced` para controlar pendências de envio
- Sync: fila simples de pendências e push para API em [sync.ts](file:///Users/maycrodrigues/Desktop/labs/gabinete-online-v2/src/shared/services/sync.ts)
  - Envia itens não sincronizados e marca como sincronizado quando confirmado

## API

A API foi migrada para outro repositório. Este projeto assume uma API REST com base `/api/v1` (ajustável via `VITE_API_URL`), com endpoints esperados:

- `GET /demands`, `GET /demands/:id`, `POST /demands`
- `GET /members`, `POST /members`
- `GET /contacts`, `POST /contacts`
- `GET /settings`, `POST /settings`

## Variáveis de ambiente

### Frontend (Vite)

- `VITE_API_URL` (obrigatória em produção): base da API (ex.: `https://sua-api.dominio.com/api/v1`)

Exemplo: [.env.example](file:///Users/maycrodrigues/Desktop/labs/gabinete-online-v2/.env.example)

## Como rodar localmente

### 1) Instalar dependências

```bash
npm ci
```

### 2) Subir o frontend

Em outro terminal:

```bash
npm run dev
```

Opcionalmente, defina `VITE_API_URL` em `.env.local` para apontar para a API desejada.

## Debug / auditoria (Status do sistema)

Existe uma modal de status e auditoria de logs, acessível ao clicar **5x no logo**.

- Mostra status do app, base URL, pendências de sync e status de conexão com API
- Captura logs do console e erros globais (para auditoria) em [systemStatusStore.ts](file:///Users/maycrodrigues/Desktop/labs/gabinete-online-v2/src/shared/store/systemStatusStore.ts)
- UI da modal em [SystemStatusModal.tsx](file:///Users/maycrodrigues/Desktop/labs/gabinete-online-v2/src/shared/components/system/SystemStatusModal.tsx)

## Scripts

Definidos em [package.json](file:///Users/maycrodrigues/Desktop/labs/gabinete-online-v2/package.json):

- `npm run dev`: inicia o Vite
- `npm run build`: typecheck (`tsc -b`) + build do Vite
- `npm run preview`: preview do build
- `npm run lint`: ESLint

## Deploy e workflow (GitHub Pages + Release)

Workflow único em [deploy-pages.yml](file:///Users/maycrodrigues/Desktop/labs/gabinete-online-v2/.github/workflows/deploy-pages.yml):

- Dispara em `push` na branch `main` (e manualmente via `workflow_dispatch`)
- Build do Vite com:
  - `GITHUB_PAGES=true` (configura `base` no [vite.config.ts](file:///Users/maycrodrigues/Desktop/labs/gabinete-online-v2/vite.config.ts))
  - `VITE_API_URL` via variável do repositório (Actions Variables)
- Publica o artefato em GitHub Pages
- Cria uma **Release** após o deploy
  - Tag: `release-${GITHUB_RUN_NUMBER}`
  - Notas: tenta coletar commits desde a última tag `release-*` e inclui apenas mensagens no padrão:
    - `feat: ...`, `fix: ...`, `perf: ...`, `refactor: ...` (inclui variantes com escopo: `feat(demands): ...`)
  - Se não houver commits “relevantes”, usa um texto padrão

### Configuração obrigatória no repositório (Pages)

Em `Settings → Secrets and variables → Actions → Variables`, crie:

- `VITE_API_URL` = URL pública da sua API (ex.: `https://sua-api.dominio.com/api/v1`)

### Node.js 24 no GitHub Actions

O workflow está com opt-in para execução de actions em Node 24:

- `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true`

Isso antecipa a mudança de runtime anunciada pelo GitHub.
