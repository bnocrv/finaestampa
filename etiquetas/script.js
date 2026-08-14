let usuarioLogado = "";
const STORAGE_USUARIOS_KEY = "sistemaEtiquetasUsuariosSalvos";
const STORAGE_ULTIMO_USUARIO_KEY = "sistemaEtiquetasUltimoUsuario";

const PRODUTOS_CSV_URLS = [
  "produtos.csv",
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vStGTh9ffFAbSMZouqq61hP9D_FTPxEGHVbi2EJs2vhtKWJkzdEtCFbICb_Lp8MIx_NMD4f8XpRxWZZ/pub?gid=0&single=true&output=csv",
];

let produtosCache = null;
let imprimindo = false;

// Load saved login users from localStorage.
function carregarUsuariosSalvos() {
  try {
    const raw = localStorage.getItem(STORAGE_USUARIOS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
}

// Store the last successful login name and keep a short history.
function salvarUsuarioSalvo(usuario) {
  if (!usuario) return;

  const usuariosSalvos = carregarUsuariosSalvos();
  const normalizado = normalizarTexto(usuario);

  if (!usuariosSalvos.some((item) => normalizarTexto(item) === normalizado)) {
    usuariosSalvos.unshift(usuario);
    if (usuariosSalvos.length > 10) {
      usuariosSalvos.pop();
    }
    localStorage.setItem(STORAGE_USUARIOS_KEY, JSON.stringify(usuariosSalvos));
    atualizarDatalistUsuarios(usuariosSalvos);
  }
}

function atualizarDatalistUsuarios(usuarios) {
  const datalist = document.getElementById("usuariosSalvosList");
  if (!datalist) return;
  datalist.innerHTML = "";

  usuarios.forEach((usuario) => {
    const option = document.createElement("option");
    option.value = usuario;
    datalist.appendChild(option);
  });
}

function carregarUltimoUsuario() {
  const ultimo = localStorage.getItem(STORAGE_ULTIMO_USUARIO_KEY);
  if (ultimo) {
    const input = document.getElementById("funcionario");
    if (input) {
      input.value = ultimo;
    }
  }
}

function initLoginPersistencia() {
  atualizarDatalistUsuarios(carregarUsuariosSalvos());
  carregarUltimoUsuario();
}

// Mark a form field as visible and active.
function mostrarCampo(id) {
  const campo = document.querySelector(`.campo[data-field="${id}"]`);

  if (campo) {
    campo.classList.add("campo-ativo");
  }
}

function mostrarCampos(ids) {
  ids.forEach((id) => mostrarCampo(id));
}

function avancarParaCampo(id) {
  mostrarCampo(id);
  document.getElementById(id).focus();
}

function setBotaoSairVisivel(visivel) {
  document
    .querySelector(".botao-sair")
    .classList.toggle("botao-sair-ativo", visivel);
}

// --- IDENTIFICAÇÃO DO FUNCIONÁRIO ---
document.getElementById("funcionario").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    document.getElementById("origem").focus();
  }
});

document.addEventListener("DOMContentLoaded", initLoginPersistencia);

document.addEventListener("DOMContentLoaded", () => {
  mostrarCampos(["funcionario", "origem", "destino"]);
  document.getElementById("descricao").disabled = true;
  document.getElementById("fornecedor").disabled = true;
  document.getElementById("funcionario").focus();
});

// --- NAVEGAÇÃO POR ENTER NOS CAMPOS ---
const camposIds = ["origem", "destino", "codigo", "quantTotal"];
let destinoSelecionadoComMouse = false;
camposIds.forEach((id, i) => {
  const el = document.getElementById(id);

  if (id === "destino") {
    el.addEventListener("pointerdown", () => {
      destinoSelecionadoComMouse = true;
    });
  }

  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (id === "codigo") {
        buscarProduto().then((produtoEncontrado) => {
          if (produtoEncontrado) {
            avancarParaCampo("quantTotal");
          }
        });
      } else if (id === "quantTotal") {
        const total = parseInt(el.value);
        if (total && total > 0) {
          criarVolumesFluidos(total);
        }
      } else if (id === "destino" && el.value) {
        avancarParaCampo("codigo");
      } else {
        const proximoCampo = camposIds[i + 1];

        if (proximoCampo) {
          avancarParaCampo(proximoCampo);
        }
      }
    } else if (id === "destino") {
      destinoSelecionadoComMouse = false;
    }
  });

  if (id === "origem" || id === "destino") {
    el.addEventListener("change", () => {
      if (el.value) {
        if (id === "origem") {
          document.getElementById("destino").focus();
        } else if (destinoSelecionadoComMouse) {
          avancarParaCampo("codigo");
        }
      }

      if (id === "destino") {
        destinoSelecionadoComMouse = false;
      }
    });
  }
});

document.getElementById("descricao").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    avancarParaCampo("fornecedor");
  }
});

document.getElementById("fornecedor").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    avancarParaCampo("quantTotal");
  }
});

// --- PRODUCT LOOKUP ---
// Parse one line from a CSV file preserving quoted values.
function parseCSVLine(line) {
  const values = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values.map((value) => value.trim());
}

function parseCSV(csvText) {
  const lines = csvText
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.trim());

  const headers = parseCSVLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    return headers.reduce((item, header, index) => {
      item[header] = values[index] || "";
      return item;
    }, {});
  });
}

function normalizarTexto(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function obterCampo(item, nomeCampo) {
  const chave = Object.keys(item).find(
    (key) => normalizarTexto(key) === normalizarTexto(nomeCampo)
  );

  return chave ? item[chave] : "";
}

async function carregarProdutos() {
  if (produtosCache) return produtosCache;

  if (window.PRODUTOS_CSV) {
    const csvText =
      typeof window.PRODUTOS_CSV === "string"
        ? window.PRODUTOS_CSV
        : window.PRODUTOS_CSV.value;

    produtosCache = parseCSV(csvText);
    return produtosCache;
  }

  const erros = [];

  for (const url of PRODUTOS_CSV_URLS) {
    try {
      const resp = await fetch(url, { cache: "no-store" });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const csvText = await resp.text();
      produtosCache = parseCSV(csvText);
      return produtosCache;
    } catch (error) {
      erros.push(`${url}: ${error.message}`);
    }
  }

  throw new Error(erros.join(" | "));
}

async function buscarProduto() {
  const codigo = document.getElementById("codigo").value.trim();
  if (!codigo) return false;

  try {
    const data = await carregarProdutos();
    const produto = data.find((p) => obterCampo(p, "codigo") === codigo);

    if (produto) {
      mostrarCampos(["descricao", "fornecedor", "quantTotal"]);
      document.getElementById("descricao").value =
        obterCampo(produto, "descricao") || "";
      document.getElementById("fornecedor").value =
        obterCampo(produto, "fornecedor") || "";
      document.getElementById("descricao").disabled = true;
      document.getElementById("fornecedor").disabled = true;
      return true;
    } else {
      mostrarCampos(["descricao", "fornecedor", "quantTotal"]);
      document.getElementById("descricao").value = "";
      document.getElementById("fornecedor").value = "";
      document.getElementById("descricao").disabled = false;
      document.getElementById("fornecedor").disabled = false;

      alert(
        "Código não encontrado.\nPor favor, preencha manualmente os campos Descrição e Fornecedor."
      );
      document.getElementById("descricao").focus();
      return false;
    }
  } catch (error) {
    alert(
      "Erro ao buscar dados da planilha. Verifique se o servidor local esta aberto e se o arquivo produtos.csv existe na pasta do projeto."
    );
    console.error("Erro ao buscar dados da planilha:", error);
    return false;
  }
}

function sair() {
  resetarFormulario({ focar: false });
  usuarioLogado = "";
  document.getElementById("funcionario").value = "";
  document.getElementById("loginMsg").innerText = "";
  document.getElementById("funcionario").focus();
}

// --- CRIAÇÃO DINÂMICA DE VOLUMES ---
const volumesContainer = document.getElementById("volumesContainer");
let volumesQtds = [];

function criarVolumesFluidos(total) {
  volumesContainer.innerHTML = "";
  volumesQtds = [];
  document.querySelector(".acao-gerar").classList.remove("botao-ativo");

  function criarInputVolume(index) {
    if (index >= total) return;

    const divVol = document.createElement("div");
    divVol.className = "volume";

    const label = document.createElement("label");
    label.innerText = `Volume ${index + 1}:`;
    divVol.appendChild(label);

    const input = document.createElement("input");
    input.type = "number";
    input.min = 1;
    input.placeholder = "Quantidade";
    input.required = true;
    input.className = "volumeQtd";
    divVol.appendChild(input);

    volumesContainer.appendChild(divVol);

    volumesQtds[index] = 0;
    input.focus();

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();

        const val = parseInt(input.value);
        if (!val || val <= 0) {
          alert("Digite uma quantidade válida maior que zero.");
          input.focus();
          return;
        }

        const somaAtual = volumesQtds.reduce(
          (acc, cur, i) => (i === index ? acc : acc + cur),
          0
        );
        const somaVolumes = somaAtual + val;

        if (somaVolumes > total) {
          alert("A soma dos volumes não pode ultrapassar a quantidade total.");
          input.value = "";
          input.focus();
          return;
        }

        volumesQtds[index] = val;

        if (somaVolumes === total) {
          Array.from(document.querySelectorAll(".volumeQtd")).forEach((inp) => {
            inp.disabled = true;
          });
          document.querySelector(".acao-gerar").classList.add("botao-ativo");
          document.querySelector(".formulario button").focus();
        } else {
          criarInputVolume(index + 1);
          const inputs = document.querySelectorAll(".volumeQtd");
          if (inputs[index + 1]) inputs[index + 1].focus();
        }
      }
    });
  }

  criarInputVolume(0);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function resetarFormulario(opcoes = {}) {
  const { focar = true } = opcoes;

  document.getElementById("origem").value = "Estoque Central";
  document.getElementById("destino").value = "";
  document.getElementById("codigo").value = "";
  document.getElementById("descricao").value = "";
  document.getElementById("fornecedor").value = "";
  document.getElementById("quantTotal").value = "";
  document.getElementById("descricao").disabled = true;
  document.getElementById("fornecedor").disabled = true;

  volumesContainer.innerHTML = "";
  volumesQtds = [];

  document
    .querySelectorAll(".campo")
    .forEach((campo) => campo.classList.remove("campo-ativo"));

  mostrarCampos(["funcionario", "origem", "destino"]);
  document.querySelector(".acao-gerar").classList.remove("botao-ativo");

  if (focar) {
    document.getElementById("destino").focus();
  }
}

// --- PRINT LABEL GENERATION ---
function gerarEtiqueta() {
  if (imprimindo) return;

  const origem = document.getElementById("origem").value.trim();
  const destino = document.getElementById("destino").value.trim();
  const codigo = document.getElementById("codigo").value.trim();
  const descricao = document.getElementById("descricao").value.trim();
  const fornecedor = document.getElementById("fornecedor").value.trim();
  const total = parseInt(document.getElementById("quantTotal").value);
  usuarioLogado = document.getElementById("funcionario").value.trim();

  if (!usuarioLogado) {
    document.getElementById("loginMsg").innerText = "Informe o nome do funcionário.";
    document.getElementById("funcionario").focus();
    return;
  }

  document.getElementById("loginMsg").innerText = "";
  localStorage.setItem(STORAGE_ULTIMO_USUARIO_KEY, usuarioLogado);
  salvarUsuarioSalvo(usuarioLogado);

  if (!origem || !destino || !codigo || !descricao || !fornecedor || !total) {
    alert("Preencha todos os campos obrigatórios.");
    return;
  }

  const volumesInputs = document.querySelectorAll(".volumeQtd");
  if (volumesInputs.length === 0) {
    alert("Preencha os volumes.");
    document.getElementById("quantTotal").focus();
    return;
  }

  const volumes = Array.from(volumesInputs).map((input) => parseInt(input.value) || 0);

  if (volumes.some((valor) => valor <= 0)) {
    alert("Todas as quantidades de volume devem ser maiores que zero.");
    return;
  }

  const somaVolumes = volumes.reduce((a, b) => a + b, 0);

  if (somaVolumes !== total) {
    alert("A soma dos volumes deve ser igual à quantidade total.");
    return;
  }

  const totalVolumes = volumes.length;
  const somaTexto = volumes.join(" + ");
  const dataAtual = new Date().toLocaleString("pt-BR");

  const printWindow = window.open("", "", "width=600,height=800");

  if (!printWindow) {
    alert(
      "O navegador bloqueou a janela de impressão. Libere pop-ups para este sistema e tente novamente."
    );
    return;
  }

  if (!window.QRCode) {
    alert("QRCode não carregou. Recarregue a página e tente novamente.");
    printWindow.close();
    return;
  }

  imprimindo = true;
  const botaoGerar = document.querySelector(".acao-gerar");
  botaoGerar.disabled = true;
  botaoGerar.innerText = "Preparando impressão...";

  const doc = printWindow.document;

  doc.write(`
    <html>
      <head>
        <title>Imprimir Etiquetas</title>
        <style>
          @page { size: 100mm 150mm; margin: 0; }
          body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: white;
          }
          .etiquetaModelo {
            width: 100mm;
            height: 150mm;
            padding: 12px 16px;
            box-sizing: border-box;
            border: 1px solid #ddd;
            border-radius: 8px;
            color: #222;
            margin: 0;
            page-break-after: always;
            break-after: page;
            position: relative;
          }
          .etiquetaModelo:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          .topo-logo {
            position: absolute;
            top: 12px;
            right: 16px;
          }
          .topo-logo img { height: 40px; }
          .linha { margin-bottom: 6px; font-size: 13px; }
          .linha.destino { font-size: 24px; }
          .linha.codigo { font-size: 34px; font-weight: bold; margin-bottom: 10px; }
          .linha.quantidade { font-size: 20px; font-weight: bold; }
          .linha.volumes { font-size: 18px; font-weight: bold; margin-top: 12px; }
          .linha.total { font-size: 13px; margin-top: 4px; }
          .label { font-weight: normal; }
          .valor { font-weight: bold; }
          .qrcode-container { margin: 24px auto 0; width: 140px; text-align: center; }
          .rodape {
            font-size: 11px;
            color: #666;
            padding-top: 6px;
            margin-top: 12px;
            font-style: italic;
            text-align: center;
          }
        </style>
      </head>
      <body>
      </body>
    </html>
  `);
  doc.close();

  const body = doc.body;

  volumes.forEach((qtd, i) => {
    const divEtiqueta = doc.createElement("div");
    divEtiqueta.className = "etiquetaModelo";

    divEtiqueta.innerHTML = `
      <div class="topo-logo">
        <img src="https://res.cloudinary.com/dmpqzayaa/image/upload/v1756312909/sqt5fplglswwk8isu9co.jpg" alt="Logo Empresa" />
      </div>
      <div style="font-size: 13px; margin-bottom: 6px;">
        <span style="font-weight: normal;">Origem:</span> <span style="font-weight: bold;">${escapeHtml(origem)}</span>
      </div>
      <div style="font-size: 28px; margin-bottom: 6px;">
        <span style="font-weight: normal;">Destino:</span> <span style="font-weight: bold;">${escapeHtml(destino)}</span>
      </div>
      <div style="font-size: 48px; font-weight: bold; text-align: center; margin-bottom: 12px;">
        ${escapeHtml(codigo)}
      </div>
      <div style="font-size: 28px; margin-bottom: 6px;">
        <span style="font-weight: normal;">Quantidade:</span> <span style="font-weight: bold;">${qtd} peça(s)</span>
      </div>
      <div style="font-size: 16px; margin-bottom: 6px;">
        <span style="font-weight: normal;">Descrição:</span> <span style="font-weight: bold;">${escapeHtml(descricao)}</span>
      </div>
      <div style="font-size: 16px; margin-bottom: 6px;">
        <span style="font-weight: normal;">Fornecedor:</span> <span style="font-weight: bold;">${escapeHtml(fornecedor)}</span>
      </div>
      <div style="font-size: 28px; margin-bottom: 6px;">
        <span style="font-weight: normal;">Volumes:</span> 
        <span style="font-weight: bold;">${i + 1}/${totalVolumes}</span>
        <br />
        <span style="font-size: 14px; font-weight: normal; color: #444;">(${escapeHtml(somaTexto)})</span>
      </div>
      <div style="font-size: 13px; margin-bottom: 6px;">
        <span style="font-weight: normal;">Total:</span> <span style="font-weight: bold;">${total}</span>
      </div>
      <div id="qrcode${i}" class="qrcode-container"></div>
      <div class="rodape">
        Etiqueta gerada por ${escapeHtml(usuarioLogado)} - ${escapeHtml(dataAtual)}
      </div>
    `;

    body.appendChild(divEtiqueta);

    const volumesTexto = volumes.join("+");

    const textoQRCode = `${dataAtual};${codigo};${fornecedor};${descricao};${total};${volumesTexto}`;

    new window.QRCode(doc.getElementById(`qrcode${i}`), {
      text: textoQRCode,
      width: 140,
      height: 140,
    });
  });

  let finalizado = false;
  let verificarJanela = null;
  const finalizarImpressao = () => {
    if (finalizado) return;
    finalizado = true;
    if (verificarJanela) {
      clearInterval(verificarJanela);
    }
    imprimindo = false;
    botaoGerar.disabled = false;
    botaoGerar.innerText = "Gerar Etiqueta(s)";
    resetarFormulario();

    if (!printWindow.closed) {
      printWindow.close();
    }

    window.focus();
  };

  printWindow.addEventListener("afterprint", finalizarImpressao);

  verificarJanela = setInterval(() => {
    if (printWindow.closed) {
      clearInterval(verificarJanela);
      finalizarImpressao();
    }
  }, 500);

  setTimeout(() => {
    try {
      printWindow.focus();
      printWindow.print();
    } catch (error) {
      clearInterval(verificarJanela);
      imprimindo = false;
      botaoGerar.disabled = false;
      botaoGerar.innerText = "Gerar Etiqueta(s)";
      printWindow.close();
      alert("Não foi possível abrir a impressão. Recarregue a página e tente novamente.");
      console.error("Erro ao imprimir:", error);
    }
  }, 500);
}

