let carrinho = [];

function adicionarAoCarrinho(button) {
  const card = button.closest('article');
  const produto = {
    id: card.dataset.id,
    nome: card.dataset.name,
    preco: parseFloat(card.dataset.price),
  };

  const inputQtd = card.querySelector('.quantidade-input');
  const quantidade = parseInt(inputQtd.value);

  if (!quantidade || quantidade < 1) {
    mostrarToast("Informe uma quantidade válida", "error");
    return;
  }

  const existente = carrinho.find(p => p.id === produto.id);
  if (existente) {
    existente.quantidade += quantidade;
  } else {
    produto.quantidade = quantidade;
    carrinho.push(produto);
  }

  atualizarContador();
  mostrarToast(`${quantidade}x ${produto.nome} adicionado!`, "success");
  inputQtd.value = 1;
}

function atualizarContador() {
  const total = carrinho.reduce((soma, item) => soma + item.quantidade, 0);
  document.getElementById('contadorItens').innerText = total;
}

function mostrarToast(msg, tipo = "success") {
  const toast = document.getElementById('toast');
  const message = document.getElementById('toastMessage');

  toast.classList.remove('opacity-0', 'bg-green-600', 'bg-red-600');
  message.innerText = msg;

  toast.classList.add(tipo === "error" ? 'bg-red-600' : 'bg-green-600');
  toast.classList.add('opacity-100');

  setTimeout(() => {
    toast.classList.remove('opacity-100');
    toast.classList.add('opacity-0');
  }, 2500);
}

function abrirModal() {
  if (carrinho.length === 0) {
    mostrarToast("Carrinho vazio!", "error");
    return;
  }

  const resumo = document.getElementById('resumoCarrinho');
  resumo.innerHTML = '';
  let total = 0;

  carrinho.forEach(item => {
    const subtotal = item.preco * item.quantidade;
    total += subtotal;

    const li = document.createElement('li');
    li.className = "flex justify-between items-center";
    li.innerHTML = `
      <span>${item.quantidade}x ${item.nome} - R$ ${subtotal.toFixed(2)}</span>
      <button onclick="removerDoCarrinho('${item.id}')" class="text-red-400 hover:text-red-600 text-xs underline ml-4">Remover</button>
    `;
    resumo.appendChild(li);
  });

  document.getElementById('totalCarrinho').innerText = total.toFixed(2);
  document.getElementById('modal').classList.remove('hidden');
}

function fecharModal() {
  document.getElementById('modal').classList.add('hidden');
}

function removerDoCarrinho(id) {
  carrinho = carrinho.filter(item => item.id !== id);
  atualizarContador();
  mostrarToast("Item removido", "success");

  if (carrinho.length === 0) {
    fecharModal();
  } else {
    abrirModal();
  }
}

function enviarPedido(event) {
  event.preventDefault();

  const form = event.target;
  const nome = form.nome.value.trim();
  const telefone = form.telefone.value.trim();

  if (!nome || !telefone) {
    mostrarToast("Preencha nome e telefone", "error");
    return;
  }

  if (carrinho.length === 0) {
    mostrarToast("Adicione ao menos 1 item", "error");
    return;
  }

  const total = carrinho.reduce((soma, item) => soma + item.preco * item.quantidade, 0);

  const pedido = {
    nome,
    telefone,
    produtos: carrinho,
    valor_total: total.toFixed(2),
  };

  fetch("https://webhook.bltrack.com/webhook/envio", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pedido)
  })
  .then(res => {
    if (res.ok) {
      mostrarToast("Pedido enviado!", "success");
      carrinho = [];
      atualizarContador();
      form.reset();
      fecharModal();
    } else {
      mostrarToast("Erro ao enviar", "error");
    }
  })
  .catch(() => mostrarToast("Erro de conexão", "error"));
}