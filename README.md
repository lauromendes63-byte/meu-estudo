# Meu Estudo • Caderno Pessoal de Estudos Médicos

Aplicação web mobile-first pensada e refinada estritamente para uso em smartphones Android (Samsung Galaxy A54), focada em produtividade máxima com o menor esforço mental e de cliques possível.

## 🩺 Funcionalidades Principais

1. **Gestão dos Grandes Eixos Clínicos (Módulos)**:
   - Criação, edição e exclusão de matérias/eixos com 18 ícones médicos temáticos (Cardio, Neuro, Pneumo, Orto, Gastro, Hemato, etc.) e paleta de cores de alto contraste.
   - Visão sequencial de aulas com contador de progresso visual (estudadas vs. pendentes).

2. **Cadastro Rápido de Aulas (Bottom Sheet)**:
   - Gaveta deslizante inferior que abre com 1 toque no botão central de destaque.
   - Numeração Inteligente: sugere automaticamente a próxima aula (ex: "Aula 03") com botões táteis `+` e `–` para ajustar sem precisar abrir teclado numérico.
   - Editor ágil de anotações com barra de ferramentas direta: Negrito, Listas em tópicos (`•`) e marcadores rápidos de cores clínicas (Vermelho = Alerta, Amarelo = Fisiopatologia, Verde = Padrão-Ouro/Diagnóstico, Azul = Conceito-Chave).
   - Vínculo direto opcional com exames/provas.

3. **Automação de Revisões Espaçadas (D+1, D+7, D+30)**:
   - Ao marcar qualquer aula como estudada, o sistema agenda automaticamente os ciclos de revisão espaçada.
   - Aba inicial "Revisões" reúne o que vence hoje ou está atrasado, permitindo dar check com 1 toque, com vibração háptica e animação comemorativa.

4. **Gestão Integrada de Provas**:
   - Cadastro de provas com data, eixo e checklist do conteúdo programático cobrado.
   - Card visual com contagem regressiva em dias e barra percentual de conteúdo estudado.

5. **Persistência Local & Backup**:
   - Dados salvos persistentemente no LocalStorage do próprio celular.
   - Opções de "Exportar Backup (JSON)" e "Restaurar Backup (JSON)" nas configurações.

6. **PWA Instalável no Galaxy A54**:
   - Manifest PWA completo com modo `standalone` (sem barras do navegador).
   - Suporte offline via Service Worker (`sw.js`).
