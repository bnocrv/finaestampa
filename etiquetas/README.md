# Sistema de Etiquetas

Aplicação web para gerar etiquetas de produtos com QR Code, volumes e dados de origem e destino.

## Visão geral

O sistema foi feito em HTML, CSS e JavaScript puro. O objetivo é agilizar a criação de etiquetas para produtos com dados reais de uma planilha de produtos.

## Login

Usuários cadastrados:

- hugo
- lino
- yuri
- joao
- endhjo
- wellington

Senha para todos:

```text
1234
```

O último usuário usado fica salvo no navegador, e o campo de login oferece sugestões a partir do histórico.

## Como usar

1. Abra o sistema no navegador.
2. Faça login com um usuário válido.
3. Escolha a origem e o destino.
4. Digite o código do produto e pressione Enter.
5. Verifique a descrição e o fornecedor.
6. Informe o total e registre os volumes.
7. Gere e imprima as etiquetas.

## Funcionalidades principais

- login simples com sugestões de usuário
- seleção rápida de origem e destino
- preenchimento automático de descrição e fornecedor
- volume dinâmico por Enter
- validação da soma dos volumes
- volumes obrigatórios maiores que zero
- etiquetas geradas em tamanho 100mm x 150mm
- QR Code com dados estruturados
- impressão em janela separada

## Base de dados

A planilha principal é publicada no Google Sheets e também funciona com a base local dos arquivos:

- `produtos.csv`
- `produtos.js`

Para atualizar a base local:

```bat
atualizar-base.bat
```

## Executando localmente

Na pasta do projeto:

```bash
python -m http.server 8000
```

Depois acesse:

```text
http://localhost:8000
```

## Observações

- O sistema usa a base local para evitar falhas de fetch.
- O rodapé foi ajustado para tema escuro com linha cinza de borda alinhada ao cabeçalho.
- Cada volume deve ser maior que zero para gerar as etiquetas.
- A impressão é configurada para etiquetas em 100mm x 150mm.
