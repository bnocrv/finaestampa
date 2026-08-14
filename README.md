# Sistema de Controle Operacional de Carregamento

Sistema web estático para registrar carregamentos de veículos com Supabase Auth, cadastros de funcionários e veículos, planilha operacional, dashboard, relatórios, dark mode e exportação CSV.

## Estrutura

```text
/
+-- index.html
+-- login.html
+-- table.html
+-- employees.html
+-- vehicles.html
+-- reports.html
+-- etiquetas/
|   +-- index.html
|   +-- styles.css
|   +-- script.js
|   +-- produtos.js
|   +-- produtos.csv
+-- expedicao/
|   +-- index.html
|   +-- assets/
|   +-- css/
|   +-- data/
|   +-- js/
|   +-- scripts/
+-- assets/
|   +-- images/logo.png
|   +-- icons/favicon.png
+-- css/
|   +-- variables.css
|   +-- base.css
|   +-- layout.css
|   +-- components.css
|   +-- responsive.css
+-- js/
|   +-- app.js
|   +-- config.js
|   +-- supabase.js
|   +-- table.js
|   +-- dashboard.js
|   +-- employees.js
|   +-- vehicles.js
|   +-- reports.js
|   +-- utils.js
+-- sql/setup.sql
+-- vercel.json
+-- .env.example
```

## 1. Criar o projeto no Supabase

1. Acesse `https://supabase.com`.
2. Crie um novo projeto.
3. Abra `Settings > API`.
4. Copie o `Project URL` e a chave `anon public`.

Nunca use a `service_role key` no frontend.

## 2. Executar o SQL

1. No Supabase, abra `SQL Editor`.
2. Crie uma nova query.
3. Cole o conteúdo de [sql/setup.sql](sql/setup.sql).
4. Execute a query.

O script cria `profiles`, `employees`, `vehicles`, `loadings`, `audit_logs`, índices, triggers e políticas RLS.

## 3. Configurar Supabase no frontend

Este projeto é HTML estático. Para rodar sem build, informe os valores nos blocos abaixo em cada HTML:

```html
<script>
  window.SUPABASE_URL = "https://SEU_PROJETO.supabase.co";
  window.SUPABASE_ANON_KEY = "sua-chave-publica";
</script>
```

O arquivo `.env.example` documenta os nomes usados em hospedagens e futuras automações:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

## 4. Criar o primeiro usuário

1. No Supabase, acesse `Authentication > Users`.
2. Clique em `Add user`.
3. Crie o usuário com e-mail e senha.
4. Entre pelo `login.html`.

Não há cadastro público de usuários.

## 5. Executar localmente

Use um servidor estático simples:

```bash
python -m http.server 8000
```

Depois acesse:

```text
http://localhost:8000/login.html
```

## 6. Deploy na Vercel

1. Importe o repositório na Vercel.
2. Mantenha o projeto como estático.
3. Configure as variáveis `SUPABASE_URL` e `SUPABASE_ANON_KEY` no painel da Vercel para referência do projeto.
4. Como não há etapa de build, mantenha também os valores públicos nos blocos `window.SUPABASE_*` dos HTML ou adicione uma etapa própria para gerar `js/config.js`.

## 7. Substituir logo e favicon

Os arquivos atuais ficam em:

- `assets/images/logo.png`
- `assets/icons/favicon.png`

Para trocar a identidade visual, substitua esses arquivos ou altere os caminhos em [js/config.js](js/config.js).

## Funcionalidades

- Login e logout com Supabase Auth.
- Proteção das páginas internas.
- Planilha com edição inline, filtros, busca, paginação, validação de volumes, exportação CSV e realtime.
- Cadastros de funcionários e veículos com status ativo/inativo.
- Dashboard calculado a partir dos carregamentos.
- Relatórios com filtro por período e exportação CSV.
- Modo claro/escuro salvo no navegador.
- Toasts, empty states e modal próprio para exclusão.
- Footer institucional padronizado com frase, marca, versão e ano.
- Módulo de etiquetas integrado em `etiquetas/`, vindo de `bnocrv/sistema-etiqueta`.
- Módulo de expedição integrado em `expedicao/`, vindo de `bnocrv/expedicao`.

## Observações

Os dropdowns usam `select` nativo para manter o projeto leve. Funcionários e veículos inativos deixam de aparecer para novas seleções, enquanto registros antigos continuam preservados no banco por chave estrangeira com `on delete set null`.
