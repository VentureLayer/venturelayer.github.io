import { TwistyPlayer } from 'cubing/twisty';

const q=selector=>document.querySelector(selector);
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const examples=[
 {source:'initiative',origin:'Власна ініціатива',kind:'Студентський петпроєкт',name:'Пошук у власних конспектах',description:'Студент зробив інструмент для своїх нотаток і хоче розвинути його для інших.'},
 {source:'university',origin:'Потреба університету',kind:'Сервіс для студентів',name:'Розклад без плутанини',description:'Університету потрібен зручний спосіб повідомляти студентів про зміни занять та аудиторій.'},
 {source:'partner',origin:'Задача зовнішнього партнера',kind:'Запит від клініки',name:'Черга, яку видно наперед',description:'Клініка шукає спосіб показувати відвідувачам час очікування та зміни в черзі.'},
 {source:'initiative',origin:'Власна ініціатива',kind:'Прототип після хакатону',name:'Маршрут без бар’єрів',description:'Після хакатону залишився прототип карти доступних маршрутів містом. Команда хоче продовжити роботу.'},
 {source:'university',origin:'Потреба університету',kind:'Задача від кафедри',name:'Прилади, які можна забронювати',description:'Кафедрі потрібен спільний календар, щоб студенти й дослідники могли планувати роботу з обладнанням.'},
 {source:'partner',origin:'Задача зовнішнього партнера',kind:'Запит від підприємства',name:'Менше простою на виробництві',description:'Підприємство шукає спосіб завчасно помічати ознаки несправності обладнання.'},
 {source:'initiative',origin:'Власна ініціатива',kind:'Дослідницьке напрацювання',name:'Робот для перевірки труб',description:'Дослідницька група має лабораторний прототип робота для огляду важкодоступних ділянок.'},
 {source:'university',origin:'Потреба університету',kind:'Підтримка студентської практики',name:'Знайти свою практику',description:'Університет хоче поєднати пропозиції практики з інтересами й навичками студентів.'},
 {source:'partner',origin:'Задача зовнішнього партнера',kind:'Запит від мережі магазинів',name:'Менше зіпсованих продуктів',description:'Мережа шукає спосіб точніше планувати запаси продуктів із коротким терміном зберігання.'}
];

// Keep the guide's existing illustration mechanism. The hero is an independent illustration.
const stageImages={seed:'ideation',sprout:'validation',build:'creation',flower:'spinout'};
for(const [key,image] of Object.entries(stageImages))art[key]=()=>`<img src="stages/${image}.svg" alt="" width="180" height="188">`;
renderStage();

const poster=q('.cube-poster');
const caption=q('#cube-caption');
const motionButton=q('#cube-motion-toggle');
const dots=q('#cube-example-dots');
const exampleDuration=6000;
let player=null,ready=false,index=0,exampleTime=0,angle=35,motionTime=0;
let paused=false,inView=false,frameId=null,previousFrame=null,captionAnimation=null;

examples.forEach((example,i)=>{
 const button=document.createElement('button');
 button.type='button';button.dataset.cubeExample=String(i);
 button.setAttribute('aria-label',`${example.origin}: ${example.name}`);
 button.title=example.name;
 button.innerHTML='<span aria-hidden="true"></span>';
 button.addEventListener('click',()=>selectExample(i));
 dots.append(button);
});

function selectExample(next,{animate=true}={}){
 index=(next+examples.length)%examples.length;
 exampleTime=0;
 const example=examples[index];
 q('#cube-origin').textContent=example.origin;
 q('#cube-example-kind').textContent=example.kind;
 q('#cube-case-name').textContent=example.name;
 q('#cube-case-description').textContent=example.description;
 q('#cube-example-count').textContent=`${String(index+1).padStart(2,'0')} / ${String(examples.length).padStart(2,'0')}`;
 poster.dataset.source=example.source;
 [...dots.children].forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
 captionAnimation?.cancel();
 if(animate&&!reducedMotion.matches){
  captionAnimation=caption.animate([
   {opacity:0,transform:'translateY(10px)'},
   {opacity:1,transform:'translateY(0)'}
  ],{duration:550,easing:'cubic-bezier(.2,.7,.2,1)'});
 }
}

function shouldRun(){return !paused&&!reducedMotion.matches&&!document.hidden&&inView;}
function refreshMotion(){
 const running=shouldRun();
 poster.classList.toggle('is-paused',!running);
 motionButton.setAttribute('aria-pressed',String(paused||reducedMotion.matches));
 motionButton.querySelector('span').textContent=reducedMotion.matches?'Рух вимкнено':paused?'Увімкнути рух':'Зупинити рух';
 motionButton.disabled=reducedMotion.matches;
 if(!running){
  if(frameId!==null)cancelAnimationFrame(frameId);
  frameId=null;previousFrame=null;
 }else if(frameId===null){frameId=requestAnimationFrame(animate);}
}
function animate(now){
 frameId=null;
 if(!shouldRun()){previousFrame=null;return;}
 if(previousFrame===null)previousFrame=now;
 const delta=now-previousFrame;
 // Match the renderer's work to a steady frame cadence.
 if(delta>=1000/30){
  previousFrame=now;
  motionTime+=delta;exampleTime+=delta;angle+=delta*.015;
  if(exampleTime>=exampleDuration)selectExample(index+1);
  if(ready){
   player.cameraLongitude=angle;
   player.cameraLatitude=26+8*Math.sin(motionTime/8500);
  }
 }
 frameId=requestAnimationFrame(animate);
}

async function initialize(){
 try{
  player=new TwistyPlayer({
   puzzle:'3x3x3',alg:'',experimentalSetupAlg:"R U F L D R' B U' L F' D B'",
   background:'none',controlPanel:'none',hintFacelets:'none',backView:'none',viewerLink:'none',
   experimentalMovePressInput:'none',experimentalDragInput:'none',
   cameraLatitude:26,cameraLongitude:angle,experimentalFaceletScale:.91
  });
  player.setAttribute('aria-hidden','true');
  q('#cube-player-host').append(player);
  await player.experimentalCurrentThreeJSPuzzleObject();
  await player.experimentalCurrentCanvases();
  player.cameraLongitude=angle;
  ready=true;q('#cube-view').classList.add('cube-ready');
 }catch(error){console.error('Cube illustration unavailable',error);}
}

q('#cube-previous').addEventListener('click',()=>selectExample(index-1));
q('#cube-next').addEventListener('click',()=>selectExample(index+1));
motionButton.addEventListener('click',()=>{paused=!paused;refreshMotion();});
reducedMotion.addEventListener('change',()=>{captionAnimation?.cancel();refreshMotion();});
document.addEventListener('visibilitychange',refreshMotion);
const visibility=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;refreshMotion();},{threshold:0});
visibility.observe(poster);
selectExample(0,{animate:false});
refreshMotion();
if(document.readyState==='loading')addEventListener('DOMContentLoaded',initialize,{once:true});else void initialize();
