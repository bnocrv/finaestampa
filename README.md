# Finaestampa

Sistema operacional de controle logístico para registro, acompanhamento e gestão de operações de carregamento de veículos.

## Visão Geral

O projeto foi desenvolvido para centralizar o processo operacional de carregamento em uma interface funcional, enxuta e profissional, simulando uma experiência de planilha empresarial com navegação de dashboard, cadastros estruturados e relatórios analíticos.

A solução foi pensada para uso diário em operações logísticas, com foco em:

- padronização do processo de carregamento;
- redução de retrabalho manual;
- rastreabilidade de dados por veículo, colaborador e operação;
- controle operacional com visão histórica e indicadores;
- experiência de uso semelhante a um painel interno de gestão.

## Objetivo do Produto

Transformar a operação de carregamento em um fluxo digital organizado, com:

- autenticação segura;
- base de dados em Supabase;
- gestão de funcionários e veículos;
- registro de movimentações em planilha operacional;
- dashboard executivo com métricas;
- relatórios e exportação de dados.

## Stack Tecnológica

- HTML5
- CSS3
- JavaScript vanilla
- Supabase Auth
- Supabase Postgres
- SQL para modelagem e políticas de acesso
- Vercel para deploy estático

## Arquitetura do Sistema

A aplicação segue uma arquitetura frontend estático com integração ao backend gerenciado do Supabase.

- Frontend: páginas HTML, CSS e JS puro
- Autenticação: Supabase Auth
- Banco de dados: Supabase Postgres
- Persistência: tabelas estruturadas para operações e cadastros
- Deploy: Vercel

## Estrutura do Projeto

```text
/
├── index.html
├── login.html
├── table.html
├── employees.html
├── vehicles.html
├── reports.html
├── css/
│   ├── layout.css
│   ├── components.css
│   ├── base.css
│   └── responsive.css
├── js/
│   ├── app.js
│   ├── supabase.js
│   ├── table.js
│   ├── employees.js
│   ├── vehicles.js
│   ├── reports.js
│   └── utils.js
├── sql/
│   └── setup.sql
├── etiquetas/
├── expedicao/
├── assets/
│   ├── images/
│   └── icons/
├── .env.example
├── vercel.json
├── README.md
└── package.json
```

## Funcionalidades Principais

### 1. Autenticação e Sessão
- login com e-mail e senha via Supabase;
- gestão de sessão do usuário;
- proteção de páginas internas;
- fluxo preparado para ambiente real e produção.

### 2. Dashboard Operacional
- visão geral de desempenho;
- indicadores de operações do dia e do mês;
- resumo de produtividade e movimentação;
- painel de acompanhamento para gestão.

### 3. Planilha de Carregamento
- registro de movimentações em formato tabular;
- filtros por período, veículo, operador e status;
- cadastro de dados em tempo real;
- estrutura pronta para operações repetitivas e em grande volume.

### 4. Gestão de Funcionários
- cadastro de colaboradores;
- controle de status ativo/inativo;
- organização para uso operacional e administrativo.

### 5. Gestão de Veículos
- cadastro de frota;
- controle de disponibilidade e status;
- manutenção da integridade operacional por relacionamento com registros.

### 6. Relatórios e Exportação
- indicadores por operação;
- consolidação de volumes e totais;
- exportação em CSV;
- preparação para análise e tomada de decisão.

## Fluxo de Operação

1. Usuário acessa a aplicação;
2. realiza autenticação;
3. navega pelo painel operacional;
4. registra operações na planilha;
5. atualiza dados de funcionários e veículos;
6. monitora indicadores no dashboard;
7. exporta relatórios para uso interno ou acompanhamento executivo.

## Requisitos

- Navegador moderno
- Conta no Supabase
- Acesso ao SQL Editor do Supabase
- Serviço web ou deploy em Vercel

## Configuração do Supabase

### 1. Criar projeto

1. Acesse https://supabase.com
2. Crie um novo projeto
3. Abra a seção Settings > API
4. copie:
   - Project URL
   - anon public key

> Nunca utilize a service_role key no frontend.

### 2. Executar a estrutura de banco

Importe o script localizado em [sql/setup.sql](sql/setup.sql) no SQL Editor do Supabase.

Esse script cria e configura as principais tabelas:

- profiles
- employees
- vehicles
- loadings
- audit_logs

Também gera:

- índices;
- gatilhos;
- políticas de segurança (RLS);
- estrutura mínima para operação funcional.

### 3. Configurar variáveis de ambiente

Crie um arquivo `.env` com base no [.env.example](.env.example):

```env
SUPABASE_URL=https://SEU_PROJETO.supabase.co
SUPABASE_ANON_KEY=sua-chave-publica
```

No frontend, a aplicação também aceita valores via `window.SUPABASE_URL` e `window.SUPABASE_ANON_KEY` em ambiente local, quando necessário.

## Como Executar Localmente

Na raiz do projeto, execute:

```bash
python -m http.server 8000
```

Depois acesse:

```text
http://localhost:8000/login.html
```

## Deploy na Vercel

1. Faça login na Vercel;
2. importe este repositório;
3. mantenha a raiz do projeto como pasta principal;
4. configure as variáveis de ambiente:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
5. finalize o deploy.

O arquivo [vercel.json](vercel.json) já foi configurado para suporte básico ao deploy estático.

## Segurança e Boas Práticas

- chaves sensíveis nunca devem ficar expostas no frontend;
- a autenticação deve ser feita pelo Supabase Auth;
- regras de acesso devem ser controladas por RLS;
- dados operacionais devem ser validados antes de persistência;
- configurações de produção devem ser separadas do ambiente local.

## Observações Importantes

- O sistema foi estruturado em HTML, CSS e JavaScript puro para permitir deploy rápido e manutenção simples.
- Funcionários e veículos inativos podem ser excluídos da lógica de seleção em novos registros;
- o projeto está preparado para evolução incremental sem quebrar a base existente;
- a exportação atual está direcionada para CSV, o que facilita uso no dia a dia operacional.

## Módulos Complementares

O repositório também inclui módulos auxiliares para operação complementar, como:

- etiquetas
- expedição

Esses módulos fazem parte do mesmo ecossistema operacional e podem evoluir de forma independente.

## Roadmap

- refinamento da camada de validação de dados;
- melhoria no fluxo de edição e auditoria;
- criação de relatórios mais avançados;
- expansão de dashboard executivo;
- integração de automações e alertas operacionais.

## Licença

Projeto desenvolvido para uso operacional e gestão interna de processos logísticos.

## Status do Projeto

Aplicação em fase de preparação para uso em produção, com frontend funcional, estrutura de banco definida e deploy preparado para Vercel.
