const supabaseUrl = 'https://iwgizrizoagjtaivwjcf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3Z2l6cml6b2FnanRhaXZ3amNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjA3ODMsImV4cCI6MjA2MDAzNjc4M30.0V1iGuJlzm6rP1ibfBdQc-fQa12bz8bM2Xclnp1PDqU'; // sua anon key
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const loginSection = document.getElementById('loginSection');
const painelSection = document.getElementById('painelSection');
const tabela = document.getElementById('tabelaLancamentos');
const form = document.getElementById('formLancamento');

let totalCusto = 0;
let totalVenda = 0;
let idEditando = null;

// Sons
const beepSuccess = new Audio('/assets/sounds/success.mp3');
const beepError = new Audio('/assets/sounds/error.mp3');

// Toast reutilizável
function mostrarToast(msg, tipo = "success") {
  const toast = document.getElementById('toast');
  const message = document.getElementById('toastMessage');

  toast.classList.remove('opacity-0', 'bg-green-600', 'bg-red-600');
  message.textContent = msg;

  if (tipo === "error") {
    toast.classList.add('bg-red-600');
    beepError.play();
  } else {
    toast.classList.add('bg-green-600');
    beepSuccess.play();
  }

  toast.classList.add('opacity-100');

  setTimeout(() => {
    toast.classList.remove('opacity-100');
    toast.classList.add('opacity-0');
  }, 2500);
}

// Verifica sessão ativa
supabase.auth.getSession().then(({ data }) => {
  if (data.session) {
    mostrarPainel();
  }
});

// Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = e.target.email.value;
  const senha = e.target.senha.value;

  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error) return mostrarToast('Login inválido', 'error');

  mostrarPainel();
});

// Mostra painel
function mostrarPainel() {
  loginSection.classList.add('hidden');
  painelSection.classList.remove('hidden');
  document.getElementById('estoqueSection')?.classList.remove('hidden'); // 👈 mostrar seção de estoque

  carregarLancamentos();
  carregarEstoqueManual(); // se quiser carregar já ao logar
}

// Logout
function logout() {
  supabase.auth.signOut().then(() => location.reload());
}

// Carrega lançamentos
async function carregarLancamentos() {
  const { data, error } = await supabase
    .from('lancamentos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return mostrarToast('Erro ao carregar lançamentos', 'error');

  totalCusto = 0;
  totalVenda = 0;
  tabela.innerHTML = '';

  data.forEach(l => adicionarNaTabela(l));
}

// Adiciona linha na tabela
function adicionarNaTabela({ id, nome, quantidade, custo, venda }) {
  const subtotalCusto = custo * quantidade;
  const subtotalVenda = venda * quantidade;
  const lucro = subtotalVenda - subtotalCusto;

  totalCusto += subtotalCusto;
  totalVenda += subtotalVenda;

  const row = document.createElement('tr');
  row.innerHTML = `
    <td class="p-2">${nome}</td>
    <td class="p-2 text-right">${quantidade}</td>
    <td class="p-2 text-right">R$ ${custo.toFixed(2)}</td>
    <td class="p-2 text-right">R$ ${venda.toFixed(2)}</td>
    <td class="p-2 text-right">R$ ${subtotalCusto.toFixed(2)}</td>
    <td class="p-2 text-right">R$ ${subtotalVenda.toFixed(2)}</td>
    <td class="p-2 text-right">R$ ${lucro.toFixed(2)}</td>
    <td class="p-2 text-center">
      <button onclick="editarLancamento('${id}')" class="text-yellow-400 hover:underline text-xs">Editar</button>
      <button onclick="removerLancamento('${id}')" class="text-red-500 hover:underline ml-2 text-xs">Remover</button>
    </td>
  `;
  tabela.appendChild(row);

  document.getElementById('totalCusto').innerText = `R$ ${totalCusto.toFixed(2)}`;
  document.getElementById('totalVenda').innerText = `R$ ${totalVenda.toFixed(2)}`;
  document.getElementById('totalLucro').innerText = `R$ ${(totalVenda - totalCusto).toFixed(2)}`;
}

// Adicionar ou editar lançamento
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nome = form.nome.value.trim();
  const quantidade = parseInt(form.quantidade.value);
  const custo = parseFloat(form.custo.value);
  const venda = parseFloat(form.venda.value);

  if (!nome || quantidade < 1 || custo <= 0 || venda <= 0) {
    mostrarToast("Preencha os campos corretamente.", "error");
    return;
  }

  let error;

  if (idEditando) {
    ({ error } = await supabase
      .from('lancamentos')
      .update({ nome, quantidade, custo, venda })
      .eq('id', idEditando));
  } else {
    ({ error } = await supabase
      .from('lancamentos')
      .insert([{ nome, quantidade, custo, venda }]));
  }

  if (error) return mostrarToast("Erro ao salvar", "error");

  idEditando = null;
  form.reset();
  form.querySelector('button').textContent = 'Adicionar';

  mostrarToast("Lançamento salvo com sucesso!");
  carregarLancamentos();
});

// Editar
async function editarLancamento(id) {
  const { data, error } = await supabase
    .from('lancamentos')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return mostrarToast("Erro ao buscar lançamento", "error");

  form.nome.value = data.nome;
  form.quantidade.value = data.quantidade;
  form.custo.value = data.custo;
  form.venda.value = data.venda;

  idEditando = id;
  form.querySelector('button').textContent = 'Salvar Alterações';
}

// Remover
async function removerLancamento(id) {
  mostrarPopup(
    "Remover lançamento",
    "Tem certeza que deseja remover este lançamento?",
    async () => {
      const { error } = await supabase.from('lancamentos').delete().eq('id', id);
      if (error) return mostrarToast("Erro ao remover", "error");

      mostrarToast("Lançamento removido!", "success");
      carregarLancamentos();
    }
  );
}

const formEstoque = document.getElementById('formEstoque');
const tabelaEstoque = document.getElementById('tabelaEstoque');

// Carrega estoque atual
async function carregarEstoqueManual() {
  const { data, error } = await supabase.from('estoque').select('*').order('created_at', { ascending: false });

  if (error) {
    mostrarToast('Erro ao carregar estoque', 'error');
    return;
  }

  tabelaEstoque.innerHTML = '';

  data.forEach(prod => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="p-2">${prod.nome}</td>
      <td class="p-2 text-right">${prod.quantidade}</td>
      <td class="p-2 text-center">
        <button onclick="abrirModalEdicaoEstoque('${prod.id}', '${prod.nome}', ${prod.quantidade})" class="text-yellow-400 hover:underline text-xs">Editar</button>
        <button onclick="removerEstoque('${prod.id}')" class="text-red-400 hover:underline ml-2 text-xs">Remover</button>
      </td>
    `;
    tabelaEstoque.appendChild(tr);
  });
}

// Adiciona ou atualiza estoque
formEstoque.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nome = e.target.nome.value.trim();
  const quantidade = parseInt(e.target.quantidade.value);

  if (!nome || quantidade < 1) {
    mostrarToast("Preencha corretamente", "error");
    return;
  }

  const { data, error } = await supabase.from('estoque').select('*').eq('nome', nome).single();

  if (data) {
    const novaQtd = data.quantidade + quantidade;
    await supabase.from('estoque').update({ quantidade: novaQtd }).eq('id', data.id);
  } else {
    await supabase.from('estoque').insert([{ nome, quantidade }]);
  }

  mostrarToast("Estoque atualizado!");
  e.target.reset();
  carregarEstoqueManual();
});

// Editar com prompt
async function editarEstoquePrompt(id, nome, quantidadeAtual) {
  const novaQtd = prompt(`Editar quantidade de "${nome}"`, quantidadeAtual);
  if (!novaQtd || isNaN(novaQtd) || novaQtd < 0) return;

  await supabase.from('estoque').update({ quantidade: parseInt(novaQtd) }).eq('id', id);
  mostrarToast("Quantidade atualizada!");
  carregarEstoqueManual();
}

async function removerEstoque(id) {
  mostrarPopup(
    "Remover produto",
    "Deseja remover este produto do estoque?",
    async () => {
      const { error } = await supabase.from('estoque').delete().eq('id', id);
      if (error) return mostrarToast("Erro ao remover", "error");

      mostrarToast("Produto removido!");
      carregarEstoqueManual();
    }
  );
}


// Carrega ao entrar
carregarEstoqueManual();

function mostrarPopup(titulo, mensagem, onConfirm) {
  const modal = document.getElementById('popupModal');
  document.getElementById('popupTitle').innerText = titulo;
  document.getElementById('popupMessage').innerText = mensagem;

  modal.classList.remove('hidden');

  const confirmar = document.getElementById('popupConfirm');
  const cancelar = document.getElementById('popupCancel');

  // Limpa listeners antigos
  confirmar.onclick = () => {
    modal.classList.add('hidden');
    onConfirm(); // callback
  };

  cancelar.onclick = () => {
    modal.classList.add('hidden');
  };
}

let produtoEditandoId = null;

function abrirModalEdicaoEstoque(id, nome, quantidade) {
  produtoEditandoId = id;
  document.getElementById('editarNomeProduto').textContent = nome;
  document.getElementById('editarQtdInput').value = quantidade;
  document.getElementById('modalEditarEstoque').classList.remove('hidden');
}

function fecharModalEdicao() {
  produtoEditandoId = null;
  document.getElementById('modalEditarEstoque').classList.add('hidden');
}

async function confirmarEdicaoEstoque() {
  const novaQtd = parseInt(document.getElementById('editarQtdInput').value);
  if (isNaN(novaQtd) || novaQtd < 0) {
    mostrarToast("Quantidade inválida", "error");
    return;
  }

  const { error } = await supabase
    .from('estoque')
    .update({ quantidade: novaQtd })
    .eq('id', produtoEditandoId);

  if (error) return mostrarToast("Erro ao atualizar", "error");

  mostrarToast("Quantidade atualizada!");
  fecharModalEdicao();
  carregarEstoqueManual();
}
