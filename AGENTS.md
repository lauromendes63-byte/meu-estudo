# Meu Estudo — Contexto do Projeto & Diretrizes Arquiteturais (v2.4.2)

Este arquivo preserva todo o histórico de decisões visuais, técnicas e de UX tomadas ao longo do desenvolvimento do **Meu Estudo** (Caderno Pessoal de Estudos Médicos com Revisões Espaçadas `D+1`, `D+7`, `D+30` e Gestão de Provas), otimizado para o **Samsung Galaxy A54 (120Hz, Offline-First PWA)**.

---

## 1. Regras de Ouro (O que NUNCA deve ser quebrado ou alterado sem pedido explícito)

1. **Identidade Visual & Tema Azul Marinho (`#162654`):**
   - **Ícone Oficial (`icon.svg` & Brasão do App):** Capelo de formatura + livro aberto com duas páginas curvas em traço contínuo Azul Marinho Profundo (`#162654` / `#132147`) centralizado sobre um *squircle* perolado suave (`#fff9f2` → `#f8fafc` → `#e6f2ff`), sem margens brancas externas ("zoom out").
   - **Tema Principal:** Paleta `brand` em Azul Marinho / Escuro (`brand-600: #162654`, `brand-500: #1e3a8a`, `brand-700: #111c40`), harmonizando cabeçalho, abas, botões de ação, toasts e estados vazios com o novo ícone.
2. **Barra Superior (Header) e Barra de Navegação Inferior (3 Abas) em Azul Marinho Escuro:**
   - Tanto o `<header>` quanto o `<nav>` inferior possuem fundo Azul Marinho Profundo (`from-[#0f1a38] via-[#132147] to-[#162654]`) contrastando com textos e ícones brancos nítidos.
   - O cabeçalho não possui bolinha amarela ao lado do dia da semana — o destaque central vem exclusivamente do brasão do App (Capelo + Livro Aberto) e da tipografia branca/celeste.
   - Na barra inferior (`Módulos`, `Estudo`, `Provas`), o indicador de provas (`#nav-provas-badge`) é um círculo vermelho vibrante de alto contraste (`bg-rose-600 text-white`).
3. **Arquitetura Single-File Offline-First:**
   - Toda a aplicação principal reside em `index.html`, acompanhada por `sw.js` (Service Worker), `manifest.json`, `icon.svg` e `version.json`.
   - Zero dependências externas pesadas de ícones; todos os ícones SVG são embutidos (`inline`) para carregamento instantâneo (`0ms`) offline.
4. **Sistema de Ícones Médicos (`32x32` Anatomia Branca 3D & Alto Contraste Cromático):**
   - Zero emojis nativos caricatos nas especialidades ou indicadores.
   - **Reumatologia (`reuma`):** Estilo original travado permanentemente em fundo *dark-slate* (`#303b4d`) com osso branco em visão anterolateral de joelho (30°) e halo de inflamação articular.
   - **Especialidades Renovadas em v2.4.0 – v2.4.1:** Coração anatômico 3D com pulso ECG para Cardiologia (`heart`); Tireoide borboleta 3D pura (sem fundo de documento) para Endocrinologia (`endocrino`); osso anatômico 3D único com fratura angulada para Ortopedia (`bone`); rostinho de bebê com topete e chupeta para Pediatria (`baby`); corte histológico de pele 3D + folículo piloso + dermatoscópio para Dermatologia (`skin`); idoso com bengala curva e coração de cuidado para Geriatria (`geriatria`); e perfil humano nobre com símbolo Psi (`Ψ`) esculpido para Psiquiatria (`psiq`).
   - **Diferenciação Cromática entre Módulos:** Enquanto `reuma` mantém seu fundo `#303b4d` travado, cada módulo exibe seu próprio brilho cromático radial no squircle do ícone (`getIconSquircleStyle`), borda colorida (`1.5px`), barra de acento lateral e barra de progresso `h-2` viva.
5. **Fluxo de Cadastro de Módulos e Aulas (Fricção Zero & UI 2026):**
   - **Smart Auto-Match:** Ao digitar o nome do módulo (ex: *Cardio*, *Endócrino*, *Gineco*, *Gastro*, *Reumato*, *Ped*), seleciona automaticamente o ícone e a cor correspondente.
   - **Botões `+` em Todos os Níveis de Matéria:** Tanto nos cards de `Módulos` quanto dentro do detalhe da matéria (`#tab-modulo-detail`: no canto direito do `#module-summary-card`, no topo `+ Aula`, na barra `+ Adicionar Aula` e no botão flutuante `+` inferior direito) e nos cards de `Provas`.
   - **Novas Aulas (`#sheet-lesson`):** Layout moderno com seletor numérico integrado (`-` / `+`), card unificado de anotações com botão `• Lista` sem quebra de linha e barra horizontal de *pills* clínicos rápidos (`Alerta`, `Padrão-Ouro`, `Fisiopato`, `Diagnóstico`, `Conduta`, `Conceito`).
   - **Botão "Salvar e +1":** Permite cadastrar várias aulas seguidas mantendo o *bottom sheet* aberto na numeração seguinte.
6. **Ergonomia Mobile & Performance 120Hz (v2.2.0 – v2.4.2):**
   - Preservação cirúrgica da posição de rolagem (*scroll restoration*) ao marcar aulas ou revisões.
   - Botão **Desfazer (Undo)** integrado ao Toast em ações frequentes e modal de confirmação estilo One UI ancorado na base (substituindo `window.confirm` bloqueante).
   - Ciclos `D+1`, `D+7` e `D+30` interativos diretamente no leitor da aula.
   - Suporte nativo ao botão "Voltar" do Android (`pushAppHistory` com ativação por gesto do usuário compatível com Chrome Android + `popstate`) e gestos de *swipe* para uso com uma mão no celular.

---

## 2. Histórico de Versões Recentes (Git Log)
- **v2.4.2 (08/10/2026):** Correção definitiva do botão Voltar no Android (histórico `pushAppHistory` ativado por gesto do usuário + remoção de conflito `CloseWatcher` + correção de runtime em `renderProvasTab`) e adição dos botões `+` de nova aula dentro da matéria (no card principal de resumo, no topo, na listagem e botão flutuante FAB).
- **v2.4.1 (08/10/2026):** Restauração da Tireoide 3D pura para Endocrinologia, osso único com fratura angulada para Ortopedia e coração 3D com pulso ECG para Cardiologia.
- **v2.4.0 (08/10/2026):** Header e Barra Inferior em Azul Marinho Escuro com texto branco e badge vermelho vibrante nas Provas; novos ícones 3D para Cardio, Endócrino, Ortopedia, Pediatria, Dermato, Geriatria e Psiquiatria; alto contraste cromático entre módulos; e redesign moderno da folha de criação de aulas (`#sheet-lesson`).
- **v2.3.1 – v2.3.2 (08/10/2026):** Adaptação do novo ícone minimalista acadêmico (`icon.svg` e brasões internos com Capelo + Livro Aberto em Azul Marinho sobre Squircle Perolado) e transição do tema principal do app para Azul Marinho / Escuro (`#162654`).
- **v2.3.0 (08/10/2026):** Unificação dos 21 ícones médicos na estética Dark-Slate & Anatomia Branca 3D (padrão Reumatologia); modernização do Header com Busca Rápida Global e status ao vivo; botão Desfazer (Undo) no Toast; filtros rápidos por status/módulo; sincronização bidirecional Prova ↔ Aula.
- **v2.2.0 (04/10/2026):** Ergonomia UX mobile, performance 120Hz, restauração de rolagem e gestos de swipe com uma mão.
- **v2.1.1 (04/10/2026):** Redesign dos ícones de Endócrino, Gastro e Nefro; trava permanente do estilo dark-slate & osso branco na Reumatologia.
- **v2.1.0 (04/10/2026):** Novas aulas iniciam como não estudadas por padrão; ícones médicos 32x32 de alto contraste; joelho anterolateral 30° para Reumato.
- **v2.0.0 – v2.0.1 (04/10/2026):** Pacote de ícones médicos vetoriais Duotone, cards de módulo limpos sem barra no topo, Smart Auto-Match e botão "Salvar e +1".
- **v1.0.0 – v1.7.0 (25/09/2026):** Criação do PWA offline-first, detector de auto-update (`version.json`), suporte ao botão voltar do Android e redesign Light Mode.

