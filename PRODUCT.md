# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Profissional autônomo de social media que administra a própria carteira de clientes e precisa acompanhar clientes, contratos, pacotes de conteúdo e entregas em um só lugar.

## Product Purpose

O SocialFlow CRM organiza a operação diária de um profissional de social media: cadastro e acompanhamento de clientes, controle de contratos e pacotes mensais, gestão da esteira de postagens, vídeos, vendas e informações financeiras. O produto existe para reduzir a complexidade operacional e deixar claro o que foi contratado, produzido, publicado e ainda precisa ser entregue.

## Positioning

Uma operação simples para profissionais autônomos de social media, reunindo carteira de clientes, contratos, entregas e gestão comercial sem exigir uma ferramenta empresarial complexa.

## Operating Context

- Uso recorrente em celular e desktop para consultar a carteira e atualizar o andamento do trabalho.
- Fluxos principais: cadastrar cliente, registrar contrato/pacote, acompanhar postagens, atualizar status de entrega, consultar perfil do cliente e revisar vendas/financeiro.
- A aplicação oferece navegação por Clientes, Postagens, Vendas, Vídeos e Ajustes.
- O sistema deve funcionar conectado ao Supabase e também em modo local quando as variáveis de ambiente não estiverem configuradas.

## Capabilities and Constraints

- Frontend existente em HTML, CSS e JavaScript modular, servido e empacotado com Vite.
- Autenticação e persistência remota via Supabase, com PostgreSQL e Row Level Security.
- Fallback automático para `localStorage`, incluindo dados de exemplo isolados.
- PWA responsivo com manifest e service worker.
- Deve preservar os dados, as regras de cálculo de saldo, a autenticação, o Supabase e os relatórios existentes.
- Terminologia do produto inclui clientes, contratos, acordos, postagens, vídeos, vendas, financeiro e esteira.

## Brand Commitments

- Nome do produto/marca: NasRuas de ITZ.
- Contexto de marca: Social Media.
- Interface e conteúdo existentes em português do Brasil.
- Logo e ícones existentes devem ser tratados como ativos da marca.

## Evidence on Hand

- Implementação existente em `index.html`, `styles.css`, `app.js`, `sales.js` e `sales-domain.js`.
- Ativos visuais em `logo-nasruas.png`, `icon.svg`, `app-icon-192.png` e `app-icon-512.png`.
- Modelo de dados e políticas Supabase em `supabase/schema.sql` e nas migrações versionadas.
- O repositório contém dados de exemplo para demonstrar clientes, contratos e postagens.
- Não há depoimentos, métricas de resultado, clientes reais ou provas de mercado confirmadas; trabalhos futuros não devem inventá-los.

## Product Principles

1. Operação simples antes de complexidade administrativa.
2. Uma visão clara do que foi contratado, entregue e publicado.
3. Dados do cliente e histórico de trabalho devem permanecer preservados.
4. A experiência precisa funcionar de forma consistente em celular e desktop.
5. O produto deve continuar útil mesmo sem uma conexão configurada com o Supabase.
