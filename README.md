# Sistema de Controle Operacional de Carregamento

Sistema web institucional para registrar operações de carregamento de veículos com autenticação no Supabase, planilha operacional, dashboard, cadastros de funcionários e veículos, relatórios e exportação CSV.

## Visão geral do projeto

Este sistema foi pensado para uso diário em operação logística, com foco em rapidez, organização e uma experiência de planilha profissional. A interface foi estruturada para funcionar como uma ferramenta de uso operacional, com navegação lateral, dados em tempo real via Supabase e fluxo de movimentação claro para o dia a dia.

## Estrutura do projeto

```text
/
├── index.html
├── login.html
├── table.html
├── employees.html
├── vehicles.html
├── reports.html
├── assets/
│   ├── images/
│   └── icons/
├── css/
│   ├── variables.css
│   ├── base.css
│   ├── layout.css
│   ├── components.css
│   └── responsive.css
├── js/
│   ├── app.js
│   ├── config.js
│   ├── supabase.js
│   ├── table.js
│   ├── dashboard.js
│   ├── employees.js
│   ├── vehicles.js
│   ├── reports.js
│   └── utils.js
├── etiquetas/
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   ├── produtos.js
│   └── produtos.csv
├── expedicao/
│   ├── index.html
│   ├── assets/
│   ├── css/
│   ├── data/
│   ├── js/
│   └── scripts/
├── sql/
│   └── setup.sql
├── .env.example
├── vercel.json
├── README.md
└── assets/images/logo.png
```

## Funcionalidades principais

- Login com Supabase Auth
- Sessão persistente e proteção de páginas internas
- Sidebar com navegação por módulos
- Planilha operacional com colunas de data, veículo, volumes, movimentador, carregador e organizador
- Edição direta por célula
- Busca, filtros e paginação
- Validação de volumes e seleção por dropdowns
- Cadastro de funcionários com status ativo/inativo
- Cadastro de veículos com status ativo/inativo
- Dashboard com indicadores do dia e do mês
- Relatórios com total de carregamentos, volumes e média por operação
- Exportação CSV
- Toasts, empty states, footer institucional e visual limpo
- Preparação para integração com Supabase e deploy na Vercel

## 1. Criar o projeto no Supabase

1. Acesse https://supabase.com
2. Crie um novo projeto
3. Abra `Settings > API`
4. Copie:
   - `Project URL`
   - `anon public key`

Nunca exponha a `service_role key` no frontend.

## 2. Executar o SQL

1. No painel do Supabase, vá em `SQL Editor`
2. Crie uma nova query
3. Cole o conteúdo do arquivo [sql/setup.sql](sql/setup.sql)
4. Execute a query

O script cria as tabelas:

- `profiles`
- `employees`
- `vehicles`
- `loadings`
- `audit_logs`

Além disso, cria índices, triggers, RLS e políticas de acesso.

## 3. Configurar as variáveis

Crie um arquivo `.env` com base no [.env.example](.env.example):

```env
SUPABASE_URL=https://SEU_PROJETO.supabase.co
SUPABASE_ANON_KEY=sua-chave-publica
```

No frontend, o projeto também pode receber valores via `window.SUPABASE_URL` e `window.SUPABASE_ANON_KEY` nos arquivos HTML, caso queira substituir temporariamente a configuração em ambiente local.

## 4. Criar o primeiro usuário

1. Vá em `Authentication > Users` no Supabase
2. Clique em `Add user`
3. Cadastre o usuário com e-mail e senha
4. Faça login na tela de autenticação do sistema

Não há cadastro público de usuários.

## 5. Como rodar localmente

No terminal, na pasta do projeto:

```bash
python -m http.server 8000
```

Depois abra:

```text
http://localhost:8000/login.html
```

## 6. Deploy na Vercel

1. Faça login na Vercel
2. Importe este repositório
3. Mantenha a raiz do projeto como pasta principal
4. Configure as variáveis de ambiente:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
5. Faça o deploy

O arquivo [vercel.json](vercel.json) já foi preparado para uso estático básico.

## 7. Trocar logo e favicon

Os arquivos atuais estão em:

- `assets/images/logo.png`
- `assets/icons/favicon.png`

Para trocar a identidade visual do sistema, substitua os arquivos e mantenha os nomes atuais ou ajuste os caminhos em [index.html](index.html), [login.html](login.html) e [js/config.js](js/config.js).

## 8. Observações importantes

- Este projeto foi estruturado para funcionar em HTML, CSS e JavaScript puro.
- Funcionários e veículos inativos deixam de aparecer em novos dropdowns da planilha.
- Registros antigos continuam preservados corretamente por relacionamento no banco.
- A exportação atual está pronta para CSV.
- O sistema foi organizado para permitir evolução sem quebrar a base.

## 9. Módulos integrados

Além do núcleo operacional, o projeto também inclui módulos complementares:

- `etiquetas/`: geração de etiquetas
- `expedicao/`: gestão de expedição

Esses módulos fazem parte do mesmo conjunto de ferramentas e podem evoluir separadamente sem atrapalhar o fluxo principal.

## 10. Fluxo de uso esperado

1. Login
2. Dashboard
3. Planilha
4. Novo registro
5. Editar e salvar
6. Filtrar
7. Cadastrar funcionários
8. Cadastrar veículos
9. Consultar relatórios
10. Logout

## 11. Resumo da stack

- HTML
- CSS
- JavaScript
- Supabase
- Vercel
- SQL para estrutura de banco e RLS

## Licença

Projeto interno para uso operacional e organização de processos logísticos.
