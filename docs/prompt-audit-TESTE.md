> Você é um engenheiro de segurança e auditoria Web3.  
> Execute uma auditoria completa nos contratos inteligentes localizados na pasta `/src/` (projeto **Apoia Protocol**). Utilize as seguintes ferramentas e processos:
>
> - **Slither** (análise estática)  
> - **Foundry (`forge test`)** – testes unitários e de integração  
> - **Foundry fuzzing** – testes baseados em propriedades (`forge test --fuzz-runs`)  
> - **Foundry invariants** – testes de invariantes (`forge invariant` ou `invariant` em testes)  
>
> Com base nos resultados, **produza um relatório de auditoria** seguindo **exatamente** a estrutura abaixo (incluindo todos os cabeçalhos, checkboxes e tabelas).  
> O relatório deve ser escrito em português, em formato Markdown (pronto para converter para PDF). Preencha cada campo com informações reais obtidas da análise dos contratos `/src/`. Quando uma informação não puder ser obtida (ex: commit hash, contatos), use placeholders realistas como `[PENDENTE]` ou `[NÃO INFORMADO]`.
>
> ---
>
> # 📄 Estrutura do Relatório de Auditoria de Smart Contracts — Apoia Protocol
>
> ## Cabeçalho / Metadados
>
> - [ ] **Nome do Projeto:** Apoia Protocol
> - [ ] **Versão Auditada:** `[v1.0.0]`
> - [ ] **Período da Auditoria:** `[data de início]` a `[data de fim]`
> - [ ] **Equipe de Auditoria:** `[Seu nome ou “Auditoria Automatizada + Revisão Humana”]`
> - [ ] **Cliente/Solicitante:** `[Equipe de Desenvolvimento Apoia]`
> - [ ] **Classificação de Confidencialidade:** `[Confidencial → Público após deploy]`
> - [ ] **Contatos:** Lead Auditor, Technical Reviewer, Project Manager (nome + e-mail)
>
> ---
>
> ## 📊 Resumo Executivo
>
> - [ ] **Visão Geral:** Breve descrição do protocolo (financiamento coletivo, campanhas, contribuições, etc.)
> - [ ] **Pontuação de Risco Geral:** Tabela com notas (0–10) para Segurança, Qualidade de Código, Otimização de Gas, Documentação e Centralização.
> - [ ] **Achados por Severidade:** Quantidade de vulnerabilidades classificadas (Crítica, Alta, Média, Baixa, Informativo) e status (Corrigido/Mitigado/Aceito/Pendente).
> - [ ] **Recomendação Final:** 
>   - ✅ `APROVADO PARA TESTNET`
>   - ⚠️ `APROVADO COM RESSALVAS PARA MAINNET`
>   - 🔴 `NÃO APROVADO`
>   - `[Justificativa técnica resumida]`
>
> ---
>
> ## 🔍 Escopo da Auditoria
>
> - [ ] **Contratos Analisados:** Tabela com Nome, Commit Hash, Linhas de Código (SLOC), Complexidade.
>   - [Lista de contratos analisados – extrair da pasta `/src/`]
> - [ ] **Dependências Externas:** OpenZeppelin v5, Chainlink Contracts, Foundry (especificar versões encontradas).
> - [ ] **Commits Auditados:** Hash inicial, hash final, branch, repositório (use `git log` se disponível, senão informe `[NÃO DISPONÍVEL]`).
> - [ ] **Fora do Escopo:** Frontend, scripts de deploy, testes unitários (apenas revisados), integração IPFS, oráculos off-chain.
>
> ---
>
> ## 🛠️ Metodologia
>
> - [ ] **Abordagem:** Análise estática automatizada, revisão manual linha a linha, testes dinâmicos/fuzzing, análise de gas, validação de arquitetura.
> - [ ] **Ferramentas Utilizadas:** 
>   - `Slither` (versão X)
>   - `Foundry` (fuzzing/invariantes) – versão Y
>   - `Foundry Tests`, `solc optimizer analyzer`
> - [ ] **Configurações do Compilador:** Versão Solidity (ex: 0.8.20), otimização (`runs: 200`), `viaIR`, `bytecodeHash`.
> - [ ] **Critérios de Classificação de Severidade:**
>   - 🔴 Crítica: Perda direta de fundos ou paralização total.
>   - 🟠 Alta: Perda significativa ou degradação severa.
>   - 🟡 Média: Impacto moderado, sem perda direta de fundos.
>   - 🟢 Baixa: Otimizações, boas práticas, impacto mínimo.
>   - ℹ️ Informativo: Sugestões de melhoria ou documentação.
>
> ---
>
> ## Vulnerabilidades Encontradas
>
> *(Apresentar cada achado no formato abaixo, baseado na saída real do Slither, fuzzing e invariantes)*
>
> ### 🔴 Críticas
>
> - [ ] `[TÍTULO]` | Status: `[Corrigido/Pendente]` | Local: `[Arquivo:Linha]`
>   - **Descrição:** `[O que é o problema]`
>   - **Impacto:** `[Consequência financeira/operacional]`
>   - **Recomendação:** `[Como corrigir]`
>   - **Status:** `[Verificação pós-correção]`
>
> ### 🟠 Altas
>
> - [ ] `[TÍTULO]` (ex: Reentrancy em `Treasury.withdrawFees()`)
>   - Descrição/Impacto/Recomendação/Status
>   - `[INSERIR TRECHO ANTES → DEPOIS]`
>
> ### 🟡 Médias
>
> - [ ] `[TÍTULO]` (ex: Validação insuficiente de quórum duplo, Oracle staleness, Centralização do owner)
>   - Descrição/Impacto/Recomendação/Status
>
> ### 🟢 Baixas
>
> - [ ] `[TÍTULO]` (ex: Uso de `memory` vs `calldata`, Eventos faltantes, Números mágicos hardcoded)
>   - Descrição/Impacto/Recomendação/Status
>
> ### ℹ️ Informativos
>
> - [ ] `[TÍTULO]` (ex: NatSpec incompleto, Sugestão de libraries, Padronização de nomenclatura)
>   - Descrição/Recomendação/Status
>
> ---
>
> ## 📈 Relatório de Cobertura de Testes
>
> - [ ] **Métricas Globais:** Linhas (%), Funções (%), Branches (%), Statements (%) – extraído de `forge coverage`.
> - [ ] **Cobertura por Contrato:** Tabela detalhada por arquivo.
> - [ ] **Tipos de Testes Executados:** Unitários, Integração, Fuzzing, Invariantes, Gas.
> - [ ] **Cenários Críticos Validados:**
>   - ✅ Reentrancy protegida
>   - ✅ Lógica de reembolso (burn NFT + stablecoin return)
>   - ✅ Quórum duplo (peso financeiro + descentralização de carteiras)
>   - ✅ Janela de auditoria de 7 dias
>   - ✅ Validação de oracle (staleness + desvio máximo)
>   - ✅ Taxa de 5% apenas em sucesso
>   - ✅ Expiração e liquidação de campanhas inativas
>
> ---
>
> ## ✅ Recomendações Finais & Checklist de Boas Práticas
>
> - [ ] **Prioridade Alta (Pré-Mainnet):** Correções obrigatórias, multisig/timelock para owner, bug bounty.
> - [ ] **Prioridade Média:** Otimização de gas, circuit breakers, upgradeability (proxy pattern), monitoramento on-chain.
> - [ ] **Prioridade Baixa:** Documentação NatSpec completa, guias de deploy, disaster recovery plan.
> - [ ] **Checklist de Segurança:** ReentrancyGuard, SafeERC20, Access Control, Input Validation, Oracle Redundancy, Pausable/Emergency Stop.
> - [ ] **Checklist de Qualidade:** Solhint clean, DRY, NatSpec, Error messages claras, Modularização.
> - [ ] **Checklist de Operações:** Scripts automatizados, Verificação no Explorer, Alertas, Incident Response.
>
> ---
>
> ## 📎 Apêndice
>
> - [ ] **A. Logs de Execução das Ferramentas:** Output completo de Slither, Foundry coverage, comandos usados.
> - [ ] **B. Endereços dos Contratos na Testnet:** Tabela com Endereço, Explorer Link, Status de Verificação (se disponível).
> - [ ] **C. Assinaturas da Equipe:** Lead Auditor, Technical Reviewer, Project Manager (Nome, Data, Assinatura).
> - [ ] **D. Disclaimer Legal:** Limitações da auditoria, não garantia absoluta, recomendação de monitoramento contínuo, validade (ex: 90 dias).
>
> ---
>
> **Instruções adicionais de execução:**
> - Assuma que os contratos estão em Solidity ^0.8.x.
> - Inclua trechos de código reais das vulnerabilidades (com linha e arquivo).
> - Se algum dado não existir (ex: endereços em testnet), indique `[NÃO APLICÁVEL]` ou `[PENDENTE]`.
> - O relatório final deve ser auto-suficiente e escrito em português técnico, mas claro.
> - Gere o conteúdo completo do relatório, não apenas o esqueleto.

