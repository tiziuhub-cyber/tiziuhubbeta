// Avaliações: conversa com a API do server.js (mesmo endereço do site).
// Se o site ficar em um endereço diferente do servidor, troque por a URL completa, ex.: "https://api.seudominio.com/api/reviews"
const REVIEWS_API="/api/reviews";
const $r=s=>document.querySelector(s);
const stars=n=>'★'.repeat(n)+'☆'.repeat(5-n);
const rForm=$r('#reviewForm'),rMsg=$r('#reviewMsg');
function say(t,cls){rMsg.className=cls||'';rMsg.textContent=t}

async function loadReviews(){
  const list=$r('#reviewList'),sum=$r('#reviewSummary');
  try{
    const r=await fetch(REVIEWS_API,{cache:'no-store'});if(!r.ok)throw 0;
    const d=await r.json();
    sum.textContent=d.count?`${d.average.toFixed(1).replace('.',',')} ★ · ${d.count} ${d.count>1?'avaliações':'avaliação'}`:'Ainda sem avaliações';
    list.textContent='';
    if(!d.count){const p=document.createElement('p');p.className='empty';p.textContent='Ainda não há avaliações publicadas. Seja o primeiro a avaliar!';list.append(p);return}
    d.reviews.forEach(v=>{
      const c=document.createElement('article');c.className='rcard';
      const top=document.createElement('div');top.className='rtop';
      const n=document.createElement('b');n.textContent=v.name;
      const s=document.createElement('span');s.className='rstars';s.textContent=stars(v.rating);s.setAttribute('aria-label',v.rating+' de 5 estrelas');
      const dt=document.createElement('small');dt.textContent=new Date(v.createdAt).toLocaleDateString('pt-BR');
      top.append(n,s,dt);
      const p=document.createElement('p');p.textContent=v.comment;
      c.append(top,p);list.append(c);
    });
  }catch(e){
    sum.textContent='';list.textContent='';
    const p=document.createElement('p');p.className='empty';p.textContent='Não foi possível carregar as avaliações no momento.';list.append(p);
  }
}

rForm.addEventListener('submit',async e=>{
  e.preventDefault();
  const f=new FormData(rForm),name=f.get('rname').trim(),comment=f.get('rcomment').trim(),rating=Number(f.get('rating'));
  if(name.length<2)return say('Informe seu nome ou apelido.','err');
  if(!rating)return say('Escolha uma nota de 1 a 5 estrelas.','err');
  if(comment.length<10)return say('Escreva um comentário com pelo menos 10 caracteres.','err');
  const btn=rForm.querySelector('button[type=submit]');btn.disabled=true;say('Enviando...');
  try{
    const r=await fetch(REVIEWS_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,rating,comment,website:f.get('website')})});
    const d=await r.json().catch(()=>({}));
    if(!r.ok)say(d.error||'Não foi possível enviar sua avaliação.','err');
    else{say(d.message,'ok');rForm.reset();loadReviews()}
  }catch(_){say('Não foi possível enviar: o servidor de avaliações está indisponível. Sua avaliação não foi salva.','err')}
  btn.disabled=false;
});
$r('#rcomment').addEventListener('input',e=>{$r('#rcount').textContent=e.target.value.length+'/500'});
loadReviews();
