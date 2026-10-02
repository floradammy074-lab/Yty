function face(skin,hair,bg,extra){return '<svg viewBox="0 0 44 44" width="100%" height="100%"><rect width="44" height="44" fill="'+bg+'"/><path d="M6 44c2-10 9-13 16-13s14 3 16 13z" fill="#2d3a55"/><circle cx="22" cy="21" r="9" fill="'+skin+'"/><path d="M12.5 20c0-8 5-11 10-11s9 3 9 10c-2-4-5-5-9-5s-7 2-10 6z" fill="'+hair+'"/>'+(extra||'')+'<circle cx="18.5" cy="21" r="1" fill="#222"/><circle cx="25.5" cy="21" r="1" fill="#222"/><path d="M19 25.5q3 2 6 0" stroke="#7a3b2a" stroke-width="1.2" fill="none" stroke-linecap="round"/></svg>'}
const glasses='<g fill="none" stroke="#222" stroke-width="1"><circle cx="18.5" cy="21" r="2.6"/><circle cx="25.5" cy="21" r="2.6"/></g>';
const beard='<path d="M14 24q8 12 16 0q-2 8-8 8t-8-8z" fill="#3a2418"/>';
document.getElementById('me').innerHTML=face('#e9b98a','#2b1a10','#f4d35e',glasses);

document.addEventListener('gesturestart',function(e){e.preventDefault()});

(function(){
var $=function(i){return document.getElementById(i)},R=document.documentElement,bal=0,timers=[];
var RATE=1500; /* NGN per 1 USD - edit this to update the exchange rate */
var CUR={USD:{sym:'$',rate:1},NGN:{sym:'\u20A6',rate:RATE}};
var ACC={purple:'#1c12c8',red:'#b3121c',green:'#0b7a3b',blue:'#0a86c9',grey:'#2b2f36'};
var st={accent:'purple',theme:'light',cur:'USD'};
try{for(var k in st){var sv=localStorage.getItem('bk_'+k);if(sv)st[k]=sv}}catch(e){}
if(!ACC[st.accent])st.accent='purple';if(!CUR[st.cur])st.cur='USD';if(st.theme!=='dark')st.theme='light';
function save(){try{for(var k in st)localStorage.setItem('bk_'+k,st[k])}catch(e){}}
var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function stamp(d){return d.getDate()+' '+MON[d.getMonth()]+' '+d.getFullYear()+', '+d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}).replace(/\u202f/g,' ')}
function r6(x){return Math.round(x*1e6)/1e6}
function fmt(usd){var c=CUR[st.cur];return c.sym+(usd*c.rate).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}

/* Transaction PIN. Default is 1472; changing it in Settings saves the new one on this device.
   (Prototype only: a real app must verify the PIN on the server, never in the browser.) */
var PIN='1472';
try{var spin=localStorage.getItem('bk_pin');if(/^\d{4}$/.test(spin||''))PIN=spin}catch(e){}

/* ---------- Keyboard / viewport handling ----------
   --vt / --kb describe the part of the screen the keyboard is NOT covering,
   so popups and the transfer form can sit above it instead of underneath. */
var vv=window.visualViewport;
function kbh(){return vv?Math.max(0,Math.round(window.innerHeight-vv.height-vv.offsetTop)):0}
function fit(){
 var t=vv?Math.max(0,Math.round(vv.offsetTop)):0;
 R.style.setProperty('--vt',t+'px');R.style.setProperty('--kb',kbh()+'px');
}
if(vv){vv.addEventListener('resize',fit);vv.addEventListener('scroll',fit)}
window.addEventListener('resize',fit);
function blurAll(){var a=document.activeElement;if(a&&a!==document.body&&typeof a.blur==='function')a.blur()}
/* after a field loses focus, make sure iOS hasn't left the page scrolled/offset */
document.addEventListener('focusout',function(){setTimeout(function(){var a=document.activeElement;if(!a||a===document.body||a===R)window.scrollTo(0,0);fit()},120)});
document.addEventListener('focusin',function(){[60,250,500].forEach(function(ms){setTimeout(fit,ms)})});
/* Tapping anywhere on a field card focuses it. If a field is "focused" but the keyboard never appeared
   (the hang), tapping it again drops focus and re-focuses inside the tap, which brings the keyboard back. */
function revive(i,e){
 if(e.pointerType!=='touch')return;
 if(document.activeElement===i&&kbh()<80){i.blur();i.focus({preventScroll:true})}
 else if(e.target!==i&&document.activeElement!==i){i.focus({preventScroll:true})}
}
document.querySelectorAll('.fld').forEach(function(f){var i=f.querySelector('input');if(i)f.addEventListener('pointerup',function(e){revive(i,e)})});

/* Screens: always drop focus before hiding one, and keep hidden ones un-focusable (inert) */
function openScr(el){el.removeAttribute('inert');el.classList.add('open')}
function closeScr(el){blurAll();el.classList.remove('open');el.setAttribute('inert','')}

var ts=$('tscr'),ps=$('pscr'),ss=$('sscr'),amt=$('amt'),bank=$('bank'),acn=$('acn'),nm=$('acname'),send=$('send'),err=$('terr');
function val(){var a=parseFloat(amt.value)||0,u=a/CUR[st.cur].rate,over=u>bal+.005/CUR[st.cur].rate,
 ok=a>0&&bank.value&&/^\d{10}$/.test(acn.value)&&nm.value.trim().length>1;
 err.textContent=over?'Insufficient balance for this transfer':'';send.disabled=!(ok&&!over)}
function setBal(){
 document.querySelector('.bal').textContent=fmt(bal);document.querySelectorAll('.avb').forEach(function(e){e.textContent=fmt(bal)});
 document.querySelectorAll('[data-usd]').forEach(function(e){e.textContent=(e.dataset.sign||'')+fmt(parseFloat(e.dataset.usd))});
 document.querySelectorAll('.csym').forEach(function(e){e.textContent=CUR[st.cur].sym});
 $('rnote').textContent=st.cur==='NGN'?'Amounts are converted at '+CUR.NGN.sym+RATE.toLocaleString('en-US')+' = $1.':'';
 svRender();lnRender();
}
function mark(sel,attr,v){document.querySelectorAll(sel).forEach(function(b){var on=b.getAttribute(attr)===v;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)})}
function apply(){
 R.setAttribute('data-accent',st.accent);R.setAttribute('data-theme',st.theme);
 document.querySelector('meta[name=theme-color]').content=st.theme==='dark'?'#000000':ACC[st.accent];
 mark('[data-a]','data-a',st.accent);mark('[data-t]','data-t',st.theme);mark('[data-c]','data-c',st.cur);setBal();
}
document.querySelectorAll('[data-a]').forEach(function(b){b.addEventListener('click',function(){st.accent=b.dataset.a;save();apply()})});
document.querySelectorAll('[data-t]').forEach(function(b){b.addEventListener('click',function(){st.theme=b.dataset.t;save();apply()})});
document.querySelectorAll('[data-c]').forEach(function(b){b.addEventListener('click',function(){st.cur=b.dataset.c;amt.value=ramt.value=camt.value=gamt.value=vamt.value=lamt.value='';save();apply();val();rval();cval();gval();vval();lval()})});

/* Bottom nav */
var nav=document.querySelector('nav'),blob=nav.querySelector('.blob'),items=nav.querySelectorAll('div:not(.fab):not(.sp)');
function place(t){blob.style.width=t.offsetWidth+'px';blob.style.transform='translateX('+t.offsetLeft+'px)'}
items.forEach(function(t){t.addEventListener('click',function(){nav.querySelectorAll('div.active').forEach(function(a){a.classList.remove('active')});void t.offsetWidth;t.classList.add('active');place(t);if(t.id==='nset')openScr(ss)})});
$('sback').addEventListener('click',function(){closeScr(ss);items[0].click()});
function sync(){place(nav.querySelector('div.active'))}
sync();window.addEventListener('resize',sync);

/* ---------- PIN popup ---------- */
var pov=$('pinov'),pinp=$('pininp'),pbox=$('pinboxes'),pdots=pbox.querySelectorAll('i'),ptitle=$('pintitle'),psub=$('pinsub'),perr=$('pinerr'),pinfo=$('pininfo'),pcur=null,pbusy=false,ttm=null;
function pdraw(){var n=pinp.value.length;pdots.forEach(function(d,i){d.classList.toggle('f',i<n);d.classList.toggle('a',i===Math.min(n,3))})}
function pclear(){pinp.value='';pbox.classList.remove('bad','ok');pdraw()}
function toast(m){var t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(ttm);ttm=setTimeout(function(){t.classList.remove('show')},2400)}
/* open: focus happens synchronously inside the tap, so the number keypad opens straight away */
function popen(cfg){
 pcur=cfg;pbusy=false;ptitle.textContent=cfg.title;psub.textContent=cfg.sub||'';perr.textContent='';pclear();
 pov.setAttribute('aria-hidden','false');pov.classList.add('open');
 pinp.focus({preventScroll:true});
 fit();[80,250,500,800].forEach(function(ms){setTimeout(fit,ms)});
}
/* move to another step (e.g. new PIN -> confirm) without closing the popup or the keypad */
function pstep(cfg){
 pcur=cfg;pbusy=true;pinfo.classList.add('sw');
 setTimeout(function(){ptitle.textContent=cfg.title;psub.textContent=cfg.sub||'';pclear();pinfo.classList.remove('sw');pbusy=false},220);
}
function pwrong(msg,after){
 pbusy=true;perr.textContent=msg;
 pbox.classList.remove('shake');void pbox.offsetWidth;pbox.classList.add('bad','shake');
 if(navigator.vibrate){try{navigator.vibrate([40,40,40])}catch(e){}}
 setTimeout(function(){pclear();pbox.classList.remove('shake');pbusy=false;if(after)after()},550);
}
function pclose(){
 pov.classList.remove('open');pov.setAttribute('aria-hidden','true');pinp.blur();pbusy=false;pcur=null;
 setTimeout(function(){if(!pov.classList.contains('open')){pclear();perr.textContent=''}},450);
}
/* success: keypad goes away immediately, popup closes a beat later, then the callback runs */
function pfinish(cb){
 pbusy=true;pbox.classList.add('ok');pinp.blur();
 setTimeout(function(){pclose();if(cb)cb()},260);
}
function pcancel(){if(pbox.classList.contains('ok'))return;pclose()}
pinp.addEventListener('input',function(){
 if(pbusy){pinp.value='';return}
 var v=pinp.value.replace(/\D/g,'').slice(0,4);pinp.value=v;
 perr.textContent='';pbox.classList.remove('bad');pdraw();
 if(v.length===4&&pcur)pcur.submit(v);
});
$('pinx').addEventListener('click',pcancel);
$('pinbd').addEventListener('click',pcancel);
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&pov.classList.contains('open'))pcancel()});
$('pincard').addEventListener('pointerup',function(e){
 if(e.target.closest&&e.target.closest('.pinx'))return;
 if(pbox.classList.contains('ok'))return;
 revive(pinp,e);
 if(e.pointerType==='touch'&&document.activeElement!==pinp)pinp.focus({preventScroll:true});
});

/* Change PIN (Settings): current -> new -> confirm */
function changePin(){
 function newStep(){pstep({title:'New PIN',sub:'Choose a new 4-digit PIN',submit:function(n){
  if(n===PIN)pwrong('New PIN must be different from your current PIN');else confirmStep(n);
 }})}
 function confirmStep(n){pstep({title:'Confirm new PIN',sub:'Enter the new PIN once more',submit:function(c){
  if(c===n){PIN=n;try{localStorage.setItem('bk_pin',PIN)}catch(e){}pfinish(function(){toast('PIN updated')})}
  else pwrong('PINs did not match. Start again.',newStep);
 }})}
 popen({title:'Current PIN',sub:'Enter your current PIN to continue',submit:function(c){
  if(c===PIN)newStep();else pwrong('Incorrect PIN. Try again.');
 }});
}
$('chpin').addEventListener('click',changePin);

/* ---------- Notifications ----------
   Real phone notifications use a service worker (sw.js) + the Notification API.
   They need https:// (or localhost), and on iPhone the app must be added to the Home Screen first.
   If a system notification isn't possible, the in-app banner is used as a fallback. */
var nel=$('notif'),ntm2=null,secure=(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1');
function hideNotif(){clearTimeout(ntm2);nel.classList.remove('show')}
function banner(body,title){
 $('ntitle').textContent=title||'Transaction Successful';$('nbody').textContent=body;nel.classList.add('show');
 clearTimeout(ntm2);ntm2=setTimeout(hideNotif,9000);
 if(navigator.vibrate){try{navigator.vibrate(60)}catch(e){}}
}
nel.addEventListener('click',hideNotif);
if('serviceWorker' in navigator&&secure){try{navigator.serviceWorker.register('sw.js').catch(function(){})}catch(e){}}
function canNotify(){return 'Notification' in window}
function notiSt(){
 var s=$('notst'),n=$('notnote');
 if(!canNotify()){s.textContent='Unavailable';n.textContent='This browser does not support phone notifications. On iPhone, add the app to your Home Screen first.';return}
 var p=Notification.permission;
 s.textContent=p==='granted'?'On':p==='denied'?'Blocked':'Off';
 n.textContent=p==='denied'?'Notifications are blocked. Turn them on for this app in your phone settings.':(secure?'':'Phone notifications need the app to be opened over https (or localhost).');
}
function askNotif(){
 if(!canNotify()||Notification.permission!=='default')return Promise.resolve();
 return new Promise(function(res){try{var p=Notification.requestPermission(res);if(p&&p.then)p.then(res)}catch(e){res()}}).then(notiSt);
}
function pushNotif(title,body,tag){
 if(!canNotify()||Notification.permission!=='granted')return Promise.reject();
 var o={body:body,icon:'icon-192.png',badge:'icon-192.png',tag:tag,vibrate:[80,40,80],timestamp:Date.now()};
 var g=('serviceWorker' in navigator)?navigator.serviceWorker.getRegistration():Promise.resolve();
 return g.then(function(r){if(r&&r.active)return r.showNotification(title,o);var n=new Notification(title,o);return n});
}
function notify(title,body,ref){pushNotif(title,body,'txn-'+ref).catch(function(){banner(body,title)})}
$('notbtn').addEventListener('click',function(){
 askNotif().then(function(){
  notiSt();
  if(!canNotify())return;
  if(Notification.permission==='granted')pushNotif('Notifications are on','You will get an alert for every transaction.','test').catch(function(){toast('Notifications are on')});
  else toast('Notifications are blocked in your phone settings');
 });
});
notiSt();

/* ---------- Transfer flow ---------- */
amt.addEventListener('input',function(){amt.value=amt.value.replace(/[^\d.]/g,'').replace(/(\..*)\./g,'$1').replace(/(\.\d\d).+/,'$1');val()});
acn.addEventListener('input',function(){acn.value=acn.value.replace(/\D/g,'');val()});
[bank,nm].forEach(function(e){e.addEventListener('input',val)});
$('tbtn').addEventListener('click',function(){askNotif();setBal();openScr(ts)});
$('tback').addEventListener('click',function(){closeScr(ts)});

var CONF=['#1fb54a','#f5c542','#ff6b6b','#4a8cff','#b26bff','#ff9f43','#111'];
function confetti(){
 var c=$('conf');c.innerHTML='';
 for(var i=0;i<34;i++){
  var p=document.createElement('i'),ang=Math.random()*Math.PI*2,d=70+Math.random()*90;
  p.className='cf'+(i%4===0?' r':'');
  p.style.cssText='--x:'+Math.round(Math.cos(ang)*d)+'px;--y:'+Math.round(Math.sin(ang)*d-40)+'px;--r:'+Math.round(Math.random()*720-360)+'deg;--d:'+(0.55+Math.random()*.25).toFixed(2)+'s;--c:'+CONF[i%CONF.length];
  c.appendChild(p);
 }
}
var ICON_OUT='<div class="logo" style="background:var(--acsoft)"><svg width="20" height="20" viewBox="0 0 24 24" style="fill:var(--ac)"><path d="M20.5 3.5L4.6 9.6l5.8 3.9z"/><path d="M20.5 3.5l-6.2 15.8-3.9-5.8z" opacity=".6"/></svg></div>';
var ICON_IN='<div class="logo" style="background:var(--acsoft)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ac)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v15M5.5 12.5L12 19l6.5-6.5"/></svg></div>';
/* ---------- Saved state: balance + transaction list survive closing / reloading the app ---------- */
var ICON_SV='<div class="logo" style="background:var(--acsoft)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ac)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><path d="M12 12h.01"/></svg></div>';
var LN_MAX=10000,LN_RATE=.02; /* credit limit in USD, and flat interest per month (2%) - edit to change the loan terms */
var ICON_LN='<div class="logo" style="background:var(--acsoft)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ac)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="3.5"/><circle cx="12" cy="12" r="2.6"/><path d="M6.8 12h.01M17.2 12h.01"/></svg></div>';
var TXS=[],sv={g:0,s:0,n:''},ln={o:0,t:0,d:0};
function persist(){try{localStorage.setItem('bk_bal',String(bal));localStorage.setItem('bk_tx',JSON.stringify(TXS.slice(-60)));localStorage.setItem('bk_sv',JSON.stringify(sv));localStorage.setItem('bk_ln',JSON.stringify(ln))}catch(e){}}
function dayLbl(ts){var d=new Date(ts);return MON[d.getMonth()]+'-'+d.getDate()+' '+d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}).replace(/\u202f/g,' ')}
function addTx(x,isNew){
 var t=document.createElement('div'),sg=x.s>0?'+':'-';t.className=isNew?'tx new':'tx';
 t.innerHTML=(x.k==='sv'?ICON_SV:x.k==='ln'?ICON_LN:x.s>0?ICON_IN:ICON_OUT)+'<div class="m"><b></b><span></span></div><div class="r"><b class="'+(x.s>0?'g':'rd')+'" data-usd="'+x.u+'" data-sign="'+sg+'">'+sg+fmt(x.u)+'</b><span></span></div>';
 t.querySelector('.m b').textContent=x.n;t.querySelector('.m span').textContent=x.b;
 t.querySelector('.r span').textContent=isNew?'Just now':dayLbl(x.t);
 document.querySelector('.sheet .day').after(t);
}
function restore(){
 try{
  var sb=parseFloat(localStorage.getItem('bk_bal'));if(isFinite(sb)&&sb>=0)bal=sb;
  var sj=JSON.parse(localStorage.getItem('bk_sv')||'null');
  if(sj&&isFinite(sj.g)&&isFinite(sj.s)&&sj.g>0&&sj.s>=0){sv.g=+sj.g;sv.s=+sj.s;sv.n=String(sj.n||'Savings goal').slice(0,24)}
  var lj=JSON.parse(localStorage.getItem('bk_ln')||'null');
  if(lj&&isFinite(lj.o)&&isFinite(lj.t)&&isFinite(lj.d)&&lj.o>0){ln.o=+lj.o;ln.t=Math.max(+lj.t,ln.o);ln.d=+lj.d}
  var sx=JSON.parse(localStorage.getItem('bk_tx')||'[]');
  if(Array.isArray(sx))sx.forEach(function(x){if(x&&isFinite(x.u)&&(x.s===1||x.s===-1)&&x.n!=null){TXS.push(x);addTx(x,false)}});
 }catch(e){}
}
var rcptEl=$('rcpt');
function setRcpt(rows){
 rcptEl.innerHTML='';
 rows.forEach(function(r){var d=document.createElement('div'),l=document.createElement('span'),v=document.createElement('b');
  d.className='rr';l.textContent=r[0];v.textContent=r[1];if(r[2])v.className=r[2];d.appendChild(l);d.appendChild(v);rcptEl.appendChild(d)});
}
/* One engine for every transaction: processing pop-up -> balance change -> success pop-up -> notification -> history row.
   o.sign is -1 for money out (transfer) and +1 for money in (deposit). */
function runTxn(o){
 $('pamt').textContent=$('damt').textContent=fmt(o.u);
 $('ptxt').textContent='Your '+o.word+' is processing';
 $('dtxt').textContent='Your '+o.word+' was successful';
 ps.classList.remove('fin');void ps.offsetWidth;openScr(ps);ps.classList.add('run');
 timers.push(setTimeout(function(){
  if(o.apply)o.apply();else bal=Math.max(0,r6(bal+o.sign*o.u));setBal();
  confetti();
  var when=stamp(new Date()),rf='',q;
  for(q=0;q<9;q++)rf+=Math.floor(Math.random()*10);
  var ref=o.pre+rf;
  setRcpt(o.rows(when,ref));
  ps.classList.remove('run');ps.classList.add('fin');
  timers.push(setTimeout(function(){notify(o.title,o.body(when,ref),ref)},1400));
  var x={s:o.sign,u:o.u,n:o.name,b:o.sub,t:Date.now()};if(o.kind)x.k=o.kind;TXS.push(x);addTx(x,true);persist();
 },o.ms||10000));
}
function startTransfer(){
 var a=parseFloat(amt.value),u=a/CUR[st.cur].rate,b=bank.value,name=nm.value.trim(),ac=acn.value,desc=tdesc.value.trim();
 runTxn({u:u,sign:-1,word:'transfer',pre:'TXN',title:'Transaction Successful',name:name,sub:desc?desc+' \u00b7 '+b:'Transfer to '+b,icon:ICON_OUT,
  rows:function(w,r){return [['Recipient',name],['Account number',ac],['Bank',b]].concat(desc?[['Description',desc]]:[],[['Date',w],['Reference no.',r],['Type','Bank transfer'],['Status','Successful','okc']])},
  body:function(w,r){return fmt(u)+' '+st.cur+' has been successfully transferred from your account to '+name+'.'+(desc?'\nDescription: '+desc:'')+'\nReference: '+r+'\nDate: '+w+'\nAvailable Balance: '+fmt(bal)+' '+st.cur+'\nThank you for banking with us'}});
}
/* "Send money" now asks for the PIN first; the transfer starts only after the correct PIN */
send.addEventListener('click',function(){
 var u=(parseFloat(amt.value)||0)/CUR[st.cur].rate;
 popen({title:'Enter your PIN',sub:'Confirm sending '+fmt(u)+' to '+nm.value.trim(),submit:function(c){
  if(c===PIN)pfinish(startTransfer);else pwrong('Incorrect PIN. Try again.');
 }});
});
$('dbtn').addEventListener('click',function(){
 closeScr(ps);[ts,ds,rs,cs,gs,vs,ls].forEach(function(e){closeScr(e)});
 setTimeout(function(){ps.classList.remove('fin');
  amt.value=acn.value=nm.value=tdesc.value='';bank.selectedIndex=0;val();dsync();lamt.value='';lval();
  ramt.value=rfrom.value=camt.value=cnum.value=cexp.value=ccvv.value='';rval();cval();vamt.value='';vval()},650);
});

/* ---------- Deposit flow: chooser -> Receive tag / Card top up -> processing -> success ---------- */
var ds=$('dscr'),rs=$('rscr'),cs=$('cscr'),ramt=$('ramt'),rfrom=$('rfrom'),rgo=$('rgo'),
 camt=$('camt'),cnum=$('cnum'),cexp=$('cexp'),ccvv=$('ccvv'),cgo=$('cgo'),cerr=$('cerr');
function money(el,f){el.addEventListener('input',function(){el.value=el.value.replace(/[^\d.]/g,'').replace(/(\..*)\./g,'$1').replace(/(\.\d\d).+/,'$1');f()})}
function expOk(v){ /* 1 = valid, 0 = still typing, -1 = invalid or expired */
 var m=/^(\d\d)\/(\d\d)$/.exec(v);if(!m)return 0;
 var mo=+m[1],yr=2000+(+m[2]),n=new Date();
 if(mo<1||mo>12)return -1;
 return yr*12+mo>=n.getFullYear()*12+n.getMonth()+1?1:-1;
}
function rval(){var a=parseFloat(ramt.value)||0;rgo.disabled=!(a>0&&rfrom.value.trim().length>1)}
function cval(){
 var a=parseFloat(camt.value)||0,e=expOk(cexp.value);
 cerr.textContent=e<0?'Check the card expiry date':'';
 cgo.disabled=!(a>0&&cnum.value.replace(/\s/g,'').length===16&&e===1&&/^\d{3}$/.test(ccvv.value));
}
money(ramt,rval);money(camt,cval);
rfrom.addEventListener('input',rval);
cnum.addEventListener('input',function(){var d=cnum.value.replace(/\D/g,'').slice(0,16);cnum.value=d.replace(/(.{4})(?=.)/g,'$1 ');cval()});
cexp.addEventListener('input',function(){var d=cexp.value.replace(/\D/g,'').slice(0,4);cexp.value=d.length>2?d.slice(0,2)+'/'+d.slice(2):d;cval()});
ccvv.addEventListener('input',function(){ccvv.value=ccvv.value.replace(/\D/g,'').slice(0,3);cval()});

$('dpbtn').addEventListener('click',function(){askNotif();setBal();openScr(ds)});
$('dback').addEventListener('click',function(){closeScr(ds)});
$('otag').addEventListener('click',function(){setBal();openScr(rs)});
$('ocard').addEventListener('click',function(){setBal();openScr(cs)});
$('rback').addEventListener('click',function(){closeScr(rs)});
$('cback').addEventListener('click',function(){closeScr(cs)});

function depBody(u){return function(w,r){return fmt(u)+' '+st.cur+' has been credited to your Checking account ending in ****2345.\nAvailable Balance: '+fmt(bal)+' '+st.cur+'\nToday, '+w.split(', ')[1]}}
rgo.addEventListener('click',function(){
 var u=(parseFloat(ramt.value)||0)/CUR[st.cur].rate,name=rfrom.value.trim();
 blurAll();
 runTxn({u:u,sign:1,word:'deposit',pre:'DEP',title:'Deposit Successful',name:name,sub:'Received via tag',icon:ICON_IN,
  rows:function(w,r){return [['Received from',name],['Method','Receive tag'],['Date',w],['Reference no.',r],['Type','Deposit'],['Status','Successful','okc']]},
  body:depBody(u)});
});
cgo.addEventListener('click',function(){
 var u=(parseFloat(camt.value)||0)/CUR[st.cur].rate,last=cnum.value.replace(/\s/g,'').slice(-4),card='\u2022\u2022\u2022\u2022 '+last;
 blurAll();
 runTxn({u:u,sign:1,word:'deposit',pre:'DEP',title:'Deposit Successful',name:'Card top up',sub:'Card ending '+last,icon:ICON_IN,
  rows:function(w,r){return [['Card',card],['Method','Card top up'],['Date',w],['Reference no.',r],['Type','Deposit'],['Status','Successful','okc']]},
  body:depBody(u)});
});
/* ---------- Savings: set a goal, then move money checking <-> savings ---------- */
var gs=$('gscr'),vs=$('vscr'),gname=$('gname'),gamt=$('gamt'),ggo=$('ggo'),gerr=$('gerr'),vamt=$('vamt'),vgo=$('vgo'),verr=$('verr'),vdir='in',gEdit=false;
function svRender(){
 var has=sv.g>0;$('sv0').hidden=has;$('sv1').hidden=!has;
 if(!has)return;
 var pct=Math.min(100,sv.s/sv.g*100),done=sv.s>=sv.g;
 $('svname').textContent=sv.n;$('svsaved').textContent=fmt(sv.s);$('svgoal').textContent=fmt(sv.g);
 $('svfill').style.width=pct+'%';$('svbar').setAttribute('aria-valuenow',Math.floor(pct));
 $('svpct').textContent=done?'Goal reached!':Math.floor(pct)+'% of goal';
 vdraw();
}
function vdraw(){
 var inn=vdir==='in';
 $('vfn').textContent=inn?'Checking':'Savings';$('vfv').textContent=fmt(inn?bal:sv.s);
 $('vtn').textContent=inn?'Savings':'Checking';$('vtv').textContent=fmt(inn?sv.s:bal);
 vgo.textContent=inn?'Move to savings':'Move to checking';mark('[data-dir]','data-dir',vdir);
}
function gval(){var a=parseFloat(gamt.value)||0;gerr.textContent=a>1e9?'That amount is too large':'';ggo.disabled=!(a>0&&a<=1e9)}
function vval(){
 var a=parseFloat(vamt.value)||0,u=a/CUR[st.cur].rate,src=vdir==='in'?bal:sv.s,over=u>src+.005/CUR[st.cur].rate;
 verr.textContent=over?(vdir==='in'?'Insufficient checking balance':'Not enough in savings'):'';
 vgo.disabled=!(a>0&&!over);
}
money(gamt,gval);money(vamt,vval);gname.addEventListener('input',gval);
function openGoal(edit){
 gEdit=edit;
 $('gtitle').textContent=edit?'Edit goal':'Set a goal';ggo.textContent=edit?'Update goal':'Start saving';
 gname.value=edit?sv.n:'';gamt.value=edit?(sv.g*CUR[st.cur].rate).toFixed(2):'';
 setBal();gval();openScr(gs);
}
function openMove(d){vdir=d;vamt.value='';setBal();vval();openScr(vs)}
$('svstart').addEventListener('click',function(){openGoal(false)});
$('svedit').addEventListener('click',function(){openGoal(true)});
$('svadd').addEventListener('click',function(){openMove('in')});
$('gback').addEventListener('click',function(){closeScr(gs)});
$('vback').addEventListener('click',function(){closeScr(vs)});
ggo.addEventListener('click',function(){
 var u=(parseFloat(gamt.value)||0)/CUR[st.cur].rate;if(!(u>0))return;
 sv.g=r6(u);sv.n=gname.value.trim()||'Savings goal';persist();closeScr(gs);setBal();
 toast(gEdit?'Goal updated':'Goal set. Time to start saving!');
});
document.querySelectorAll('[data-dir]').forEach(function(b){b.addEventListener('click',function(){vdir=b.dataset.dir;vamt.value='';vdraw();vval()})});
document.querySelectorAll('[data-pct]').forEach(function(b){b.addEventListener('click',function(){
 var src=vdir==='in'?bal:sv.s,v=Math.floor(src*CUR[st.cur].rate*(+b.dataset.pct))/100;
 vamt.value=v>0?v.toFixed(2):'';vval();
})});
vgo.addEventListener('click',function(){
 var inn=vdir==='in',u=r6((parseFloat(vamt.value)||0)/CUR[st.cur].rate);
 if(!(u>0))return;u=Math.min(u,inn?bal:sv.s);blurAll();
 runTxn({u:u,sign:inn?-1:1,kind:'sv',ms:1800,word:'savings transfer',pre:'SAV',
  title:inn?'Moved to Savings':'Moved to Checking',name:'Savings',sub:inn?'Moved to '+sv.n:'Withdrawn to checking',
  apply:function(){
   var was=sv.s>=sv.g;
   bal=Math.max(0,r6(bal+(inn?-u:u)));sv.s=Math.max(0,r6(sv.s+(inn?u:-u)));
   if(inn&&!was&&sv.s>=sv.g)$('dtxt').textContent='Goal reached! You hit your savings target';
  },
  rows:function(w,r){return [['From',inn?'Checking':'Savings'],['To',inn?'Savings':'Checking'],['Goal',sv.n],['Savings balance',fmt(sv.s)],['Date',w],['Reference no.',r],['Type','Savings transfer'],['Status','Successful','okc']]},
  body:function(w,r){return fmt(u)+' '+st.cur+' moved from '+(inn?'Checking to Savings':'Savings to Checking')+'.\nSavings balance: '+fmt(sv.s)+' '+st.cur+'\nChecking balance: '+fmt(bal)+' '+st.cur+'\nReference: '+r}});
});

/* ---------- Transfer description (narration) + quick tags ---------- */
var tdesc=$('tdesc'),dchips=document.querySelectorAll('#dchips button');
function dsync(){var v=tdesc.value.trim().toLowerCase();dchips.forEach(function(b){b.classList.toggle('on',v===b.textContent.toLowerCase())})}
tdesc.addEventListener('input',dsync);
dchips.forEach(function(b){b.addEventListener('click',function(){tdesc.value=tdesc.value.trim().toLowerCase()===b.textContent.toLowerCase()?'':b.textContent;dsync()})});

/* ---------- Loans: borrow into checking, repay from checking ---------- */
var ls=$('lscr'),lamt=$('lamt'),lgo=$('lgo'),lerr=$('lerr'),lsumEl=$('lsum'),ldir='in',lterm=1;
function dstr(t){var d=new Date(t);return d.getDate()+' '+MON[d.getMonth()]+' '+d.getFullYear()}
function dueFor(m){return Math.max(ln.d,Date.now()+m*30*864e5)}
function lnRender(){
 var has=ln.o>0;$('ln0').hidden=has;$('ln1').hidden=!has;$('lnmax').textContent=fmt(LN_MAX);
 if(has){
  var pct=ln.t>0?Math.max(0,Math.min(100,(ln.t-ln.o)/ln.t*100)):0;
  $('lnowed').textContent=fmt(ln.o);$('lnfill').style.width=pct+'%';$('lnbar').setAttribute('aria-valuenow',Math.floor(pct));
  $('lnpct').textContent=Math.floor(pct)+'% repaid';$('lndue').textContent='Due '+dstr(ln.d);
 }
 ldraw();
}
function ldraw(){
 var inn=ldir==='in';
 $('ltitle').textContent=inn?'Get a loan':'Repay loan';$('llab').textContent=inn?'Amount to borrow':'Amount to repay';
 $('llim').textContent=fmt(Math.max(0,LN_MAX-ln.o));$('lowe').textContent=fmt(ln.o);
 $('lterms').hidden=!inn;$('lpcts').hidden=inn;lgo.textContent=inn?'Get loan':'Repay loan';
 mark('[data-ld]','data-ld',ldir);mark('[data-term]','data-term',String(lterm));
}
function lrows(rows){
 lsumEl.innerHTML='';
 rows.forEach(function(r){var d=document.createElement('div'),l=document.createElement('span'),v=document.createElement('b');
  d.className='rr';l.textContent=r[0];v.textContent=r[1];d.appendChild(l);d.appendChild(v);lsumEl.appendChild(d)});
}
function lval(){
 var a=parseFloat(lamt.value)||0,rt=CUR[st.cur].rate,u=a/rt,eps=.005/rt,msg='',rows;
 if(ldir==='in'){
  var room=Math.max(0,LN_MAX-ln.o),iv=r6(u*LN_RATE*lterm);
  if(u>room+eps)msg=room>eps?'Above your available limit of '+fmt(room):'You have reached your loan limit';
  rows=[['Interest ('+Math.round(LN_RATE*lterm*100)+'%)',fmt(iv)],['Total to repay',fmt(r6(u+iv))],['Due date',dstr(dueFor(lterm))]];
 }else{
  if(ln.o<=eps)msg='You have no loan to repay';
  else if(u>ln.o+eps)msg='That is more than you owe';
  else if(u>bal+eps)msg='Insufficient checking balance';
  rows=[['Amount owed',fmt(ln.o)],['Remaining after payment',fmt(Math.max(0,r6(ln.o-u)))],['Checking after payment',fmt(Math.max(0,r6(bal-u)))]];
 }
 lerr.textContent=msg;lgo.disabled=!(a>0&&!msg);lrows(rows);
}
money(lamt,lval);
function openLoan(d){ldir=d;lamt.value='';setBal();lval();openScr(ls)}
$('lnstart').addEventListener('click',function(){openLoan('in')});
$('lnmore').addEventListener('click',function(){openLoan('in')});
$('lnrepay').addEventListener('click',function(){openLoan('out')});
$('lback').addEventListener('click',function(){closeScr(ls)});
document.querySelectorAll('[data-ld]').forEach(function(b){b.addEventListener('click',function(){ldir=b.dataset.ld;lamt.value='';ldraw();lval()})});
document.querySelectorAll('[data-term]').forEach(function(b){b.addEventListener('click',function(){lterm=+b.dataset.term;ldraw();lval()})});
document.querySelectorAll('[data-lpct]').forEach(function(b){b.addEventListener('click',function(){
 var src=Math.min(ln.o,bal),v=Math.round(src*CUR[st.cur].rate*(+b.dataset.lpct))/100;
 lamt.value=v>0?v.toFixed(2):'';lval();
})});
lgo.addEventListener('click',function(){
 var inn=ldir==='in',rt=CUR[st.cur].rate,u=r6((parseFloat(lamt.value)||0)/rt),term=lterm;
 u=inn?Math.min(u,Math.max(0,LN_MAX-ln.o)):Math.min(u,ln.o,bal);
 if(!(u>0))return;blurAll();
 var iv=r6(u*LN_RATE*term),tot=r6(u+iv),pct=Math.round(LN_RATE*term*100);
 runTxn({u:u,sign:inn?1:-1,kind:'ln',ms:2200,word:inn?'loan request':'loan repayment',pre:inn?'LON':'RPY',
  title:inn?'Loan Approved':'Loan Repayment Successful',name:inn?'Loan':'Loan repayment',sub:inn?'Credited to checking':'Paid from checking',
  apply:function(){
   if(inn){bal=r6(bal+u);ln.o=r6(ln.o+tot);ln.t=r6(ln.t+tot);ln.d=dueFor(term)}
   else{
    bal=Math.max(0,r6(bal-u));ln.o=r6(ln.o-u);
    if(ln.o<=.005/CUR[st.cur].rate){ln.o=0;ln.t=0;ln.d=0;$('dtxt').textContent='Loan fully repaid. Well done!'}
   }
  },
  rows:function(w,r){return inn
   ?[['Loan amount',fmt(u)],['Interest ('+pct+'%)',fmt(iv)],['Total to repay',fmt(tot)],['Due date',dstr(ln.d)],['Paid into','Checking ****2345'],['Date',w],['Reference no.',r],['Type','Loan'],['Status','Successful','okc']]
   :[['Amount repaid',fmt(u)],['Remaining owed',fmt(ln.o)],['Paid from','Checking ****2345'],['Date',w],['Reference no.',r],['Type','Loan repayment'],['Status','Successful','okc']]},
  body:function(w,r){return inn
   ?fmt(u)+' '+st.cur+' has been credited to your Checking account ending in ****2345.\nYou owe '+fmt(ln.o)+' '+st.cur+', due '+dstr(ln.d)+'.\nReference: '+r
   :fmt(u)+' '+st.cur+' loan repayment received.\n'+(ln.o>0?'Remaining balance: '+fmt(ln.o)+' '+st.cur:'Your loan is fully repaid.')+'\nReference: '+r}});
});

/* ---------- Small fixes ---------- */
function greet(){var h=new Date().getHours();$('greet').textContent=h<12?'Good Morning!':h<17?'Good Afternoon!':'Good Evening!'}
/* Enter on a field dismisses the keyboard (the keypad shows a "Done" key) */
document.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target&&e.target.matches&&e.target.matches('.fld input'))e.target.blur()});
/* placeholder links must not jump the page */
document.querySelectorAll('a[href="#"]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault()})});

/* ---------- Pull to refresh: a coin that spins as you pull, locks into an orbit ring, then turns into a tick ---------- */
var sheetEl=document.querySelector('.sheet'),ptr=$('ptr'),ptrL=$('ptrl'),ptrArc=$('ptrarc'),ptrSym=$('ptrsym');
var PT_TH=80,PT_HOLD=88,PT_MAX=128,py0=0,ptrOn=false,ptrPull=false,ptrBusy=false,ptrArmed=false,ptrD=0,ptrTm=null;
var PT_TXT={'':'Pull to refresh',arm:'Release to refresh',load:'Refreshing\u2026',done:'Up to date'};
function ptrState(s){ptr.className='ptr'+(s?' '+s:'')+(ptr.classList.contains('snap')?' snap':'');ptrL.textContent=PT_TXT[s||'']}
function ptrDraw(d){
 var p=Math.min(1,d/PT_TH);
 ptr.style.setProperty('--y',Math.max(-2,d*.5-30).toFixed(1)+'px');
 ptr.style.setProperty('--o',Math.min(1,d/28).toFixed(2));
 ptr.style.setProperty('--lo',Math.max(0,Math.min(1,(d-40)/24)).toFixed(2));
 ptr.style.setProperty('--ry',Math.round(p*360)+'deg');
 ptr.style.setProperty('--s',(.55+.45*p).toFixed(3));
 ptrArc.style.strokeDashoffset=(100-p*100).toFixed(1);
}
function setSheet(d,anim){sheetEl.style.transition=anim?'transform .55s cubic-bezier(.22,1,.36,1)':'none';sheetEl.style.transform=d?'translateY('+d+'px)':''}
function ptrStart(y){
 if(ptrBusy||document.querySelector('.scr.open')||pov.classList.contains('open'))return;
 py0=y;ptrOn=true;ptrPull=false;ptr.style.top=sheetEl.offsetTop+'px';ptrSym.textContent=CUR[st.cur].sym;
}
function ptrMove(y,e){
 if(!ptrOn)return;
 if(!ptrPull&&sheetEl.scrollTop>0){py0=y;return}
 var dy=y-py0;
 if(!ptrPull){if(dy<8)return;ptrPull=true;ptr.classList.remove('snap');ptrState('')}
 if(e.cancelable)e.preventDefault();
 var d=dy>0?PT_MAX*Math.tanh(dy/(PT_MAX*1.6)):0;ptrD=d;
 setSheet(d,false);ptrDraw(d);
 if(d>=PT_TH&&!ptrArmed){ptrArmed=true;ptrState('arm');if(navigator.vibrate){try{navigator.vibrate(12)}catch(x){}}}
 else if(d<PT_TH&&ptrArmed){ptrArmed=false;ptrState('')}
}
function ptrClose(){
 ptr.classList.add('snap');setSheet(0,true);ptrD=0;ptrArmed=false;
 ptr.style.setProperty('--o','0');ptr.style.setProperty('--lo','0');ptr.style.setProperty('--y','-2px');
 setTimeout(function(){if(!ptrBusy&&!ptrPull)ptrState('')},450);
}
function ptrRefresh(){
 ptrBusy=true;ptr.classList.add('snap');ptrState('load');setSheet(PT_HOLD,true);ptrDraw(PT_HOLD);
 greet();setBal();
 ptrTm=setTimeout(function(){
  ptrState('done');if(navigator.vibrate){try{navigator.vibrate([10,40,10])}catch(x){}}
  ptrTm=setTimeout(function(){ptrClose();ptrBusy=false},800);
 },1500);
}
function ptrEnd(){
 if(!ptrOn)return;ptrOn=false;
 if(!ptrPull)return;ptrPull=false;
 if(ptrD>=PT_TH)ptrRefresh();else ptrClose();
}
sheetEl.addEventListener('touchstart',function(e){ptrStart(e.touches[0].clientY)},{passive:true});
sheetEl.addEventListener('touchmove',function(e){ptrMove(e.touches[0].clientY,e)},{passive:false});
sheetEl.addEventListener('touchend',ptrEnd);sheetEl.addEventListener('touchcancel',ptrEnd);
sheetEl.addEventListener('mousedown',function(e){if(e.button===0)ptrStart(e.clientY)});
window.addEventListener('mousemove',function(e){if(ptrOn)ptrMove(e.clientY,e)});
window.addEventListener('mouseup',ptrEnd);
greet();
restore();
apply();fit();
})();
