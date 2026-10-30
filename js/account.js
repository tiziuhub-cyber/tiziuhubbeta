// Conta de usuário: conversa com a API do server.js. Nenhuma senha é guardada no navegador;
// a sessão é um cookie HttpOnly emitido pelo servidor.
(()=>{
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let user=null,tab='conta';
async function api(path,opt={}){
  let r;try{r=await fetch('/api'+path,{cache:'no-store',...opt,headers:{'Content-Type':'application/json'}})}
  catch(_){throw new Error('Não foi possível conectar ao servidor. Abra o site pelo servidor (node server.js).')}
  let d={};try{d=await r.json()}catch(_){}
  if(!r.ok)throw new Error(d.error||'Erro inesperado. Tente novamente.');
  return d;
}
const EMAIL=/^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;
const brl=n=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const say=(el,t,ok)=>{el.textContent=t;el.className='amsg'+(ok?' ok':'')};
const refresh=()=>{if(window.renderAll)renderAll()};
window.isFav=id=>!!(user&&user.favorites.includes(id));

function header(){
  $('#userBtn .ulabel').textContent=user?user.username.toUpperCase():'ENTRAR';
  $('#userBtn').classList.toggle('on',!!user);
  if(!user)closeMenu();
}
function closeMenu(){$('#userMenu').hidden=true;$('#userBtn').setAttribute('aria-expanded','false')}
// ----- modais -----
function openModal(id){
  closeMenu();$$('.modal').forEach(m=>m.hidden=true);
  $('#mback').hidden=false;$(id).hidden=false;
  const f=$(id).querySelector('input');if(f&&!f.closest('[hidden]'))f.focus({preventScroll:true});
}
function closeAll(){$$('.modal').forEach(m=>m.hidden=true);$('#mback').hidden=true}
function view(v){['vLogin','vRegister','vForgot'].forEach(x=>$('#'+x).hidden=x!==v);say($('#loginMsg'),'');say($('#registerMsg'),'');
  const f=$('#'+v).querySelector('input');if(f)f.focus({preventScroll:true})}
function openLogin(msg){openModal('#authModal');view('vLogin');if(msg)say($('#loginMsg'),msg)}
$('#mback').onclick=closeAll;
document.addEventListener('click',e=>{
  if(e.target.closest('[data-close]')&&!e.target.closest('#userMenu'))closeAll();
  const g=e.target.closest('[data-go]');if(g){e.preventDefault();view(g.dataset.go)}
  if(!e.target.closest('.userwrap'))closeMenu();
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeAll();closeMenu()}});

$('#userBtn').onclick=()=>{
  if(!user)return openLogin();
  const m=$('#userMenu');m.hidden=!m.hidden;$('#userBtn').setAttribute('aria-expanded',String(!m.hidden));
};
$('#userMenu').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.act==='sair')return logout();
  openAccount(b.dataset.tab);
});
// ----- login / cadastro -----
$('#loginForm').addEventListener('submit',async e=>{
  e.preventDefault();const f=new FormData(e.target),msg=$('#loginMsg');
  const email=f.get('email').trim(),password=f.get('password');
  if(!EMAIL.test(email))return say(msg,'Informe um e-mail válido.');
  if(!password)return say(msg,'Informe sua senha.');
  const btn=e.target.querySelector('button');btn.disabled=true;say(msg,'Entrando...',true);
  try{const d=await api('/auth/login',{method:'POST',body:JSON.stringify({email,password})});
    user=d.user;e.target.reset();say(msg,'');closeAll();header();refresh();if(window.toast)toast('Bem-vindo(a), '+user.username+'!');
  }catch(err){say(msg,err.message)}
  btn.disabled=false;
});
$('#registerForm').addEventListener('submit',async e=>{
  e.preventDefault();const f=new FormData(e.target),msg=$('#registerMsg');
  const username=f.get('username').trim(),email=f.get('email').trim(),password=f.get('password'),confirm=f.get('confirm');
  if(username.length<3)return say(msg,'Informe um nome de usuário (mínimo de 3 caracteres).');
  if(!EMAIL.test(email))return say(msg,'Informe um e-mail válido.');
  if(!password)return say(msg,'Informe uma senha.');
  if(password.length<8)return say(msg,'A senha deve ter pelo menos 8 caracteres.');
  if(password!==confirm)return say(msg,'As senhas não são iguais.');
  const btn=e.target.querySelector('button');btn.disabled=true;say(msg,'Criando conta...',true);
  try{const d=await api('/auth/register',{method:'POST',body:JSON.stringify({username,email,password,confirm})});
    user=d.user;e.target.reset();say(msg,'');closeAll();header();refresh();if(window.toast)toast('Conta criada! Bem-vindo(a), '+user.username+'!');
  }catch(err){say(msg,err.message)}
  btn.disabled=false;
});
async function logout(){
  try{await api('/auth/logout',{method:'POST',body:'{}'})}catch(_){}
  user=null;closeAll();header();refresh();if(window.toast)toast('Você saiu da conta.');
}
$('#logoutBtn').onclick=logout;
// ----- Minha conta -----
const el=(t,c,x)=>{const n=document.createElement(t);if(c)n.className=c;if(x!==undefined)n.textContent=x;return n};
async function openAccount(t){tab=t==='jogos'||t==='avaliacoes'||t==='pedidos'||t==='favoritos'?t:'conta';openModal('#accModal');await renderTab()}
$('#accModal .tabs').addEventListener('click',e=>{const b=e.target.closest('button');if(b){tab=b.dataset.tab;renderTab()}});
async function renderTab(){
  $$('#accModal .tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===tab));
  const box=$('#accBody');box.textContent='';
  if(!user)return;
  if(tab==='conta'){
    const g=el('div','accgrid');
    [['Nome de usuário',user.username],['E-mail',user.email],['Conta criada em',new Date(user.createdAt).toLocaleDateString('pt-BR')],['Favoritos',String(user.favorites.filter(id=>PRODUCTS.some(p=>p.id===id)).length)]].forEach(([k,v])=>{
      const d=el('div','accitem');d.append(el('small','',k),el('b','',v));g.append(d)});
    box.append(g);
  }else if(tab==='pedidos'||tab==='jogos'){
    box.append(el('p','empty',tab==='pedidos'?'Nenhum pedido para mostrar aqui.':'Nenhum jogo para mostrar aqui.'),
      el('p','ainfo','As compras são finalizadas e pagas na Cakto. Esta área ainda não está conectada ao sistema de pagamento, por isso os pedidos e os jogos comprados não são listados aqui. Em caso de dúvida sobre uma compra, fale conosco pela seção de contato.'));
  }else if(tab==='favoritos'){
    const favs=user.favorites.map(id=>PRODUCTS.find(p=>p.id===id)).filter(Boolean);
    if(!favs.length)box.append(el('p','empty','Você ainda não favoritou nenhum jogo. Use o coração ♥ nos cards da loja.'));
    favs.forEach(p=>{
      const r=el('div','favrow'),i=el('img');i.src=p.image;i.alt='';
      const t=el('div');t.append(el('b','',p.name),el('small','',typeof p.price==='number'&&p.price>0?brl(p.discount>0?p.price*(1-p.discount/100):p.price):''));
      const buy=el('a','btn btn-gold','COMPRAR AGORA');buy.href=p.checkoutUrl;buy.target='_blank';buy.rel='noopener';
      const rm=el('button','btn btn-line','REMOVER');rm.onclick=()=>toggleFav(p.id,false).then(renderTab);
      r.append(i,t,buy,rm);box.append(r);
    });
  }else{
    box.append(el('p','empty','Carregando...'));
    try{
      const d=await api('/account/reviews');box.textContent='';
      if(!d.reviews.length)box.append(el('p','empty','Você ainda não enviou nenhuma avaliação.'));
      const lab={pending:'Em análise',approved:'Publicada',rejected:'Não publicada'};
      d.reviews.forEach(v=>{const c=el('article','rcard'),top=el('div','rtop');
        top.append(el('span','rstars','★'.repeat(v.rating)+'☆'.repeat(5-v.rating)),el('small','',new Date(v.createdAt).toLocaleDateString('pt-BR')+' · '+(lab[v.status]||v.status)));
        c.append(top,el('p','',v.comment));box.append(c)});
    }catch(err){box.textContent='';box.append(el('p','empty',err.message))}
  }
}
// ----- favoritos (coração nos cards) -----
async function toggleFav(id,on){
  const d=await api('/account/favorites',{method:'POST',body:JSON.stringify({productId:id,on})});
  user.favorites=d.favorites;refresh();
}
document.addEventListener('click',async e=>{
  const b=e.target.closest('.fav');if(!b)return;
  if(!user)return openLogin('Entre na sua conta para favoritar jogos.');
  const id=Number(b.dataset.fav),on=!user.favorites.includes(id);
  try{await toggleFav(id,on);if(window.toast)toast(on?'Adicionado aos favoritos':'Removido dos favoritos')}catch(err){if(window.toast)toast(err.message)}
});
// ----- sessão: o servidor confirma quem está logado (não há "login" guardado no navegador) -----
api('/auth/me').then(d=>{user=d.user;header();refresh()}).catch(()=>{header()});
})();
