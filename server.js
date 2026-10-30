// TIZIU HUB — servidor (sem dependências). Serve o site e a API de avaliações.
// Uso:  ADMIN_TOKEN="uma-senha-longa-e-secreta" node server.js   (Node 18+)
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=__dirname,DATA_DIR=path.join(ROOT,'data'),DB=path.join(DATA_DIR,'reviews.json');
const PORT=process.env.PORT||3000,ADMIN_TOKEN=process.env.ADMIN_TOKEN||'',TRUST_PROXY=process.env.TRUST_PROXY==='1',SALT=process.env.IP_SALT||'tiziu-hub';
const MAX_PER_HOUR=3,MAX_BODY=5000;
const TYPES={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon'};

const load=()=>{try{return JSON.parse(fs.readFileSync(DB,'utf8'))}catch(e){return[]}};
const save=a=>{fs.mkdirSync(DATA_DIR,{recursive:true});const t=DB+'.tmp';fs.writeFileSync(t,JSON.stringify(a,null,1));fs.renameSync(t,DB)};
const send=(res,code,obj,extra={})=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra});res.end(JSON.stringify(obj))};
const clientIp=req=>(TRUST_PROXY&&req.headers['x-forwarded-for']?req.headers['x-forwarded-for'].split(',')[0].trim():req.socket.remoteAddress)||'';
const ipHash=ip=>crypto.createHash('sha256').update(SALT+ip).digest('hex').slice(0,16);
const clean=s=>String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E]/g,'').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim();
const readBody=req=>new Promise((ok,no)=>{let n=0,c=[];req.on('data',d=>{n+=d.length;if(n>MAX_BODY){no(Object.assign(new Error('big'),{code:413}));req.destroy()}else c.push(d)});req.on('end',()=>{try{ok(JSON.parse(Buffer.concat(c).toString('utf8')))}catch(e){no(Object.assign(new Error('json'),{code:400}))}});req.on('error',no)});

const fails=new Map(); // proteção contra força bruta no painel admin
function adminOk(req,res){
  if(!ADMIN_TOKEN){send(res,503,{error:'Painel admin desativado: defina ADMIN_TOKEN ao iniciar o servidor.'});return false}
  const ip=ipHash(clientIp(req)),f=fails.get(ip)||{n:0,t:Date.now()};
  if(Date.now()-f.t>9e5){f.n=0;f.t=Date.now()}
  if(f.n>=10){send(res,429,{error:'Muitas tentativas. Aguarde alguns minutos.'});return false}
  const got=Buffer.from((req.headers.authorization||'').replace(/^Bearer /,'')),want=Buffer.from(ADMIN_TOKEN);
  if(got.length!==want.length||!crypto.timingSafeEqual(got,want)){f.n++;fails.set(ip,f);send(res,401,{error:'Token inválido.'});return false}
  return true;
}
const publicList=()=>{
  const a=load().filter(r=>r.status==='approved').sort((x,y)=>y.createdAt.localeCompare(x.createdAt));
  const count=a.length,avg=count?a.reduce((s,r)=>s+r.rating,0)/count:0;
  return{reviews:a.map(({name,rating,comment,createdAt})=>({name,rating,comment,createdAt})),count,average:Math.round(avg*10)/10};
};


// ===== AUTENTICAÇÃO =====
// Senhas: scrypt com sal único (nunca em texto puro). Sessão: token aleatório em cookie HttpOnly; no servidor só o hash do token é guardado.
const USERS=path.join(DATA_DIR,'users.json'),SESS=path.join(DATA_DIR,'sessions.json'),SESSION_MS=30*24*3600*1000;
const readJ=(f,def)=>{try{return JSON.parse(fs.readFileSync(f,'utf8'))}catch(e){return def}};
const writeJ=(f,o)=>{fs.mkdirSync(DATA_DIR,{recursive:true});const t=f+'.tmp';fs.writeFileSync(t,JSON.stringify(o,null,1),{mode:0o600});fs.renameSync(t,f)};
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const scrypt=(pw,salt)=>new Promise((ok,no)=>crypto.scrypt(pw,salt,64,{N:16384,r:8,p:1},(e,k)=>e?no(e):ok(k)));
async function hashPw(pw){const salt=crypto.randomBytes(16);return 'scrypt$'+salt.toString('hex')+'$'+(await scrypt(pw,salt)).toString('hex')}
async function checkPw(pw,stored){const [,sl,h]=stored.split('$'),k=await scrypt(pw,Buffer.from(sl,'hex')),hb=Buffer.from(h,'hex');return k.length===hb.length&&crypto.timingSafeEqual(k,hb)}
let DUMMY='';(async()=>{DUMMY=await hashPw('senha-falsa-para-igualar-tempo')})();
const EMAIL_RE=/^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;
const publicUser=u=>({username:u.username,email:u.email,createdAt:u.createdAt,favorites:u.favorites||[]});
const sameOrigin=req=>{const o=req.headers.origin;if(!o)return true;try{return new URL(o).host===req.headers.host}catch(e){return false}};
const isHttps=req=>!!req.socket.encrypted||(TRUST_PROXY&&req.headers['x-forwarded-proto']==='https');
const cookieOf=req=>{const m=/(?:^|;\s*)tiziu_sid=([0-9a-f]{64})/.exec(req.headers.cookie||'');return m?m[1]:null};
const setCookie=(req,val,age)=>({'Set-Cookie':`tiziu_sid=${val}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${isHttps(req)?'; Secure':''}`});
function newSession(userId){const tok=crypto.randomBytes(32).toString('hex'),S=readJ(SESS,{}),now=Date.now();for(const k in S)if(S[k].exp<now)delete S[k];S[sha(tok)]={userId,exp:now+SESSION_MS};writeJ(SESS,S);return tok}
function sessionUser(req){const t=cookieOf(req);if(!t)return null;const s=readJ(SESS,{})[sha(t)];if(!s||s.exp<Date.now())return null;return readJ(USERS,[]).find(u=>u.id===s.userId)||null}
const rl=new Map();
function tooMany(key,max,ms){const f=rl.get(key);return !!f&&Date.now()-f.t<ms&&f.n>=max}
function hit(key,ms){const f=rl.get(key);if(f&&Date.now()-f.t<ms)f.n++;else rl.set(key,{n:1,t:Date.now()})}

async function auth(req,res,url){
  const ip=ipHash(clientIp(req));
  if(url==='/api/auth/me'&&req.method==='GET'){const u=sessionUser(req);return send(res,200,{user:u?publicUser(u):null})}
  if(req.method!=='POST')return false;
  if(url==='/api/auth/logout'){const t=cookieOf(req);if(t){const S=readJ(SESS,{});delete S[sha(t)];writeJ(SESS,S)}return send(res,200,{ok:true},setCookie(req,'',0))}
  if(url==='/api/auth/register'){
    if(tooMany('reg'+ip,5,36e5))return send(res,429,{error:'Muitas tentativas de cadastro. Tente novamente mais tarde.'});
    const b=await readBody(req);if(!b||typeof b!=='object')return send(res,400,{error:'Dados inválidos.'});
    const username=clean(b.username||''),email=String(b.email||'').trim().toLowerCase(),pw=String(b.password||'');
    if(!/^[A-Za-zÀ-ÿ0-9 _.-]{3,30}$/.test(username))return send(res,400,{error:'Nome de usuário: 3 a 30 caracteres (letras, números, espaço, _ . -).'});
    if(!EMAIL_RE.test(email)||email.length>120)return send(res,400,{error:'Informe um e-mail válido.'});
    if(pw.length<8||pw.length>128)return send(res,400,{error:'A senha deve ter de 8 a 128 caracteres.'});
    if(pw!==String(b.confirm||''))return send(res,400,{error:'As senhas não são iguais.'});
    hit('reg'+ip,36e5);
    const pass=await hashPw(pw),users=readJ(USERS,[]); // leitura e gravação em seguida, sem pausa: evita cadastro duplicado
    if(users.some(u=>u.email===email))return send(res,409,{error:'Já existe uma conta com este e-mail.'});
    const u={id:crypto.randomUUID(),username,email,pass,createdAt:new Date().toISOString(),favorites:[]};
    users.push(u);writeJ(USERS,users);
    return send(res,201,{user:publicUser(u)},setCookie(req,newSession(u.id),SESSION_MS/1000));
  }
  if(url==='/api/auth/login'){
    if(tooMany('log'+ip,10,9e5))return send(res,429,{error:'Muitas tentativas. Aguarde alguns minutos e tente de novo.'});
    const b=await readBody(req),email=String((b&&b.email)||'').trim().toLowerCase(),pw=String((b&&b.password)||'').slice(0,128);
    const u=readJ(USERS,[]).find(x=>x.email===email),ok=await checkPw(pw,u?u.pass:DUMMY)&&!!u;
    if(!ok){hit('log'+ip,9e5);return send(res,401,{error:'E-mail ou senha incorretos.'})}
    rl.delete('log'+ip);
    return send(res,200,{user:publicUser(u)},setCookie(req,newSession(u.id),SESSION_MS/1000));
  }
  if(url==='/api/account/favorites'){
    const u=sessionUser(req);if(!u)return send(res,401,{error:'Entre na sua conta para favoritar jogos.'});
    const b=await readBody(req),id=Number(b&&b.productId);
    if(!Number.isInteger(id)||id<1||id>99999)return send(res,400,{error:'Produto inválido.'});
    const users=readJ(USERS,[]),me=users.find(x=>x.id===u.id);let f=me.favorites||[];
    if(b.on){if(!f.includes(id)){if(f.length>=200)return send(res,400,{error:'Limite de favoritos atingido.'});f.push(id)}}else f=f.filter(x=>x!==id);
    me.favorites=f;writeJ(USERS,users);return send(res,200,{favorites:f});
  }
  return false;
}

async function api(req,res,url){
  try{
    if(req.method==='POST'&&!sameOrigin(req))return send(res,403,{error:'Origem não permitida.'});
    if(url.startsWith('/api/auth/')||url.startsWith('/api/account/')){
      if(req.method==='POST'&&!/^application\/json/i.test(req.headers['content-type']||''))return send(res,415,{error:'Formato inválido.'});
      if(url==='/api/account/reviews'&&req.method==='GET'){const u=sessionUser(req);if(!u)return send(res,401,{error:'Entre na sua conta.'});return send(res,200,{reviews:load().filter(r=>r.userId===u.id).sort((x,y)=>y.createdAt.localeCompare(x.createdAt)).map(({rating,comment,createdAt,status})=>({rating,comment,createdAt,status}))})}
      const r=await auth(req,res,url);if(r!==false)return;
    }
    if(url==='/api/reviews'&&req.method==='GET')return send(res,200,publicList());
    if(url==='/api/reviews'&&req.method==='POST'){
      if(!/^application\/json/i.test(req.headers['content-type']||''))return send(res,415,{error:'Formato inválido.'});
      const b=await readBody(req);
      if(b===null||typeof b!=='object')return send(res,400,{error:'Dados inválidos.'});
      if(b.website)return send(res,400,{error:'Envio recusado.'}); // campo isca (honeypot) preenchido por robôs
      const name=clean(b.name||''),comment=clean(b.comment||''),rating=Number(b.rating);
      if(typeof b.name!=='string'||name.length<2||name.length>40)return send(res,400,{error:'Informe um nome ou apelido (2 a 40 caracteres).'});
      if(!Number.isInteger(rating)||rating<1||rating>5)return send(res,400,{error:'Escolha uma nota de 1 a 5 estrelas.'});
      if(typeof b.comment!=='string'||comment.length<10||comment.length>500)return send(res,400,{error:'O comentário deve ter entre 10 e 500 caracteres.'});
      if(/https?:\/\/|www\./i.test(comment+' '+name))return send(res,400,{error:'Links não são permitidos na avaliação.'});
      const all=load(),h=ipHash(clientIp(req)),hourAgo=new Date(Date.now()-36e5).toISOString();
      if(all.filter(r=>r.ipHash===h&&r.createdAt>hourAgo).length>=MAX_PER_HOUR)return send(res,429,{error:'Você enviou muitas avaliações em pouco tempo. Tente novamente mais tarde.'});
      if(all.some(r=>r.comment.toLowerCase()===comment.toLowerCase()))return send(res,409,{error:'Esta avaliação já foi enviada.'});
      all.push({id:crypto.randomUUID(),name,rating,comment,createdAt:new Date().toISOString(),status:'pending',ipHash:h,userId:(sessionUser(req)||{}).id||null});
      save(all);
      return send(res,201,{ok:true,message:'Avaliação recebida! Ela será publicada depois de aprovada pela equipe TIZIU HUB.'});
    }
    if(url==='/api/admin/reviews'&&req.method==='GET'){
      if(!adminOk(req,res))return;
      return send(res,200,{reviews:load().map(({ipHash,userId,...r})=>r).sort((x,y)=>y.createdAt.localeCompare(x.createdAt))});
    }
    const m=url.match(/^\/api\/admin\/reviews\/([0-9a-f-]{36})$/);
    if(m&&req.method==='POST'){
      if(!adminOk(req,res))return;
      const b=await readBody(req),all=load(),i=all.findIndex(r=>r.id===m[1]);
      if(i<0)return send(res,404,{error:'Avaliação não encontrada.'});
      if(b.action==='approve')all[i].status='approved';
      else if(b.action==='reject')all[i].status='rejected';
      else if(b.action==='delete')all.splice(i,1);
      else return send(res,400,{error:'Ação inválida.'});
      save(all);return send(res,200,{ok:true});
    }
    send(res,404,{error:'Rota não encontrada.'});
  }catch(e){send(res,e.code===413?413:e.code===400?400:500,{error:e.code===413?'Envio grande demais.':e.code===400?'Dados inválidos.':'Erro interno.'})}
}

http.createServer((req,res)=>{
  const url=req.url.split('?')[0];
  if(url.startsWith('/api/'))return api(req,res,url);
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end()}
  let rel;try{rel=decodeURIComponent(url)}catch(e){res.writeHead(400);return res.end()}
  if(rel==='/')rel='/index.html';
  const file=path.normalize(path.join(ROOT,rel));
  const blocked=!file.startsWith(ROOT+path.sep)||/(^|[\\/])(\.|data[\\/]|node_modules)/.test(path.relative(ROOT,file))||path.basename(file)==='server.js';
  const type=TYPES[path.extname(file).toLowerCase()];
  if(blocked||!type||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);return res.end('404')}
  res.writeHead(200,{'Content-Type':type,'X-Content-Type-Options':'nosniff'});fs.createReadStream(file).pipe(res);
}).listen(PORT,()=>console.log('TIZIU HUB em http://localhost:'+PORT+(ADMIN_TOKEN?'  (admin: /admin.html)':'  (ADMIN_TOKEN não definido: moderação desativada)')));
