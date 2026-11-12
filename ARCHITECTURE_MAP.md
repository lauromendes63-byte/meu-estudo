# ARCHITECTURE_MAP · Meu Estudo (v3.0.0)

Mapa estrutural determinístico da arquitetura modular ES + Vite, dependências entre camadas, contratos de persistência (`localStorage`) e pipeline PWA offline-first.

---

## 1. Grafo de Dependências entre Módulos

```mermaid
flowchart TB
  HTML["index.html<br/>(Shell semantico + Top-Layer Dialogs)"] --> MAIN["src/main.js<br/>(Compositor e Bootstrap)"]

  subgraph STYLES["Camadas CSS Compiladas (@layer)"]
    TOK["src/styles/tokens.css<br/>(Paleta Editorial #F7F6F3, Navy #162654, Motion Tokens)"]
    BASE["src/styles/base.css<br/>(Reset seletivo, 3:1 focus-visible, 1rem inputs)"]
    COMP["src/styles/components.css<br/>(Cards, Floating Dock, SwipeableList, Dialogs)"]
    MOT["src/styles/motion.css<br/>(@starting-style, View Transitions, Reduced Motion)"]
  end

  MAIN --> TOK
  MAIN --> BASE
  MAIN --> COMP
  MAIN --> MOT

  subgraph DOMAIN["Camada de Domínio Pura (Zero DOM)"]
    DATES["src/domain/dates.js<br/>getTodayStr · addDays · daysDiff · formatDate*"]
    NOTES["src/domain/notes-parser.js<br/>normalizeText · parseNotesBlocks · buildNotesFragment"]
    STORE["src/domain/storage-adapter.js<br/>createLocalStorageAdapter · normalizeStateSnapshot"]
    ENG["src/domain/study-engine.js<br/>createStudyEngine · createSpacedReviews"]
  end

  subgraph ICONS["Iconografia Duotone"]
    PAL["src/icons/palette.js<br/>PALETTE_COLORS · getColorConfig"]
    MED["src/icons/medical-icons.js<br/>26 Anatomias Ink (#162654) · matchSpecialtyByName"]
  end

  subgraph UI["Infraestrutura UI & Física 120Hz"]
    DOM["src/ui/dom.js<br/>el · createSquircleNode · clearChildren"]
    REC["src/ui/reconcile.js<br/>reconcileKeyedList (Patch DOM por data-key)"]
    FEED["src/ui/feedback.js<br/>showToast (Undo) · triggerCelebration · vibrate"]
    OVL["src/ui/overlays.js<br/>openModalDialog · closeModalDialog · askConfirmation"]
    GEST["src/ui/gestures.js<br/>attachSheetDrag · attachTabSwipe · attachMasterDetailSwipeBack · SwipeableList"]
    RTR["src/ui/router.js<br/>createRouter (Tabs Direcionais, Detail ViewTransition, 1:1 History)"]
  end

  subgraph VIEWS["Controllers de Views (11 Módulos)"]
    VHDR["header-nav.js"]
    VMOD["modules-view.js"]
    VDET["module-detail-view.js"]
    VSTD["study-view.js"]
    VEXM["exams-view.js"]
    VSHT["lesson-sheet.js"]
    VLRD["lesson-viewer.js"]
    VMMOD["module-modal.js"]
    VEXMD["exam-modal.js"]
    VSRC["search-modal.js"]
    VSET["settings-modal.js"]
  end

  PWA["src/pwa/updater.js<br/>Registro SW · Detector version.json"]

  STORE --> NOTES
  ENG --> DATES
  ENG --> NOTES
  ENG --> STORE
  MED --> NOTES
  MED --> STORE

  RTR --> OVL
  MAIN --> ENG
  MAIN --> STORE
  MAIN --> FEED
  MAIN --> GEST
  MAIN --> RTR
  MAIN --> PWA
  MAIN --> VIEWS

  VIEWS --> DOM
  VIEWS --> REC
  VIEWS --> FEED
  VIEWS --> OVL
  VIEWS --> GEST
  VIEWS --> MED
  VIEWS --> PAL
```

---

## 2. Responsabilidade por Arquivo

| Camada | Arquivo | Exportações / Responsabilidade Principal |
| :--- | :--- | :--- |
| Entry | [`index.html`](index.html) | Shell semântico com 4 painéis principais, Floating Dock, Bottom Sheet `#sheet-lesson` e 5 `<dialog closedby="any">` |
| Entry | [`src/main.js`](src/main.js) | Carrega fontes `@fontsource` locais + camadas CSS, instancia `StorageAdapter`, `StudyEngine`, `Router`, Views e `PwaUpdater` |
| Domain | [`src/domain/dates.js`](src/domain/dates.js) | Aritmética determinística `YYYY-MM-DD`, diferença em dias (`daysDiff`) e formatação pt-BR sem risco de timezone |
| Domain | [`src/domain/notes-parser.js`](src/domain/notes-parser.js) | Tokenizador puro de `**negrito**`, listas `• ` e marcadores clínicos `[Alerta:]`, `[Padrão-Ouro:]`, `[Fisiopato:]`, `[Diagnóstico:]`, `[Conduta:]`, `[Conceito:]` via nós DOM seguros (zero `innerHTML`) |
| Domain | [`src/domain/storage-adapter.js`](src/domain/storage-adapter.js) | Persistência em `meu_estudo_data_v1` / `meu_estudo_view_mode_v2`, validação de backup JSON, normalização de provas multi-módulo (`moduleIds`) e migração automática de chaves legadas (`joint->reuma`, `general->stethoscope`, `brain+psiquiatria->psiq`) |
| Domain | [`src/domain/study-engine.js`](src/domain/study-engine.js) | Estado reativo (`subscribe`/`emit`), CRUD de módulos/aulas/provas multi-módulo (`getExamModuleIds`), ciclos `D+1`/`D+7`/`D+30`, callbacks `undo()` de 1 toque e busca global |
| Icons | [`src/icons/palette.js`](src/icons/palette.js) | 8 tons editoriais de alto contraste sobre `#FFFFFF` e `#F7F6F3` |
| Icons | [`src/icons/medical-icons.js`](src/icons/medical-icons.js) | 26 anatomias SVG 32×32 (`#162654` ink + preenchimento pastel `currentColor`), `UI_ICONS`, `APP_CREST_SVG` e `matchSpecialtyByName` |
| UI | [`src/ui/dom.js`](src/ui/dom.js) | Construtores DOM seguros (`el`, `clearChildren`, `createSquircleNode`) |
| UI | [`src/ui/reconcile.js`](src/ui/reconcile.js) | `reconcileKeyedList`: atualização cirúrgica por `data-key` sem reconstruir nós não modificados |
| UI | [`src/ui/overlays.js`](src/ui/overlays.js) | Integração top-layer com feature detection `canTransitionDisplay()` (`@starting-style` vs `[data-closing]`), `wireDialogBackdropDismiss` e `askConfirmation` |
| UI | [`src/ui/gestures.js`](src/ui/gestures.js) | Arrasto interruptível WAAPI + `setPointerCapture` (`attachSheetDrag`), swipe horizontal entre abas (`attachTabSwipe`), swipe-back na borda esquerda (`attachMasterDetailSwipeBack`) e `createSwipeListController` (CSS Scroll Snap + `IntersectionObserver`) |
| UI | [`src/ui/router.js`](src/ui/router.js) | Roteamento de abas com transições direcionais (`next`/`prev`), `startViewTransition` (`forward`/`backward`), pilha 1-para-1 `meuEstudoView` e sincronização de `close` nativo em `closedby="any"` |
| PWA | [`src/pwa/updater.js`](src/pwa/updater.js) | Registro de `./sw.js`, polling `./version.json` no boot/`visibilitychange`, descarte por sessão (`sessionStorage`) e limpeza de cache HTTP |

---

## 3. Fluxo de Dados, Histórico & Reconciliação DOM

1. **Bootstrap & Migração:**
   - `createLocalStorageAdapter.loadData()` lê `meu_estudo_data_v1`, normaliza entidades via `normalizeStateSnapshot` e, se houver chaves legadas (`joint`, `general`, `brain` em psiquiatria), persiste a migração de volta imediatamente.
2. **Mutação Reativa:**
   - Ações de view invocam métodos de `engine` -> `persist()` grava no `StorageAdapter` e notifica inscritos (`subscribe`) -> `renderAll()` + `headerNav.sync()`.
   - Listas longas (`modules-view`, `module-detail-view`) usam `reconcileKeyedList`, preservando nós `.is-removing` e foco ativo.
3. **Acessibilidade Sem Aninhamento Interativo:**
   - Cards de módulos (`.module-card`), aulas no detalhe (`.lesson-card`) e itens deslizáveis (`.SwipeableList-content`) utilizam `<button type="button" class="card-open-trigger">` com overlay CSS (`::after`) cobrindo o card, mantendo botões de ação secundários (`.icon-btn-sm`, `.lesson-card-actions`, `.SwipeableList-action`) em `z-index: 2` como irmãos independentes.
4. **Pilha de Histórico (Botão Voltar Android):**
   - Estados válidos empilhados em `history.pushState({ meuEstudoView })`: `'detail'` (ao entrar em um módulo) e `'overlay'` (ao abrir sheet/dialog).
   - Fechamentos por botão, *light-dismiss* (`closedby="any"`), Esc ou arrasto consomem no máximo 1 entrada via `dialogNeedsHistoryConsume` (`WeakSet`), evitando *double-back* quando o evento assíncrono `close` do `<dialog>` dispara após `await closeModalDialog`.

---

## 4. Pipeline de Build & Cache Offline (Vite + Service Worker)

```mermaid
flowchart LR
  SRC["src/ + public/ + fonts WOFF2"] --> VITE["vite build (vite.config.js)"]
  META["public/version.json"] --> VITE
  VITE --> DIST["dist/<br/>index.html + assets/*.css + assets/*.js + assets/*.woff2"]
  VITE --> SWPLUGIN["meuEstudoSwPrecache<br/>Injeta CACHE_NAME + PRECACHE_ASSETS em dist/sw.js"]
  SWPLUGIN --> DISTSW["dist/sw.js<br/>Navigation: NetworkFirst<br/>/assets/: CacheFirst<br/>version.json: no-store"]
```
