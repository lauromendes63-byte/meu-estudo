# Meu Estudo — Contexto do Projeto & Diretrizes Arquiteturais (v3.0.0)

Este arquivo preserva todo o histórico de decisões visuais, técnicas e de UX tomadas ao longo do desenvolvimento do **Meu Estudo** (Caderno Pessoal de Estudos Médicos com Revisões Espaçadas `D+1`, `D+7`, `D+30` e Gestão de Provas), otimizado para o **Samsung Galaxy A54 (120Hz, Offline-First PWA)**.

---

## 1. Regras de Ouro (O que NUNCA deve ser quebrado ou alterado sem pedido explícito)

1. **Identidade Visual Editorial Minimalista Claro (`#F7F6F3`) & Azul Marinho Cirúrgico (`#162654`):**
   - **Superfícies:** Canvas editorial claro (`#F7F6F3`), cards brancos planos (`#FFFFFF`) com bordas hairline (`1px solid #E7E5DF`) e elevação sutil sem gradientes pesados nem sombreamento excessivo.
   - **Tipografia Empacotada Offline (`@fontsource`):** `Plus Jakarta Sans` para marca do cabeçalho, títulos de seção, leitura e controles de UI (sem distorção vertical), e `JetBrains Mono` (`tabular-nums`) para badges numéricos, percentuais, numeração de aulas e cronômetros.
   - **Ícone Oficial (`public/icon.svg`, PNGs adaptativos & Brasão do App):** Emblema minimalista **Caderno Médico + Pulso Clínico** (capa dura Azul Marinho `#162654` com lombada tonal, bloco de páginas em `#ECEFF6`, marcador editorial e traço de ECG P-QRS-T) sobre fundo `#F7F6F3` plano full-bleed em `public/icon.svg`, `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-192.png`, `public/icon-maskable-512.png` (safe zone <= 66%) e `public/apple-touch-icon.png`, com `manifest.json` usando exclusivamente PNGs (`id: "./"`, `start_url: "./"`, `scope: "./"`) para máxima compatibilidade WebAPK no Android.
   - **Azul Marinho (`#162654`):** Reservado de forma cirúrgica para CTAs primários, brasão editorial, borda de foco `:focus-visible` (contraste >= 3:1), indicador ativo no Dock flutuante inferior e marcadores conceituais; zero emojis caricatos na interface.
2. **Barra Superior Editorial & Dock Flutuante Inferior:**
   - Cabeçalho leve sobre o canvas com botão de busca global à esquerda, brasão + título `Meu Estudo` (`Med`) + status ao vivo no centro e configurações à direita.
   - Navegação inferior em **Floating Minimal Dock** (`#app-dock`) translúcido com indicador deslizante CSS (`Módulos`, `Estudo`, `Provas`), ponto indicador vermelho de revisões (`#nav-rev-dot`) e contador de provas próximas (`#nav-provas-badge`).
3. **Arquitetura Modular ES + Vite 100% Offline-First:**
   - Zero CDNs externos de runtime (`dist/index.html` 100% autossuficiente com CSS em camadas `@layer reset, tokens, base, components, motion, utilities`, JS modular e fontes `.woff/.woff2` locais).
   - Código-fonte separado em domínio puro (`src/domain/*`), iconografia (`src/icons/*`), infraestrutura UI/gestos/reconciliação (`src/ui/*`), views modulares (`src/ui/views/*`) e atualizador PWA (`src/pwa/updater.js`), com `public/` como fonte única de `manifest.json`, `icon.svg`, `sw.js` e `version.json`.
   - `vite.config.js` injeta `__APP_VERSION__` / `__BUILD_TIME__` e gera `PRECACHE_ASSETS` automaticamente em `dist/sw.js`.
   - **Zero `innerHTML` em conteúdo do usuário:** Notas clínicas são convertidas por `buildNotesFragment` em nós DOM puros (`createTextNode`), protegendo contra XSS.
4. **Sistema de Ícones Médicos (`32x32` Traço Arquitetônico Ink `#162654` + Pastel Duotone):**
   - Todos os **26** ícones anatômicos médicos utilizam traço arquitetônico preciso em Azul Marinho (`#162654`) com preenchimento pastel suave via `currentColor` sobre squircles claros com borda hairline `1px`.
   - Chaves legadas (`joint`, `general`, `brain` em módulos de Psiquiatria/Mental) migram de forma determinística via `canonicalizeIconKey` e são normalizadas na inicialização mantendo 100% de compatibilidade com `meu_estudo_data_v1`.
5. **Fluxo de Cadastro, Acessibilidade & Reconciliação DOM:**
   - **Smart Auto-Match:** Sugere ícone e cor automaticamente ao digitar o nome do eixo/módulo.
   - **Lista por Padrão (`meu_estudo_view_mode_v2` = `'list'`) & Botão Único na Matéria:** Alternável com Grade em 2 colunas; no detalhe (`#tab-modulo-detail`) permanece um único botão `+ Adicionar Aula` (`#btn-add-lesson-in-module`).
   - **Botões Sem Aninhamento Interativo:** Cards de módulo, aula e itens de revisão utilizam `<button class="card-open-trigger">` com overlay CSS (`::after`), mantendo ações laterais (`+`, `Editar`, `Estudada`, `Concluir D+x`) como controles irmãos independentes em `z-index: 2`.
   - **Folha de Nova Aula (`#sheet-lesson`):** Seletor numérico integrado (`-`/`+`), `input` >= `16px` (`max(1rem, 1em)`) para impedir zoom automático no iOS/Android, pílulas clínicas rápidas (`Alerta`, `Padrão-Ouro`, `Fisiopato`, `Diagnóstico`, `Conduta`, `Conceito`) e botão `Salvar e +1`.
6. **Ergonomia Mobile, 120Hz & Física por Velocidade (v3.0.0):**
   - **Navegação Lateral por Arrasto (`attachTabSwipe`) & Master -> Detail Direcional:** Arrasto horizontal no workspace principal navega entre `Módulos ↔ Estudo ↔ Provas` com física responsiva (respeitando bordas Android de 24px, `.SwipeableList-track` e trilhos roláveis); `document.startViewTransition` com `types: ['forward' | 'backward']` + retorno interativo por arrasto da borda esquerda (`attachMasterDetailSwipeBack`).
   - **Provas Multi-Módulo & Cadastro Ágil (`#modal-exam`):** Suporte a múltiplos módulos (`moduleIds` + `moduleId` legado) com chips multi-seleção, atalhos rápidos de data (`Amanhã`, `+7 dias`, `+14 dias`, `+30 dias`), nome digitado livremente e seleção manual de aulas agrupadas por módulo.
   - **Sheets & Dialogs Nativos Top-Layer:** `<dialog closedby="any">` com `@starting-style` + `transition-behavior: allow-discrete` + `[data-closing]` fallback, prevenção de scroll chaining (`overscroll-behavior: contain`), e arrasto vertical interruptível por velocidade via Web Animations API + `setPointerCapture` (`attachSheetDrag`).
   - **Swipe-to-Complete (`SwipeableList`):** CSS Scroll Snap horizontal com `IntersectionObserver` (sem interceptar `touchmove` na main thread) em `Para Revisar` e `Para Estudar`, sempre pareado com botão acessível visível, anúncio em região `role="status"` e Toast com **Desfazer (1 toque)**.
   - Preservação de rolagem por aba e pilha de histórico 1-para-1 alinhada ao botão Voltar físico do Android (inclusive em *light-dismiss* de `<dialog>`).

---

## 2. Histórico de Versões Recentes (Git Log)
- **v3.0.0 (11/11/2026):** Remake completo da interface e arquitetura: migração do monólito para arquitetura modular ES + Vite (`src/domain`, `src/icons`, `src/ui`, `src/styles`, `src/pwa`) 100% livre de CDN externo; estética **Editorial Minimalista Claro (`#F7F6F3`)** com `Plus Jakarta Sans` + `JetBrains Mono` empacotadas; redesign dos 26 ícones anatômicos em traço `#162654` duotone; reconciliação cirúrgica de DOM (`reconcileKeyedList`); `<dialog>` top-layer com `@starting-style` + física interruptível via WAAPI + swipe-to-complete via CSS Scroll Snap + navegação horizontal por swipe entre abas + provas multi-módulo com atalhos de data + View Transitions direcionais; e suíte automatizada Vitest (unitário) + Edge/Playwright headless (E2E mobile Galaxy A54 + desktop).
- **v2.5.1 (23/10/2026):** Correção do loop no banner de atualização (`version.json`), limpeza agressiva de cache HTTP e botão de fechar (`✕`) no banner flutuante.
- **v2.5.0 (23/10/2026):** Ícone full-bleed adaptativo para Android One UI, transições laterais One UI a 120Hz no detalhe do módulo, física elástica com arrasto contínuo no Bottom Sheet (`#sheet-lesson`) e celebrações nas revisões.
- **v2.4.0 – v2.4.3 (08/10/2026):** Novo sistema de ícones 3D, visualização em Lista por padrão nos Módulos, botão único `+ Adicionar Aula`, correção da pilha de histórico 1-para-1 e redesenho do modal de aula.
- **v2.0.0 – v2.3.2 (04–08/10/2026):** Identidade Azul Marinho (`#162654`), busca rápida global, Toast com Desfazer (Undo), filtros por status, sincronização bidirecional Prova ↔ Aula e Smart Auto-Match.
- **v1.0.0 – v1.7.0 (25/09/2026):** Criação do PWA offline-first com revisões espaçadas `D+1`, `D+7`, `D+30`, backup JSON e suporte offline.

---

## 3. Skills Vinculadas & Diretrizes de Atuação
Sempre que o agente atuar no **Meu Estudo**, deve utilizar prioritariamente o pacote completo de engenharia e UX instalado (adaptado ao stack **ES Modular + Vite 8 + Vitest + PWA Offline**, **sem** introduzir React, Tailwind ou TypeScript):
- **Mapeamento & Economia de Contexto (`graphify`, `improve-codebase-architecture`):** Ler [`ARCHITECTURE_MAP.md`](ARCHITECTURE_MAP.md) (e/ou consultar `graphify-out/graph.json` via `graphify query` quando gerado) antes de navegar ou refatorar módulos em `src/domain/`, `src/ui/`, `src/icons/` e `src/pwa/`, mantendo o grafo/mapa atualizado após mudanças estruturais (`graphify update .` local offline, zero API paga).
- **Build & Tooling (`vite`):** Respeitar o pipeline Vite 8 (Rolldown/Oxc), módulos ES nativos, injeção de `__APP_VERSION__`/`__BUILD_TIME__` e geração de `PRECACHE_ASSETS` em `dist/sw.js`.
- **Qualidade, Testes & Depuração (`vitest`, `playwright-best-practices`, `systematic-debugging`):** Diagnosticar causas raiz antes de corrigir bugs de cache/SW ou estado, manter testes unitários robustos em `npm test` (`vitest run` + `jsdom`) e cobrir fluxos críticos (módulos, aulas, revisões `D+1`/`D+7`/`D+30`, swipe e dialogs `<dialog>`) na suíte E2E (`npm run test:e2e`).
- **UI/UX Editorial Mobile 120Hz & Ergonomia PWA (`mobile-native`, `design-taste-frontend`, `emil-design-eng`, `frontend-design`, `web-design-guidelines`, `vercel-react-view-transitions`):** Preservar a estética Editorial Minimalista Claro (`#F7F6F3`) + Azul Marinho (`#162654`), aplicar os ajustes finos de `mobile-native` no Samsung Galaxy A54 (`100dvh`/`svh`, `-webkit-tap-highlight-color: transparent`, `@media (hover: hover) and (pointer: fine)`, inputs `>= 16px` com `interactive-widget=resizes-content`, `touch-action: manipulation`, `overscroll-behavior`), física contínua por WAAPI (`attachSheetDrag`), CSS Scroll Snap e `document.startViewTransition` direcional nativo (conceitos de View Transitions sem React).
- **Conteúdo Médico (`karpathy-llm-wiki`):** Ao estruturar pílulas clínicas, marcadores e resumos de estudo, manter notas atômicas de alta retenção diagnóstica.
- **Deploy (`deploy-to-vercel`):** Validar `npm test`, `npm run build` (com injeção de `PRECACHE_ASSETS` em `dist/sw.js`) e `npm run test:e2e`, atualizar `public/version.json`, e em seguida fazer `git commit` + `git push` na branch `main` automaticamente ao finalizar atualizações para disparar o deploy na Vercel.
