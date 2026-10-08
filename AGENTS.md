# Meu Estudo — Contexto do Projeto & Diretrizes Arquiteturais (v2.3.0)

Este arquivo preserva todo o histórico de decisões visuais, técnicas e de UX tomadas ao longo do desenvolvimento do **Meu Estudo** (Caderno Pessoal de Estudos Médicos com Revisões Espaçadas `D+1`, `D+7`, `D+30` e Gestão de Provas), otimizado para o **Samsung Galaxy A54 (120Hz, Offline-First PWA)**.

---

## 1. Regras de Ouro (O que NUNCA deve ser quebrado ou alterado sem pedido explícito)

1. **Barra Superior (Header) e Barra de Navegação Inferior (3 Abas):**
   - A barra superior simétrica possui: Busca Rápida Global (`#btn-open-search`) à esquerda, brasão Dark-Slate + status diário ao vivo no centro (`#btn-header-center-status`), e Configurações (`#btn-open-settings`) à direita.
   - A barra inferior de 3 abas (`Módulos`, `Estudo`, `Provas`) permanece intocada.
2. **Arquitetura Single-File Offline-First:**
   - Toda a aplicação principal reside em `index.html`, acompanhada por `sw.js` (Service Worker), `manifest.json`, `icon.svg` e `version.json`.
   - Zero dependências externas pesadas de ícones; todos os ícones SVG são embutidos (`inline`) para carregamento instantâneo (`0ms`) offline.
3. **Sistema de Ícones Médicos (`32x32` Dark-Slate & Anatomia Branca 3D — Padrão Reumatologia):**
   - Zero emojis nativos caricatos nas especialidades ou indicadores.
   - **Reumatologia (`reuma`):** Estilo original travado permanentemente em fundo *dark-slate* (`#303b4d`) com osso branco em visão anterolateral de joelho (30°) e halo de inflamação articular.
   - **Todas as 21 Especialidades & Ícone do App (`icon.svg`):** Unificados na mesma estética *Dark-Slate* (`#303b4d`, borda `#444f60`), estrutura anatômica principal em branco puro (`#ffffff`) com preenchimento translúcido 3D (`fill-opacity="0.30"`) e ponto focal clínico colorido (`currentColor` / `iconAccent`).
4. **Cards de Módulos (Grade 2 Colunas & Lista):**
   - Sem faixa superior colorida (`h-1`) para não competir com a barra de progresso única na base do card.
   - Badges de status inteligentes (*Estudar* e *Revisar*): discretos (`opacity-50`) quando `0`, destacados quando `> 0`.
5. **Fluxo de Cadastro de Módulos e Aulas (Fricção Zero):**
   - **Smart Auto-Match:** Ao digitar o nome do módulo (ex: *Cardio*, *Endócrino*, *Gineco*, *Gastro*, *Reumato*, *Ped*), seleciona automaticamente o ícone e a cor correspondente.
   - **Novas Aulas:** Por padrão, novas aulas cadastradas iniciam como **não estudadas** (`unstudied`), salvo marcação explícita.
   - **Botão "Salvar e +1":** Permite cadastrar várias aulas seguidas mantendo o *bottom sheet* aberto na numeração seguinte.
   - **Campo de Anotações Auto-Expansível** com continuação automática de tópicos (`• `), salto inteligente de colchete (`]`) no `Enter`, e chips clínicos rápidos (`Alerta`, `Padrão-Ouro`, `Fisiopato`, `Diagnóstico`, `Conduta`, `Conceito`).
6. **Ergonomia Mobile & Performance 120Hz (v2.2.0 – v2.3.0):**
   - Preservação cirúrgica da posição de rolagem (*scroll restoration*) ao marcar aulas ou revisões.
   - Botão **Desfazer (Undo)** integrado ao Toast em ações frequentes e modal de confirmação estilo One UI ancorado na base (substituindo `window.confirm` bloqueante).
   - Ciclos `D+1`, `D+7` e `D+30` interativos diretamente no leitor da aula.
   - Suporte nativo ao botão "Voltar" do Android (`history.pushState` / `popstate`) e gestos de *swipe* para uso com uma mão no celular.

---

## 2. Histórico de Versões Recentes (Git Log)
- **v2.3.0 (08/10/2026):** Unificação dos 21 ícones médicos e do `icon.svg` na estética Dark-Slate & Anatomia Branca 3D (padrão Reumatologia); modernização do Header com Busca Rápida Global e status ao vivo; botão Desfazer (Undo) no Toast; filtros rápidos por status/módulo; sincronização bidirecional Prova ↔ Aula.
- **v2.2.0 (04/10/2026):** Ergonomia UX mobile, performance 120Hz, restauração de rolagem e gestos de swipe com uma mão.
- **v2.1.1 (04/10/2026):** Redesign dos ícones de Endócrino, Gastro e Nefro; trava permanente do estilo dark-slate & osso branco na Reumatologia.
- **v2.1.0 (04/10/2026):** Novas aulas iniciam como não estudadas por padrão; ícones médicos 32x32 de alto contraste; joelho anterolateral 30° para Reumato.
- **v2.0.0 – v2.0.1 (04/10/2026):** Pacote de ícones médicos vetoriais Duotone, cards de módulo limpos sem barra no topo, Smart Auto-Match e botão "Salvar e +1".
- **v1.0.0 – v1.7.0 (25/09/2026):** Criação do PWA offline-first, detector de auto-update (`version.json`), suporte ao botão voltar do Android e redesign Light Mode.
