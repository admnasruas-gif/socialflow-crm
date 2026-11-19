# SocialFlow CRM — Gerenciador de Clientes de Social Media

Aplicação web estilo CRM para gerenciar clientes de social media, pacotes mensais de postagens e esteira de entregas.

## Arquitetura do Projeto

- **Frontend:** HTML5, CSS3 e JavaScript modular com **Vite** (pronto para deploy gratuito na **Vercel**).
- **Banco de Dados & Autenticação:** **Supabase** (PostgreSQL + Row Level Security + Login por E-mail e Senha).
- **Modo Local Automático:** Caso as variáveis do Supabase ainda não estejam preenchidas, o sistema funciona automaticamente usando o armazenamento local do navegador (`localStorage`) com dados de exemplo.

## Estrutura de Arquivos

- `index.html`: Interface do CRM (Tela de Login, Dashboard CRM, Esteira Global e Perfil do Cliente).
- `styles.css`: Design responsivo do CRM.
- `app.js`: Lógica do CRM e integração híbrida (`Supabase` + `localStorage`).
- `src/supabaseClient.js`: Inicialização segura do Supabase usando variáveis de ambiente (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`).
- `supabase/schema.sql`: Script SQL completo para criar as tabelas `clientes`, `contratos` e `postagens` e ativar o **Row Level Security (RLS)** no Supabase.
- `.env.example`: Modelo das variáveis de ambiente.
- `vercel.json` e `package.json`: Configuração pronta para build e deploy na Vercel.
