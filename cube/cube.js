import { TwistyPlayer } from 'cubing/twisty';
import { Alg } from 'cubing/alg';

const q=selector=>document.querySelector(selector);
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const stories=[
 {source:'initiative',need:'Хочу знати, коли перенесли пару',summary:'Сервіс розкладів для університетів',product:'Платформа для розкладів університетів у різних країнах: заняття, аудиторії й усі зміни — в одному місці.',scramble:"R U F L D R' B U'"},
 {source:'university',need:'Хочемо знати, які аудиторії зараз вільні',summary:'Бронювання приміщень онлайн',product:'Сервіс бронювання приміщень для університетів, офісів і коворкінгів по всьому світу.',scramble:"F R U R' U' F' L D"},
 {source:'partner',need:'Хочемо, щоб люди менше чекали в черзі',summary:'Електронні черги та запис',product:'Платформа запису й електронних черг для клінік, банків і сервісних центрів у різних країнах.',scramble:"L F U B' D R' U' F'"},
 {source:'initiative',need:'Хочу легко ділити витрати з друзями',summary:'Облік спільних витрат',product:'Застосунок для спільних витрат у подорожах і спільному житлі. Для компаній друзів у будь-якій країні.',scramble:"U R F' D L' B R' U'"},
 {source:'university',need:'Хочемо, щоб студентам було простіше отримати довідку',summary:'Студентські послуги онлайн',product:'Цифровий студентський офіс: заяви, документи й відповіді онлайн. Продукт для університетів у різних країнах.',scramble:"B U L' F R D' L B'"},
 {source:'partner',need:'Хочемо списувати менше їжі наприкінці дня',summary:'Планування закупівель для кафе',product:'Сервіс планування закупівель і залишків для кафе та ресторанів — від одного закладу до міжнародних мереж.',scramble:"R F U L' B D R' F'"},
 {source:'initiative',need:'Хочу знайти того, хто пояснить складну тему',summary:'Пошук викладачів онлайн',product:'Платформа, де учні й студенти знаходять викладачів для онлайн-занять незалежно від міста та країни.',scramble:"D R B U' L F D' R'"},
 {source:'university',need:'Хочемо, щоб студентам було легше знайти практику',summary:'Пошук студентських стажувань',product:'Платформа стажувань, яка поєднує студентів, університети й роботодавців у різних країнах.',scramble:"F L D B' R U F' L'"},
 {source:'partner',need:'Хочемо простіше оформлювати повернення товарів',summary:'Повернення товарів онлайн',product:'Сервіс повернень і обміну для інтернет-магазинів, які продають у різних країнах.',scramble:"B R D F' U L B' R'"}
];

// Reuse the guide's art. The automatic hero has no effect on the guide's stage or source.
const stageImages={seed:'ideation',sprout:'validation',build:'creation',flower:'spinout'};
for(const [key,image] of Object.entries(stageImages))art[key]=()=>`<img src="stages/${image}.svg" alt="" width="180" height="188">`;
renderStage();

const poster=q('.cube-poster'),caption=q('#cube-caption'),motionButton=q('#cube-motion-toggle');
const timing={solveStart:2600,solveEnd:5000,end:9800};
let player=null,ready=false,index=-1,storyTime=0,motionTime=0,angle=35,duration=0;
let paused=false,inView=false,loading=false,initializing=true,frameId=null,previousFrame=null,captionAnimation=null;
let phase='idea',generation=0,remainingStories=[];
const sources={
 university:{label:'З університету',letter:'А',icon:'#i-house'},
 partner:{label:'Від партнера',letter:'Б',icon:'#i-people'},
 initiative:{label:'Від людини чи групи',letter:'В',icon:'#i-star'}
};

function drawNextStory(){
 if(!remainingStories.length)remainingStories=stories.map((_,i)=>i);
 const choices=remainingStories.filter(candidate=>candidate!==index);
 const random=crypto.getRandomValues(new Uint32Array(1))[0]/2**32;
 const next=choices[Math.floor(random*choices.length)];
 remainingStories.splice(remainingStories.indexOf(next),1);
 return next;
}

function setCaption(next,{animate=true}={}){
 const story=stories[index];
 phase=next;poster.dataset.phase=next;
 const source=sources[story.source];
 q('#cube-origin').textContent=source.label;
 q('#cube-source-letter').textContent=source.letter;
 q('#cube-source-icon').setAttribute('href',source.icon);
 q('#cube-source-link').href=`#source-${story.source}`;
 q('#cube-source-link').setAttribute('aria-label',`Про джерело: ${source.label}`);
 poster.dataset.source=story.source;
 q('#cube-phase-tag').textContent=next==='startup'?'Можливий стартап':next==='solving'?'Ідея набуває форми':'Просте бажання';
 q('#cube-example-kind').textContent=next==='startup'?'Може вирости в…':next==='solving'?'Перевіряємо, кому ще це потрібно':'Усе починається з…';
 q('#cube-case-name').textContent=next==='startup'?story.summary:`«${story.need}»`;
 q('#cube-case-description').textContent=next==='startup'?story.product:'';
 q('.cube-fallback').src=next==='startup'?'marks/solved.svg':'logo.svg';
 captionAnimation?.cancel();
 if(animate&&!reducedMotion.matches){
  captionAnimation=caption.animate([
   {opacity:0,transform:next==='startup'?'translateY(15px) scale(.97)':'translateY(10px)'},
   {opacity:1,transform:'translateY(0) scale(1)'}
  ],{duration:600,easing:'cubic-bezier(.16,1,.3,1)'});
 }
 if(reducedMotion.matches){
  q('#cube-example-kind').textContent='Отак може початися стартап';
  q('#cube-case-name').textContent=`«${story.need}»`;
  q('#cube-case-description').textContent=story.product;
 }
}

async function prepareStory(next,{animate=true}={}){
 const request=++generation;
 index=next%stories.length;storyTime=0;loading=true;
 setCaption('idea',{animate});
 if(!player){loading=false;return;}
 player.alg=new Alg(stories[index].scramble).invert();
 player.experimentalSetupAnchor='end';player.timestamp='start';
 try{
  const indexer=await player.experimentalModel.indexer.get();
  if(request!==generation)return;
  duration=indexer.algDuration();
  if(reducedMotion.matches)player.timestamp=duration;
 }finally{if(request===generation)loading=false;}
}

function shouldRun(){return !paused&&!reducedMotion.matches&&!document.hidden&&inView;}
function refreshMotion(){
 const running=shouldRun();
 poster.classList.toggle('is-paused',!running);
 motionButton.setAttribute('aria-pressed',String(paused||reducedMotion.matches));
 const label=reducedMotion.matches?'Анімацію вимкнено в налаштуваннях пристрою':paused?'Продовжити анімацію':'Призупинити анімацію';
 motionButton.setAttribute('aria-label',label);motionButton.title=label;
 motionButton.disabled=reducedMotion.matches;
 if(!running){
  captionAnimation?.finish();
  if(frameId!==null)cancelAnimationFrame(frameId);
  frameId=null;previousFrame=null;
 }else if(frameId===null){frameId=requestAnimationFrame(animate);}
}

function animate(now){
 frameId=null;
 if(!shouldRun()){previousFrame=null;return;}
 if(previousFrame===null)previousFrame=now;
 const delta=now-previousFrame;
 if(delta>=1000/30){
  previousFrame=now;motionTime+=delta;
  if(!loading&&!initializing)storyTime+=delta;
  if(storyTime>=timing.end){void prepareStory(drawNextStory());}
  else{
   const nextPhase=storyTime>=timing.solveEnd?'startup':storyTime>=timing.solveStart?'solving':'idea';
   if(nextPhase!==phase)setCaption(nextPhase,{animate:nextPhase!=='solving'});
   if(ready&&!loading){
    const progress=Math.max(0,Math.min(1,(storyTime-timing.solveStart)/(timing.solveEnd-timing.solveStart)));
    player.timestamp=duration*progress;
   }
  }
  const celebration=phase==='startup'&&storyTime<timing.solveEnd+800;
  angle+=delta*(celebration ? .06 : phase==='solving' ? .025 : .012);
  if(ready){
   player.cameraLongitude=angle;
   player.cameraLatitude=24+10*Math.sin(motionTime/2100);
  }
 }
 frameId=requestAnimationFrame(animate);
}

async function initialize(){
 try{
  player=new TwistyPlayer({
   puzzle:'3x3x3',experimentalSetupAnchor:'end',
   background:'none',controlPanel:'none',hintFacelets:'none',backView:'none',viewerLink:'none',
   experimentalMovePressInput:'none',experimentalDragInput:'none',
   cameraLatitude:24,cameraLongitude:angle,cameraDistance:5.3,experimentalFaceletScale:.91
  });
  player.setAttribute('aria-hidden','true');q('#cube-player-host').append(player);
  await prepareStory(index,{animate:false});
  await player.experimentalCurrentThreeJSPuzzleObject();
  await player.experimentalCurrentCanvases();
  player.cameraLongitude=angle;
  ready=true;initializing=false;q('#cube-view').classList.add('cube-ready');
 }catch(error){loading=false;initializing=false;console.error('Cube illustration unavailable',error);}
}

motionButton.addEventListener('click',()=>{paused=!paused;refreshMotion();});
reducedMotion.addEventListener('change',()=>{
 captionAnimation?.cancel();
 if(player){player.timestamp=reducedMotion.matches?duration:0;}
 storyTime=0;setCaption('idea',{animate:false});refreshMotion();
});
document.addEventListener('visibilitychange',refreshMotion);
const visibility=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;refreshMotion();},{threshold:0});
visibility.observe(poster);
index=drawNextStory();
setCaption('idea',{animate:false});refreshMotion();
if(document.readyState==='loading')addEventListener('DOMContentLoaded',initialize,{once:true});else void initialize();
