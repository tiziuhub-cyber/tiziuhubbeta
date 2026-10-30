const $=s=>document.querySelector(s);
const brl=n=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const hasPrice=p=>typeof p.price==='number'&&p.price>0;
const finalPrice=p=>!hasPrice(p)?0:(p.discount>0?p.price*(1-p.discount/100):p.price);
let cart=[];try{cart=JSON.parse(localStorage.getItem('tiziu_cart'))||[]}catch(e){}
const save=()=>{try{localStorage.setItem('tiziu_cart',JSON.stringify(cart))}catch(e){}};
function cardHTML(p){
  const off=hasPrice(p)&&p.discount>0;
  return `<article class="card">${off?`<span class="badge">-${p.discount}%</span>`:''}
  <img src="${p.image}" alt="${p.name}" loading="lazy">
  <button class="fav${window.isFav&&isFav(p.id)?' on':''}" data-fav="${p.id}" aria-label="Favoritar ${p.name}" title="Favoritar">♥</button>
  <div class="cbody"><h3>${p.name}</h3><p>${p.description}</p>
  <div>${off?`<span class="old">${brl(p.price)}</span>`:''}<span class="price">${hasPrice(p)?brl(finalPrice(p)):'Preço a definir'}</span></div>
  <div class="cbtns">
  <a class="btn btn-gold ${p.available?'':'off'}" href="${p.checkoutUrl}" target="_blank" rel="noopener">${p.available?'COMPRAR AGORA':'INDISPONÍVEL'}</a>
  <button class="btn btn-line ${p.available?'':'off'}" onclick="addToCart(${p.id})">ADICIONAR AO CARRINHO</button></div></div></article>`;
}
function fill(sel,list,msg){$(sel).innerHTML=list.length?list.map(cardHTML).join(''):`<p class="empty">${msg}</p>`}
let activeCat=null; // null = todos os jogos
function renderCats(){
  $('#catGrid').innerHTML=CATEGORIES.map(c=>{
    const n=PRODUCTS.filter(p=>p.category===c.name).length;
    return `<button class="cat${c.name===activeCat?' active':''}" data-cat="${c.name}" aria-pressed="${c.name===activeCat}"><span class="cico">${c.icon}</span><b>${c.name}</b><small>${n?n+(n>1?' jogos':' jogo'):'Em breve'}</small></button>`}).join('');
  $('#catAll').classList.toggle('active',!activeCat);
}
function selectCat(name){
  activeCat=name;renderCats();renderAll();
  $('#jogos').scrollIntoView();
}
$('#catGrid').addEventListener('click',e=>{const b=e.target.closest('.cat');if(b)selectCat(b.dataset.cat)});
$('#catAll').onclick=()=>selectCat(null);
function renderAll(){
  const q=$('#searchInput').value.trim().toLowerCase();
  const list=PRODUCTS.filter(p=>p.name.toLowerCase().includes(q));
  const games=activeCat?list.filter(p=>p.category===activeCat):list;
  $('#gamesTitle').textContent=activeCat?'JOGOS · '+activeCat.toUpperCase():'JOGOS';
  const catHasAny=!activeCat||PRODUCTS.some(p=>p.category===activeCat);
  fill('#gamesGrid',games,catHasAny?'Nenhum produto encontrado.':'Em breve, novos jogos desta categoria estarão disponíveis.');
  fill('#bestGrid',list.filter(p=>p.bestSeller),q?'Nenhum produto encontrado.':'Em breve.');
}
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),1800)}
function addToCart(id){
  const p=PRODUCTS.find(x=>x.id===id);if(!p||!p.available)return;
  const it=cart.find(c=>c.id===id);it?it.qty++:cart.push({id,qty:1});
  save();renderCart();toast('Produto adicionado ao carrinho');
  $('#count').animate([{transform:'scale(1.5)'},{transform:'scale(1)'}],{duration:250});
}
function changeQty(id,d){const it=cart.find(c=>c.id===id);if(!it)return;it.qty+=d;if(it.qty<=0)removeItem(id);else{save();renderCart()}}
function removeItem(id){cart=cart.filter(c=>c.id!==id);save();renderCart()}
function renderCart(){
  cart=cart.filter(c=>PRODUCTS.some(p=>p.id===c.id));
  let total=0,n=0,pending=false;
  $('#cartItems').innerHTML=cart.length?cart.map(c=>{
    const p=PRODUCTS.find(x=>x.id===c.id);total+=finalPrice(p)*c.qty;n+=c.qty;if(!hasPrice(p))pending=true;
    return `<div class="item"><img src="${p.image}" alt=""><div><b>${p.name}</b><br><small>${hasPrice(p)?brl(finalPrice(p)):'Preço a definir'}</small>
    <div class="qty"><button onclick="changeQty(${p.id},-1)" aria-label="Diminuir">−</button><span>${c.qty}</span><button onclick="changeQty(${p.id},1)" aria-label="Aumentar">+</button>
    <button class="rm" onclick="removeItem(${p.id})">Remover</button></div></div></div>`}).join(''):'<p class="empty">Seu carrinho está vazio.</p>';
  $('#cartNote').textContent=pending?'Itens com preço a definir não estão incluídos no total.':'';$('#subtotal').textContent=brl(total);$('#total').textContent=brl(total);
  $('#count').textContent=n;$('#count').style.display=n?'grid':'none';
  // O pagamento é externo (Cakto): um botão de finalização por produto, com o link de cada um.
  $('#checkoutLinks').innerHTML=cart.map(c=>{const p=PRODUCTS.find(x=>x.id===c.id);return `<a class="btn btn-gold" href="${p.checkoutUrl}" target="_blank" rel="noopener">FINALIZAR: ${p.name}</a>`}).join('');
}
const cartToggle=o=>{$('#cart').classList.toggle('open',o);$('#overlay').classList.toggle('open',o)};
$('#cartBtn').onclick=()=>cartToggle(true);$('#closeCart').onclick=$('#overlay').onclick=()=>cartToggle(false);
function searchToggle(o){const b=$('#searchBar');b.classList.toggle('open',o);if(o)$('#searchInput').focus();else{$('#searchInput').value='';renderAll()}}
$('#searchBtn').onclick=()=>searchToggle(!$('#searchBar').classList.contains('open'));
$('#closeSearch').onclick=()=>searchToggle(false);
$('#searchInput').oninput=e=>{renderAll(e.target.value);if(e.target.value)$('#jogos').scrollIntoView()};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){searchToggle(false);cartToggle(false)}});
$('#menuBtn').onclick=()=>$('nav').classList.toggle('open');
document.querySelectorAll('nav a').forEach(a=>a.onclick=()=>$('nav').classList.remove('open'));
renderCats();renderAll();renderCart();
