const canvas=document.getElementById("gameCanvas"),ctx=canvas.getContext("2d");
const menu=document.getElementById("menu"),pause=document.getElementById("pause"),gameover=document.getElementById("gameover");
const W=1000,H=700,CELL=25,GW=40,GH=28,MOVE_TIME=180;
const C={bg:"#1e1218",grid:"#563122",brown:"#fee2b6",white:"#fff7ed",black:"#1e1412",green:"#e8842b",light:"#f7ae5c",panel:"#4d2730"};
const FC={normal:"#cd7373",big:"#dcbf6e",gold:"#cda546",speed:"#87a5b4",slow:"#a58cb4",rainbow:"#da9196",poison:"#7d9b64"};
let snake=[],prev=[],dir={x:1,y:0},next={x:1,y:0},foods=[],score=0,best=Number(localStorage.getItem("ularBaksoBest")||0);
let timer=0,size=22,target=22,sizeTimer=0,speedTimer=0,slowTimer=0,rainbow=false,rainbowTimer=0,particles=[],state="MENU",last=0;

function resize(){const d=Math.min(devicePixelRatio||1,2);canvas.width=W*d;canvas.height=H*d;ctx.setTransform(d,0,0,d,0,0)}addEventListener("resize",resize);resize();
function reset(){let x=GW>>1,y=GH>>1;snake=[];for(let i=0;i<5;i++)snake.push({x:x-i,y});prev=snake.map(p=>({...p}));dir=next={x:1,y:0};score=0;timer=0;size=target=22;sizeTimer=speedTimer=slowTimer=rainbowTimer=0;rainbow=false;particles=[];spawnFood()}
function type(){let a=["normal","normal","normal","normal","big","gold","speed","slow","rainbow","poison"];return a[Math.floor(Math.random()*a.length)]}
function spawnFood(){let a=[];for(let x=2;x<GW-2;x++)for(let y=2;y<GH-2;y++)if(!snake.some(s=>s.x===x&&s.y===y))a.push({x,y});for(let i=a.length-1;i;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}foods=[];for(let i=0;i<Math.min(10,a.length);i++)foods.push({pos:a[i],type:type()})}
function oneFood(){let used=new Set(snake.map(s=>s.x+","+s.y));foods.forEach(f=>used.add(f.pos.x+","+f.pos.y));let a=[];for(let x=2;x<GW-2;x++)for(let y=2;y<GH-2;y++)if(!used.has(x+","+y))a.push({x,y});if(a.length)foods.push({pos:a[Math.floor(Math.random()*a.length)],type:type()})}
function particlesAt(x,y,t){for(let i=0;i<16;i++){let a=Math.random()*Math.PI*2,s=1+Math.random()*2;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:20+Math.random()*16,color:FC[t]})}}
function eat(i){let f=foods[i],t=f.type;particlesAt(f.pos.x*CELL+12.5,f.pos.y*CELL+12.5,t);let e={normal:[10,1,22,0],big:[25,2,28,300],gold:[50,3,30,400],speed:[20,0,22,0],slow:[20,0,22,0],rainbow:[60,4,30,450]}[t];
if(e){score+=e[0];for(let n=0;n<e[1];n++)snake.push({...snake.at(-1)});if(e[2]>22){target=e[2];sizeTimer=e[3]}if(t==="speed")speedTimer=300;if(t==="slow")slowTimer=300;if(t==="rainbow"){rainbow=true;rainbowTimer=450}}
else{score=Math.max(0,score-15);target=19;sizeTimer=180;if(snake.length>5)snake.splice(-2)}
best=Math.max(best,score);localStorage.setItem("ularBaksoBest",best);foods.splice(i,1);oneFood()}
function change(d){if(d.x+dir.x!==0||d.y+dir.y!==0)if(d.x+next.x!==0||d.y+next.y!==0)next={...d}}
function move(){dir={...next};prev=snake.map(p=>({...p}));let h={x:snake[0].x+dir.x,y:snake[0].y+dir.y};snake.unshift(h);snake.pop();let i=foods.findIndex(f=>f.pos.x===h.x&&f.pos.y===h.y);if(i>=0)eat(i);return h.x>=0&&h.x<GW&&h.y>=0&&h.y<GH&&!snake.slice(1).some(s=>s.x===h.x&&s.y===h.y)}
function panel(x,y,w,h){ctx.fillStyle="#d0c0aa";ctx.beginPath();ctx.roundRect(x,y+6,w,h,22);ctx.fill();ctx.fillStyle=C.panel;ctx.beginPath();ctx.roundRect(x,y,w,h,22);ctx.fill();ctx.strokeStyle=C.grid;ctx.lineWidth=2;ctx.stroke()}
function draw(p){ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,H);ctx.strokeStyle=C.grid;for(let x=0;x<=W;x+=CELL){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}for(let y=0;y<=H;y+=CELL){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
foods.forEach((f,i)=>{let x=f.pos.x*CELL+12.5,y=f.pos.y*CELL+12.5;ctx.beginPath();ctx.arc(x,y,10+Math.sin(performance.now()/180+i)*1.5,0,Math.PI*2);ctx.fillStyle=FC[f.type];ctx.fill()});
let centers=snake.map((c,i)=>{let o=prev[i]||c;return{x:(o.x+(c.x-o.x)*p)*CELL+12.5,y:(o.y+(c.y-o.y)*p)*CELL+12.5}});for(let i=centers.length-1;i>=0;i--){let c=centers[i],rc=["#968273","#a5916e","#829b78","#7896a5","#9b87a5"];ctx.beginPath();ctx.arc(c.x,c.y,Math.max(10,size-i*.18)/2,0,Math.PI*2);ctx.fillStyle=rainbow?rc[i%5]:(i?C.light:C.green);ctx.fill()}
if(centers.length){let h=centers[0],es=[{x:h.x+dir.x*5-dir.y*5,y:h.y+dir.y*5+dir.x*5},{x:h.x+dir.x*5+dir.y*5,y:h.y+dir.y*5-dir.x*5}];es.forEach(e=>{ctx.beginPath();ctx.arc(e.x,e.y,4,0,7);ctx.fillStyle=C.white;ctx.fill();ctx.beginPath();ctx.arc(e.x,e.y,2,0,7);ctx.fillStyle=C.black;ctx.fill()})}
for(let i=particles.length-1;i>=0;i--){let q=particles[i];q.x+=q.vx;q.y+=q.vy;q.life--;if(q.life<=0)particles.splice(i,1);else{ctx.beginPath();ctx.arc(q.x,q.y,Math.max(2,q.life/9),0,7);ctx.fillStyle=q.color;ctx.fill()}}
panel(20,18,195,70);ctx.fillStyle=C.brown;ctx.font="bold 24px Arial";ctx.fillText("Score  "+score,35,51);ctx.font="bold 17px Arial";ctx.fillText("Best   "+best,37,79)}
function setState(s){state=s;menu.classList.toggle("hidden",s!=="MENU");pause.classList.toggle("hidden",s!=="PAUSE");gameover.classList.toggle("hidden",s!=="GAMEOVER")}
function start(){reset();setState("PLAYING")}
const keys={ArrowUp:{x:0,y:-1},w:{x:0,y:-1},W:{x:0,y:-1},ArrowDown:{x:0,y:1},s:{x:0,y:1},S:{x:0,y:1},ArrowLeft:{x:-1,y:0},a:{x:-1,y:0},A:{x:-1,y:0},ArrowRight:{x:1,y:0},d:{x:1,y:0},D:{x:1,y:0}};
addEventListener("keydown",e=>{if(keys[e.key]){e.preventDefault();if(state==="PLAYING")change(keys[e.key])}else if(e.key.toLowerCase()==="p"&&(state==="PLAYING"||state==="PAUSE"))setState(state==="PLAYING"?"PAUSE":"PLAYING");else if(e.key==="Enter"&&(state==="MENU"||state==="GAMEOVER"))start()});
const md={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};document.querySelectorAll("#mobileControls button").forEach(b=>b.addEventListener("pointerdown",e=>{e.preventDefault();if(state==="PLAYING")change(md[b.dataset.dir])}));
startBtn.onclick=start;restartBtn.onclick=start;
function loop(t){if(!last)last=t;let dt=Math.min(t-last,50);last=t;if(state==="PLAYING"){timer+=dt;if(sizeTimer>0&&(sizeTimer-=dt)<=0)target=22;speedTimer=Math.max(0,speedTimer-dt);slowTimer=Math.max(0,slowTimer-dt);if(rainbowTimer>0&&(rainbowTimer-=dt)<=0)rainbow=false;size+=(target-size)*Math.min(1,dt/100);let sp=speedTimer>0?100:slowTimer>0?260:MOVE_TIME;if(timer>=sp){timer-=sp;if(!move())setState("GAMEOVER")}draw(Math.min(1,timer/sp))}else draw(1);requestAnimationFrame(loop)}
reset();setState("MENU");requestAnimationFrame(loop);