import { TwistyPlayer } from 'cubing/twisty';
import { Alg } from 'cubing/alg';

const q=selector=>document.querySelector(selector);
const qa=selector=>[...document.querySelectorAll(selector)];
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const examples={
 pet:{name:'Студентський петпроєкт',origin:'Власна ініціатива',source:'initiative',scramble:"R U F L D R' B U' L F' D B'",camera:35},
 hackathon:{name:'Прототип після хакатону',origin:'Власна ініціатива',source:'initiative',scramble:"F R U R' U' F' L D L' D'",camera:-35},
 research:{name:'Дослідницьке напрацювання',origin:'Ініціатива дослідницької групи',source:'initiative',scramble:"L F U B' D R' U' F' B D' R L'",camera:125},
 university:{name:'Практична задача університету',origin:'Внутрішня потреба університету',source:'university',scramble:"U R F' D L' B R' U' F L D' B'",camera:45},
 partner:{name:'Задача від партнера',origin:'Запит зовнішньої організації',source:'partner',scramble:"B U L' F R D' L B' U' R' F' D",camera:-125}
};
const phases=[
 {title:'З чого почати?',text:'Venture Lead допомагає з’ясувати, що важливо перевірити спочатку. Team Lead формує команду для подальшої роботи.'},
 {title:'Перевірити задум',text:'Команда досліджує проблему й наявні рішення. Перевіряє, чи потрібен майбутній продукт користувачам і чи можна реалізувати задум.'},
 {title:'Створити й перевірити рішення',text:'Команда розробляє рішення та перевіряє його з користувачами. Venture Lead допомагає організувати перевірки й розглядає їхні результати.'},
 {title:'Продовжувати самостійно',text:'Команда сама організовує роботу, має потрібний ресурс і врегульовані права. Рішення go на G4 ухвалює Supervisory Board.'}
];

// Reuse the guide's existing illustration mechanism, with cube artwork for this variant.
const stageImages={seed:'ideation',sprout:'validation',build:'creation',flower:'spinout'};
for(const [key,image] of Object.entries(stageImages))art[key]=()=>`<img src="stages/${image}.svg" alt="" width="180" height="188">`;
renderStage();

const playButton=q('#cube-play'),resetButton=q('#cube-reset'),turnButton=q('#cube-turn');
let player=null,indexer=null,moveCount=0,duration=0,phase=0,playing=false,complete=false;
let generation=0,loading=true,lastProgress=-1;

function updatePlayLabel(){
 if(reducedMotion.matches)playButton.textContent=complete?'Почати знову':'Наступний етап';
 else playButton.textContent=playing?'Пауза':complete?'Показати ще раз':'Показати шлях';
}
function paintStep(next,progress=0){
 const changed=phase!==next;
 phase=next;
 qa('[data-cube-step]').forEach(b=>{
  if(Number(b.dataset.cubeStep)===next)b.setAttribute('aria-current','step');
  else b.removeAttribute('aria-current');
 });
 if(changed||q('#cube-phase-title').textContent!==phases[next].title){
  q('#cube-phase-title').textContent=phases[next].title;
  q('#cube-phase-text').textContent=phases[next].text;
  state.stage=next;renderStage();remember();
 }
 if(Math.abs(progress-lastProgress)>.002||progress===0||progress===1){
  q('#cube-path-progress').style.transform=`scaleX(${progress})`;lastProgress=progress;
 }
}

async function selectExample(key,{syncGuide=true}={}){
 const example=examples[key];if(!example||!player)return;
 const request=++generation;loading=true;complete=false;playing=false;
 player.pause();
 q('#cube-case-name').textContent=example.name;q('#cube-origin').textContent=example.origin;
 qa('[data-cube-case]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.cubeCase===key)));
 player.alg=new Alg(example.scramble).invert();
 player.experimentalSetupAnchor='end';player.timestamp='start';
 player.cameraLongitude=example.camera;
 const nextIndexer=await player.experimentalModel.indexer.get();
 if(request!==generation)return;
 indexer=nextIndexer;moveCount=indexer.numAnimatedLeaves();duration=indexer.algDuration();
 loading=false;
 if(syncGuide){state.source=example.source;state.stage=0;renderSource();paintStep(0,0);}
 else jumpToStep(state.stage);
 updatePlayLabel();
}

function jumpToStep(next){
 if(!player||!indexer||loading)return;
 player.pause();playing=false;
 const leaf=Math.round(moveCount*next/3);
 player.timestamp=leaf===moveCount?duration:indexer.indexToMoveStartTimestamp(leaf);
 complete=next===3;paintStep(next,leaf/moveCount);updatePlayLabel();
}

async function initialize(){
 try{
  player=new TwistyPlayer({puzzle:'3x3x3',background:'none',controlPanel:'none',hintFacelets:'none',backView:'none',viewerLink:'none',experimentalMovePressInput:'none',cameraLatitude:27,cameraLongitude:35,tempoScale:1.55,experimentalFaceletScale:.91,experimentalSetupAnchor:'end'});
  player.setAttribute('aria-label','Об’ємний кубик: його можна обертати й переглядати шлях проєкту');
  q('#cube-player-host').append(player);
  player.experimentalModel.detailedTimelineInfo.addFreshListener(info=>{
   if(loading||!duration)return;
   const progress=Math.max(0,Math.min(1,info.timestamp/duration));
   const next=progress>=.999?3:progress>=2/3?2:progress>=1/3?1:0;
   complete=progress>=.999;paintStep(next,progress);updatePlayLabel();
  });
  player.experimentalModel.playingInfo.addFreshListener(info=>{playing=info.playing;updatePlayLabel();});
  const initial=Object.keys(examples).find(key=>examples[key].source===state.source)||'pet';
  await selectExample(initial,{syncGuide:false});
  await player.experimentalCurrentThreeJSPuzzleObject();
  await player.experimentalCurrentCanvases();
  q('#cube-view').classList.add('cube-ready');
  for(const b of [playButton,resetButton,turnButton])b.disabled=false;
 }catch(error){
  q('.cube-drag-hint').textContent='Шлях проєкту можна переглянути нижче.';
  q('.cube-drag-hint').style.visibility='visible';
  console.error('Cube preview unavailable',error);
 }
}

playButton.addEventListener('click',()=>{
 if(!player||loading)return;
 if(reducedMotion.matches){jumpToStep(complete?0:Math.min(3,phase+1));return;}
 if(playing){player.pause();return;}
 if(complete){player.jumpToStart();paintStep(0,0);complete=false;}
 player.play();
});
resetButton.addEventListener('click',()=>jumpToStep(0));
turnButton.addEventListener('click',async()=>{
 if(!player)return;
 const orbit=await player.experimentalModel.twistySceneModel.orbitCoordinates.get();
 player.cameraLongitude=orbit.longitude+90;
});
qa('[data-cube-case]').forEach(b=>b.addEventListener('click',()=>{void selectExample(b.dataset.cubeCase);}));
qa('[data-cube-step]').forEach(b=>b.addEventListener('click',()=>jumpToStep(Number(b.dataset.cubeStep))));
qa('.source-option[data-source]').forEach(b=>b.addEventListener('click',()=>{
 const key=Object.keys(examples).find(key=>examples[key].source===b.dataset.source);
 if(key)void selectExample(key,{syncGuide:false});
}));
qa('[data-stage]').forEach(b=>b.addEventListener('click',()=>jumpToStep(Number(b.dataset.stage))));
qa('#stage-prev,#stage-next').forEach(b=>b.addEventListener('click',()=>jumpToStep(state.stage)));
addEventListener('hashchange',()=>{const match=location.hash.match(/^#g([1-4])$/);if(match)jumpToStep(Number(match[1])-1);});
reducedMotion.addEventListener('change',()=>{if(player)jumpToStep(phase);updatePlayLabel();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)player?.pause();});
const visibility=new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)player?.pause();},{threshold:0});
visibility.observe(q('.cube-poster'));

if(document.readyState==='loading')addEventListener('DOMContentLoaded',initialize,{once:true});else void initialize();
