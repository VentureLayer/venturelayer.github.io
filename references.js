'use strict';
(() => {
 const q=(s,root=document)=>root.querySelector(s),qa=(s,root=document)=>[...root.querySelectorAll(s)];
 const glossaryIds=['opportunity','venture','initiator','team','team-lead','venture-lead','stage','interval','gate','mandate','portfolio','risk','go','pass','recycle','pivot','spin-out','journal','registry','fellowship','managing-lead','academic-partner','training-partner','business-partner','board','founder-discovery','portfolio-review','evidence'];
 qa('.glossary-term').forEach((el,i)=>{el.id='term-'+glossaryIds[i];el.classList.add('reference-target');el.tabIndex=-1;});
 q('.hero-description').id='layer-intro';
 q('.hero-description').classList.add('reference-target');
 q('#resources .plain-details').id='legal-g4';
 q('.board-explorer').id='board-rules';
 q('.board-explorer').classList.add('reference-target');
 qa('.decision-definitions>div').forEach((el,i)=>{el.id='decision-'+['go','recycle','pass','pivot'][i];el.classList.add('reference-target');});
 const roleKeys=['team','lead','fellow','managing','training','academic','business','board'];
 const rolePanel=q('.role-poster');
 for(const key of roleKeys){const a=document.createElement('span');a.id='role-'+key;a.className='reference-anchor';a.setAttribute('aria-hidden','true');rolePanel.prepend(a);}
 qa('[data-stage]').forEach(b=>{b.id='g'+(Number(b.dataset.stage)+1);b.classList.add('reference-target');});
 q('#stage-panel').setAttribute('aria-labelledby','g'+(state.stage+1));
 qa('[data-pilot]').forEach(b=>{b.id='pilot-'+({people:'people',time:'time',money:'bonuses'}[b.dataset.pilot]);b.classList.add('reference-target');});
 q('#sources-dialog-title').id='reference-whitepaper';q('#sources-dialog').setAttribute('aria-labelledby','reference-whitepaper');
 // Real fragments keep native copy-link, open-in-new-tab, keyboard and history behavior.
 function prepare(hash){
  const id=decodeURIComponent(hash.replace(/^#/,''));
  let match=id.match(/^g([1-4])$/);
  if(match){const n=Number(match[1])-1;if(state.stage!==n)chooseStage(n);}
  match=id.match(/^role-(team|lead|fellow|managing|training|academic|business|board)$/);
  if(match&&state.role!==match[1]){state.role=match[1];renderRole();}
  match=id.match(/^pilot-(people|time|bonuses)$/);
  if(match){const n=match[1]==='bonuses'?'money':match[1];if(state.pilot!==n){state.pilot=n;renderPilot();}}
  let target=document.getElementById(id);
  if(id.startsWith('term-')&&target){
   const search=q('#term-search');if(search.value){search.value='';qa('.glossary-term').forEach(el=>el.hidden=false);q('#glossary-empty').hidden=true;}
   target.open=true;
  }
  if(id==='board-rules')q('.board-explorer').open=true;
  if(id==='legal-g4')q('#legal-g4').open=true;
  if(id.startsWith('reference-')){if(!q('#sources-dialog').open)q('#sources-dialog').showModal();}
  else if(q('#sources-dialog').open)q('#sources-dialog').close();
  return target;
 }
 const replaceHash=hash=>{if(location.hash!==hash)history.replaceState(history.state,'',location.pathname+location.search+hash);};
 qa('[data-stage]').forEach(b=>b.addEventListener('click',()=>replaceHash('#g'+(state.stage+1))));
 qa('[data-role]').forEach(b=>b.addEventListener('click',()=>replaceHash('#role-'+state.role)));
 qa('[data-pilot]').forEach(b=>b.addEventListener('click',()=>replaceHash('#pilot-'+(state.pilot==='money'?'bonuses':state.pilot))));
 for(const id of ['stage-prev','stage-next'])q('#'+id).addEventListener('click',()=>replaceHash('#g'+(state.stage+1)));
 q('.journey-tabs').addEventListener('keydown',e=>{if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key))replaceHash('#g'+(state.stage+1));});
 let sourceHasOrigin=false;
 q('#sources-dialog').addEventListener('close',()=>{
  const shouldReturn=sourceHasOrigin&&location.hash.startsWith('#reference-');sourceHasOrigin=false;
  if(shouldReturn)history.back();
  else if(location.hash.startsWith('#reference-'))history.replaceState(history.state,'',location.pathname+location.search+'#top');
 });
 document.addEventListener('click',e=>{
  const a=e.target.closest('a.ref-link');
  if(!a||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  if(a.hash.startsWith('#reference-')&&!location.hash.startsWith('#reference-'))sourceHasOrigin=true;
  prepare(a.hash);
 },true);
 addEventListener('hashchange',()=>{const target=prepare(location.hash);if(target)requestAnimationFrame(()=>target.scrollIntoView({block:'start',behavior:'instant'}));});
 const initial=prepare(location.hash);
 if(initial)requestAnimationFrame(()=>initial.scrollIntoView({block:'start',behavior:'instant'}));
 document.addEventListener('venture:sources-ready',()=>{const t=prepare(location.hash);if(t&&location.hash.startsWith('#reference-'))t.scrollIntoView({block:'start',behavior:'instant'});});
 const escapeRegex=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const blocked='a,button,summary,label,input,select,textarea,script,style,svg,pre,code,h1,h2,h3,h4,nav,.mini-label,.chapter-label,.paper-label,.site-header,.site-footer,[aria-hidden="true"]';
 const scopes='p,li,.game-feedback,.role-detail,.stage-extra,.risk-order,.note-side';
 function ambiguousOpportunity(value,source,index){
  if(!/^можлив/iu.test(value))return false;
  const next=source.substring(index+value.length).trimStart();
  const before=source.substring(0,index);
  return /^(?:отримати|виконувати|реалізувати|прийняти|забезпечити|працювати|ширшого|рішення|перевірки|розвитку|залучити|продовжувати|продовжити|продовження|створити|розгляду|має)(?![\p{L}\p{N}_])/u.test(next)||/(?:принципов[а-яіїєґ]*|системн[а-яіїєґ]*|інституційн[а-яіїєґ]*|його|її|свої|їхні)\s+$/iu.test(before);
 }
 fetch('assets/reference-map.json?v=20261026-references2').then(r=>{if(!r.ok)throw new Error('reference-map');return r.json();}).then(refs=>{
  const byAlias=new Map();
  refs.forEach(ref=>ref.aliases.forEach(alias=>byAlias.set(alias.toLocaleLowerCase('uk-UA'),ref)));
  const aliases=[...byAlias.keys()].sort((a,b)=>b.length-a.length);
  const pattern=new RegExp('(?<![\\p{L}\\p{N}_])(?:'+aliases.map(escapeRegex).join('|')+')(?![\\p{L}\\p{N}_])','giu');
  function linkify(){
   observer.disconnect();
   const walker=document.createTreeWalker(q('main'),NodeFilter.SHOW_TEXT,{acceptNode:n=>{
    const p=n.parentElement;
    return p&&p.closest(scopes)&&!p.closest(blocked)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
   }});
   const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
   for(const node of nodes){
    if(!node.isConnected)continue;
    const original=node.nodeValue,fragment=document.createDocumentFragment();let cursor=0,changed=false;
    pattern.lastIndex=0;
    for(const m of original.matchAll(pattern)){
     const ref=byAlias.get(m[0].toLocaleLowerCase('uk-UA'));const target=document.querySelector(ref.web);
     if(!target&& !ref.web.startsWith('#reference-'))continue;
     const owner=node.parentElement.closest('.glossary-term,.decision-definitions>div,.board-explorer,#journal,#evidence,.hero-description');
     if(owner&&owner.id===ref.web.slice(1))continue;
     if(node.parentElement.closest('.role-poster')&&ref.web==='#role-'+state.role)continue;
     if(ref.key==='opportunity'&&ambiguousOpportunity(m[0],original,m.index))continue;
     fragment.append(document.createTextNode(original.substring(cursor,m.index)));
     const a=document.createElement('a');a.href=ref.web;a.className='ref-link';a.textContent=m[0];a.title='Відкрити: '+ref.title;
     a.setAttribute('aria-label',m[0].toLocaleLowerCase('uk-UA')===ref.title.toLocaleLowerCase('uk-UA')?'Пояснення: '+ref.title:m[0]+' — '+ref.title);fragment.append(a);cursor=m.index+m[0].length;changed=true;
    }
    if(changed){fragment.append(document.createTextNode(original.substring(cursor)));node.replaceWith(fragment);}
   }
   observer.observe(q('main'),{childList:true,subtree:true,characterData:true});
  }
  let pending=false;
  const observer=new MutationObserver(()=>{if(!pending){pending=true;queueMicrotask(()=>{pending=false;linkify();});}});
  linkify();
 }).catch(()=>{ /* Existing navigation and the complete source document remain available. */ });
})();
