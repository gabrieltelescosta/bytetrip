const supabaseUrl = 'https://iwgizrizoagjtaivwjcf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3Z2l6cml6b2FnanRhaXZ3amNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjA3ODMsImV4cCI6MjA2MDAzNjc4M30.0V1iGuJlzm6rP1ibfBdQc-fQa12bz8bM2Xclnp1PDqU'; // sua anon key
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let produtoEditando = null;

const loginContainer = document.getElementById('loginContainer');
const adminContainer = document.getElementById('adminContainer');
const listaProdutos = document.getElementById('listaProdutos');

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = e.target.email.value;
  const senha = e.target.senha.value;

  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) return alert('Credenciais inválidas');
  e.target.reset();
  mostrarPainel();
});

supabase.auth.getSession().then(({ data }) => {
  if (data.session) mostrarPainel();
});

function logout() {
  supabase.auth.signOut().then(() => location.reload());
}

async function mostrarPainel() {
  loginContainer.classList.add('hidden');
  adminContainer.classList.remove('hidden');
  carregarProdutos();
}

async function carregarProdutos() {
  const ordenarPor = document.getElementById('ordenarSelect')?.value || 'created_at';

  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .order(ordenarPor, { ascending: ordenarPor === 'nome' });

  if (error) return alert('Erro ao carregar produtos');

  const lista = document.getElementById('listaProdutos');
  lista.innerHTML = '';

  data.forEach((prod, index) => {
    const div = document.createElement('div');
    div.className = 'bg-gray-800 rounded p-4 flex flex-col gap-2 shadow';
  
    // 💫 Animação com delay progressivo
    div.setAttribute('data-aos', 'fade-up');
    div.setAttribute('data-aos-delay', index * 100); // 100ms de diferença entre cada
  
    div.innerHTML = `
      <img src="${prod.imagem_url}" alt="${prod.nome}" class="w-full h-40 object-cover rounded mb-2" />
      <p class="text-pink-400 font-semibold text-sm">${prod.nome}</p>
      <p class="text-gray-300 text-xs">${prod.descricao}</p>
      <p class="text-green-400 font-bold text-sm">R$ ${parseFloat(prod.preco).toFixed(2)}</p>
      <div class="flex justify-between mt-auto gap-2">
        <button onclick="editarProduto('${prod.id}')" class="text-yellow-400 text-xs hover:underline">Editar</button>
        <button onclick="removerProduto('${prod.id}')" class="text-red-400 text-xs hover:underline">Remover</button>
      </div>
    `;
    lista.appendChild(div);
  });
  
  // 🔄 Atualiza as animações depois de inserir
  AOS.refresh();
  
}

document.getElementById('produtoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;

  const produto = {
    nome: form.nome.value,
    descricao: form.descricao.value,
    preco: parseFloat(form.preco.value),
    imagem_url: form.imagem_url.value
  };

  let error;
  if (produtoEditando) {
    ({ error } = await supabase.from('produtos').update(produto).eq('id', produtoEditando));
  } else {
    ({ error } = await supabase.from('produtos').insert([produto]));
  }

  if (error) return alert('Erro ao salvar produto');

  form.reset();
  form.querySelector('button').textContent = "Adicionar Produto";
  produtoEditando = null;
  document.getElementById('cancelarEdicaoBtn').classList.add('hidden');
  mostrarToast();
  carregarProdutos();
});

async function editarProduto(id) {
  const { data, error } = await supabase.from('produtos').select('*').eq('id', id).single();
  if (error) return alert('Erro ao carregar produto para edição');

  const form = document.getElementById('produtoForm');
  form.nome.value = data.nome;
  form.descricao.value = data.descricao;
  form.preco.value = data.preco;
  form.imagem_url.value = data.imagem_url;

  produtoEditando = id;
  form.querySelector('button').textContent = "Salvar Alterações";
  document.getElementById('cancelarEdicaoBtn').classList.remove('hidden');
}

async function removerProduto(id) {
  const { error } = await supabase.from('produtos').delete().eq('id', id);
  if (!error) carregarProdutos();
}

function cancelarEdicao() {
  const form = document.getElementById('produtoForm');
  form.reset();
  form.querySelector('button').textContent = "Adicionar Produto";
  produtoEditando = null;
  document.getElementById('cancelarEdicaoBtn').classList.add('hidden');
}

const beepSuccess = new Audio('/assets/sounds/success.mp3');
const beepError = new Audio('/assets/sounds/error.mp3');

function mostrarToast(msg = "Tudo certo!", tipo = "success") {
  const toast = document.getElementById('toast');
  toast.innerText = msg;
  toast.classList.remove('hidden');

  if (tipo === "error") {
    toast.classList.remove('bg-green-600');
    toast.classList.add('bg-red-600');
    beepError.play();
  } else {
    toast.classList.remove('bg-red-600');
    toast.classList.add('bg-green-600');
    beepSuccess.play();
  }

  setTimeout(() => toast.classList.add('hidden'), 2500);
}



