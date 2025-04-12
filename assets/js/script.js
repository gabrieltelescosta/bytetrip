const supabaseUrl = 'https://iwgizrizoagjtaivwjcf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3Z2l6cml6b2FnanRhaXZ3amNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjA3ODMsImV4cCI6MjA2MDAzNjc4M30.0V1iGuJlzm6rP1ibfBdQc-fQa12bz8bM2Xclnp1PDqU'; // sua anon key
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

supabase
  .from('produtos')
  .select('*')
  .limit(1)
  .then(({ data, error }) => {
    console.log("Verificando Supabase:", { data, error });
  });

async function carregarProdutos() {
  const { data, error } = await supabase.from('produtos').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Erro ao carregar produtos:', error);
    return;
  }

  const container = document.getElementById('vitrine');
  container.innerHTML = '';

  data.forEach((prod, index) => {
    const artigo = document.createElement('article');
    artigo.setAttribute('data-aos', 'fade-up');
    artigo.setAttribute('data-aos-delay', index * 100); // Delay em cascata
    artigo.className = 'bg-gray-900 rounded-xl shadow-xl overflow-hidden p-4 flex flex-row items-start gap-4';
    artigo.setAttribute('data-id', prod.id);
    artigo.setAttribute('data-name', prod.nome);
    artigo.setAttribute('data-price', prod.preco);
  
    artigo.innerHTML = `
      <img src="${prod.imagem_url}" alt="${prod.nome}" class="w-24 h-24 sm:w-48 sm:h-48 object-cover rounded" />
      <div class="flex flex-col justify-between h-full flex-1">
        <div class="flex-1">
          <h2 class="text-base sm:text-lg font-semibold text-purple-400">${prod.nome}</h2>
          <p class="text-gray-400 text-xs sm:text-sm">${prod.descricao}</p>
          <p class="text-pink-400 font-bold text-sm sm:text-base">R$ ${parseFloat(prod.preco).toFixed(2)}</p>
        </div>
        <div class="flex items-center gap-2 mt-4">
          <input type="number" min="1" value="1" class="quantidade-input w-14 text-center bg-gray-800 border border-gray-700 rounded p-1 text-xs sm:text-sm" />
          <button class="flex-1 bg-pink-600 hover:bg-pink-700 py-1.5 rounded text-xs sm:text-sm font-semibold transition" onclick="adicionarAoCarrinho(this)">Adicionar</button>
        </div>
      </div>
    `;
  
    container.appendChild(artigo);
  });
}

carregarProdutos();


let carrinho = [];

// Adiciona produto ao carrinho
function adicionarAoCarrinho(button) {
  const card = button.closest('article');

  const produto = {
    id: card.dataset.id,
    nome: card.dataset.name,
    preco: parseFloat(card.dataset.price)
  };

  const inputQtd = card.querySelector('.quantidade-input');
  const quantidade = parseInt(inputQtd.value);

  if (Number.isNaN(quantidade) || quantidade < 1) {
    mostrarToast("Informe uma quantidade válida", "error");
    return;
  }

  const existente = carrinho.find(p => p.id === produto.id);
  if (existente) {
    existente.quantidade += quantidade;
  } else {
    carrinho.push({ ...produto, quantidade });
  }

  atualizarContador();
  mostrarToast(`${quantidade}x ${produto.nome} adicionado!`, "success");
  inputQtd.value = 1;
}

// Atualiza contador de itens no botão do carrinho
function atualizarContador() {
  const total = carrinho.reduce((soma, item) => soma + item.quantidade, 0);
  document.getElementById('contadorItens').innerText = total;
}


const beepSuccess = new Audio('/assets/sounds/success.mp3');
const beepError = new Audio('/assets/sounds/error.mp3');

// Exibe mensagem toast
function mostrarToast(msg, tipo = "success") {
  const toast = document.getElementById('toast');
  const message = document.getElementById('toastMessage');

  toast.classList.remove('opacity-0', 'bg-green-600', 'bg-red-600');
  message.innerText = msg;

  if (tipo === "error") {
    toast.classList.add('bg-red-600');
    beepError.play(); // 🔊 toca som de erro
  } else {
    toast.classList.add('bg-green-600');
    beepSuccess.play(); // 🔊 toca som de sucesso
  }

  toast.classList.add('opacity-100');

  setTimeout(() => {
    toast.classList.remove('opacity-100');
    toast.classList.add('opacity-0');
  }, 2500);
}

// Abre modal de finalização
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

// Fecha modal
function fecharModal() {
  document.getElementById('modal').classList.add('hidden');
}

// Remove item do carrinho
function removerDoCarrinho(id) {
  carrinho = carrinho.filter(item => item.id !== id);
  atualizarContador();
  mostrarToast("Item removido", "success");

  carrinho.length === 0 ? fecharModal() : abrirModal();
}

// Envia pedido via fetch
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

  const valorTotal = carrinho.reduce((soma, item) => soma + item.preco * item.quantidade, 0);

  const pedido = {
    nome,
    telefone,
    produtos: carrinho,
    valor_total: valorTotal.toFixed(2)
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

// Aplica máscara no campo de telefone (formato: 37 998030748)
const telInput = document.getElementById('telefone');

telInput?.addEventListener('input', () => {
  let valor = telInput.value.replace(/\D/g, '');

  if (valor.length >= 2) {
    valor = valor.replace(/^(\d{2})(\d+)/g, '$1 $2');
  }

  telInput.value = valor.slice(0, 12); // Limita a 11 dígitos + espaço
});


