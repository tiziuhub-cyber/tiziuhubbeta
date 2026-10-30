// ===== CONFIGURAÇÃO DE CONTATO =====
const CONTACT_EMAIL = "tiziuhub@gmail.com";   // e-mail oficial da loja
const WHATSAPP_URL  = "https://wa.me/5582988977671";

const gmailUrl=(to,subject='',body='')=>
  'https://mail.google.com/mail/?view=cm&fs=1&to='+encodeURIComponent(to)+
  (subject?'&su='+encodeURIComponent(subject):'')+(body?'&body='+encodeURIComponent(body):'');

// Botão ENVIAR E-MAIL: abre a composição do Gmail em nova aba
const mailBtn=document.getElementById('mailBtn');
mailBtn.href=gmailUrl(CONTACT_EMAIL);
document.getElementById('mailText').textContent=CONTACT_EMAIL;

// Formulário: valida e abre o Gmail com tudo preenchido (o visitante ainda clica em "Enviar" no Gmail)
const form=document.getElementById('contactForm'),msg=document.getElementById('formMsg');
form.addEventListener('submit',e=>{
  e.preventDefault();msg.className='';msg.textContent='';
  if(!form.checkValidity()){form.reportValidity();return;}
  const f=new FormData(form);
  const body='Nome: '+f.get('nome').trim()+'\nE-mail para retorno: '+f.get('email').trim()+'\n\nMensagem:\n'+f.get('mensagem').trim();
  const url=gmailUrl(CONTACT_EMAIL,f.get('assunto').trim(),body);
  // Nova aba normal (sem o 3º parâmetro de "features", que faria o navegador abrir um pop-up)
  const win=window.open(url,'_blank');
  if(win){try{win.opener=null}catch(_){}}
  msg.className='info';msg.innerHTML='';
  const p=document.createElement('span');
  p.textContent=win
    ? 'O Gmail foi aberto em outra aba, mas sua mensagem ainda não foi enviada. Ela só será enviada quando você clicar em Enviar no Gmail. '
    : 'O navegador bloqueou a nova aba e sua mensagem ainda não foi enviada. Abra o Gmail manualmente: ';
  msg.appendChild(p);
  const g=document.createElement('a');g.href=url;g.target='_blank';g.rel='noopener';g.textContent=win?'Abrir o Gmail novamente':'Abrir o Gmail';msg.appendChild(g);
  msg.appendChild(document.createTextNode(' · Se o Gmail não abrir, fale conosco pelo '));
  const w=document.createElement('a');w.href=WHATSAPP_URL;w.target='_blank';w.rel='noopener';w.textContent='WhatsApp';msg.appendChild(w);
  msg.appendChild(document.createTextNode('.'));
});
