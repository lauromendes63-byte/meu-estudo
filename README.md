# Meu Estudo · Caderno Pessoal de Estudos Médicos (v3.0.0)

Aplicação web mobile-first (**Offline-First PWA**) projetada para smartphones Android (**Samsung Galaxy A54 · 120Hz**), com arquitetura modular ES + Vite, design **Editorial Minimalista Claro (`#F7F6F3`)** e automação de revisões espaçadas (`D+1`, `D+7`, `D+30`).

## Funcionalidades Principais

1. **Gestão dos Eixos Clínicos (Módulos)**:
   - 26 ícones médicos anatômicos duotone em traço Azul Marinho (`#162654`) e paleta editorial de alto contraste.
   - Smart Auto-Match de ícone e cor conforme o nome do módulo digitado.
   - Visualização em Lista (padrão) ou Grade de 2 colunas com reconciliação DOM cirúrgica por chave (`data-key`).

2. **Cadastro Rápido de Aulas (`#sheet-lesson`)**:
   - Bottom sheet deslizante com física contínua por velocidade (`PointerEvents` + Web Animations API).
   - Numeração sugerida automaticamente com stepper (`−` / `+`) e modo **Salvar e +1** para cadastro contínuo em série.
   - Compositor clínico seguro (renderização via DOM sem `innerHTML`) com suporte a negrito (`**texto**`), tópicos (`• `) e marcadores rápidos: `Alerta`, `Padrão-Ouro`, `Fisiopato`, `Diagnóstico`, `Conduta` e `Conceito`.

3. **Automação de Revisões Espaçadas (`D+1`, `D+7`, `D+30`)**:
   - Ao concluir uma aula, o motor (`createStudyEngine`) agenda automaticamente os ciclos `D+1`, `D+7` e `D+30`.
   - Aba `Estudo` com listas deslizáveis nativas (`CSS Scroll Snap` + `IntersectionObserver`), botão acessível equivalente e Toast com **Desfazer (1 toque)**.

4. **Gestão Integrada de Provas & Busca Global**:
   - Cadastro de exames vinculados ao conteúdo programático com contagem regressiva e percentual de cobertura sincronizado bidirecionalmente.
   - Busca rápida instantânea (`<search>`) por módulo, tema, aula pendente, revisão ou marcador clínico.

5. **PWA 100% Offline, Fontes Locais & Backup JSON**:
   - Nenhuma dependência externa de CDN em runtime (`@fontsource/instrument-serif`, `@fontsource/plus-jakarta-sans`, `@fontsource/jetbrains-mono` e `canvas-confetti` empacotados localmente no bundle).
   - Precache automático em `dist/sw.js` e exportação/restauração segura em JSON validado.

## Desenvolvimento & Testes

```bash
npm install
npm run dev        # Servidor de desenvolvimento Vite
npm test           # Suíte unitária (Vitest + jsdom)
npm run build      # Build de produção em dist/ com injeção do Service Worker
npm run preview    # Preview local do bundle (http://127.0.0.1:4173/)
npm run test:e2e   # Smoke E2E no Edge/Chrome headless (Galaxy A54 412x915 + Desktop 1280x800)
```

Consulte [ARCHITECTURE_MAP.md](ARCHITECTURE_MAP.md) para o grafo completo de dependências entre módulos e [AGENTS.md](AGENTS.md) para as diretrizes arquiteturais.
