import express from "express";
import Pusher from "pusher";
import { nanoid } from "nanoid";
import cors from "cors";

const app = express();

// ── Pusher (real-time replacement for Socket.IO) ─────────────────
const pusher = new Pusher({
  appId:   process.env.PUSHER_APP_ID   || "",
  key:     process.env.PUSHER_KEY      || "",
  secret:  process.env.PUSHER_SECRET   || "",
  cluster: process.env.PUSHER_CLUSTER  || "ap2",
  useTLS:  true,
});

// ── In-memory store (persists across warm Vercel invocations) ────
const polls = new Map();
const users = new Map();

// ── Seed demo user ───────────────────────────────────────────────
const DEMO_ID = "demo_user_001";
users.set(DEMO_ID, {
  id: DEMO_ID, name: "Demo User", email: "demo@omnipoll.io",
  password: "demo1234", plan: "pro", createdAt: new Date().toISOString(),
});

// ── Middleware ───────────────────────────────────────────────────
const ALLOWED = [
  "https://omnipoll.vercel.app",
  "https://omnipoll-git-main-shaik-muzzammils-projects.vercel.app",
  /\.vercel\.app$/,
  "http://localhost:5173",
  "http://localhost:8080",
];
app.use(cors({ origin: (origin, cb) => {
  if (!origin) return cb(null, true);
  const ok = ALLOWED.some(a => typeof a === "string" ? a === origin : a.test(origin));
  cb(null, ok ? true : new Error("CORS"));
}, credentials: true }));
app.use(express.json());

// ── Helpers ──────────────────────────────────────────────────────
function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
function ensureCode() {
  let code;
  do { code = genCode(); } while ([...polls.values()].some(p => p.code === code));
  return code;
}
function trigger(pollId, event, data) {
  if (process.env.PUSHER_KEY) {
    pusher.trigger(`poll-${pollId}`, event, data).catch(() => {});
  }
}

function aggregateResults(poll) {
  const r = { participants: poll.participants?.length || 0, totalVotes: poll.responses.length };
  const { type } = poll;

  if (["multiple_choice","image_choice","true_false","bracket","countdown_vote"].includes(type)) {
    const counts = {};
    poll.options.forEach(o => { counts[o.id] = 0; });
    poll.responses.forEach(res => { if (counts[res.answer] !== undefined) counts[res.answer]++; });
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    r.options = poll.options.map(o => ({ ...o, votes: counts[o.id]||0, pct: total ? Math.round(((counts[o.id]||0)/total)*100):0 }));
  }
  if (type==="word_cloud"||type==="open_text") {
    const freq = {};
    poll.responses.forEach(res => {
      const text = String(res.answer||"").trim().toLowerCase();
      if (!text) return;
      if (type==="word_cloud") text.split(/\s+/).filter(w=>w.length>2).forEach(w=>{freq[w]=(freq[w]||0)+1;});
      else freq[text]=(freq[text]||0)+1;
    });
    r.words = Object.entries(freq).map(([text,count])=>({text,count})).sort((a,b)=>b.count-a.count).slice(0,50);
  }
  if (type==="rating"||type==="nps"||type==="slider") {
    const nums = poll.responses.map(r=>Number(r.answer)).filter(n=>!isNaN(n));
    r.average = nums.length?(nums.reduce((a,b)=>a+b,0)/nums.length).toFixed(2):0;
    r.distribution={};
    nums.forEach(n=>{r.distribution[n]=(r.distribution[n]||0)+1;});
    if (type==="nps") {
      const promoters=nums.filter(n=>n>=9).length, detractors=nums.filter(n=>n<=6).length;
      r.npsScore=nums.length?Math.round(((promoters-detractors)/nums.length)*100):0;
      r.promoters=promoters; r.passives=nums.filter(n=>n===7||n===8).length; r.detractors=detractors;
    }
  }
  if (type==="ranking"||type==="prioritization") {
    const scores={};
    poll.options.forEach(o=>{scores[o.id]=0;});
    poll.responses.forEach(res=>{
      if (Array.isArray(res.answer)) res.answer.forEach((id,idx)=>{ if(scores[id]!==undefined) scores[id]+=(poll.options.length-idx); });
    });
    r.rankings=poll.options.map(o=>({...o,score:scores[o.id]||0})).sort((a,b)=>b.score-a.score);
  }
  if (type==="matrix") {
    const matrix={};
    (poll.matrixRows||[]).forEach(row=>{matrix[row.id]={}; (poll.matrixCols||[]).forEach(col=>{matrix[row.id][col.id]=0;});});
    poll.responses.forEach(res=>{
      if (typeof res.answer==="object"&&res.answer!==null)
        Object.entries(res.answer).forEach(([rowId,colId])=>{ if(matrix[rowId]&&matrix[rowId][colId]!==undefined) matrix[rowId][colId]++; });
    });
    r.matrix=matrix; r.matrixRows=poll.matrixRows; r.matrixCols=poll.matrixCols;
  }
  if (type==="emoji_reaction") {
    const counts={};
    poll.options.forEach(o=>{counts[o.id]=0;});
    poll.responses.forEach(res=>{if(counts[res.answer]!==undefined)counts[res.answer]++;});
    r.emojis=poll.options.map(o=>({...o,count:counts[o.id]||0}));
  }
  if (type==="qa") r.questions=(poll.qaQuestions||[]).sort((a,b)=>(b.upvotes||0)-(a.upvotes||0));
  if (type==="quiz") {
    r.leaderboard=[...(poll.participants||[])].map(p=>{
      const score=(poll.responses||[]).filter(res=>res.participantId===p.id&&res.correct).reduce((acc,res)=>acc+(res.points||10),0);
      return {name:p.name,score};
    }).sort((a,b)=>b.score-a.score).slice(0,20);
  }
  if (type==="heatmap") { r.heatPoints=poll.responses.map(res=>res.answer).filter(Boolean); r.heatmapUrl=poll.heatmapUrl; }
  if (type==="fill_blank") {
    const freq={};
    poll.responses.forEach(res=>{const t=String(res.answer||"").trim().toLowerCase(); if(t) freq[t]=(freq[t]||0)+1;});
    r.answers=Object.entries(freq).map(([text,count])=>({text,count})).sort((a,b)=>b.count-a.count);
  }
  if (type==="live_matching") {
    const counts={};
    poll.responses.forEach(res=>{
      if (typeof res.answer==="object") Object.entries(res.answer).forEach(([k,v])=>{const key=`${k}→${v}`;counts[key]=(counts[key]||0)+1;});
    });
    r.matchResults=counts; r.matchingPairs=poll.matchingPairs;
  }
  return r;
}

// ── Auth ─────────────────────────────────────────────────────────
app.post("/api/auth/signup", (req, res) => {
  const { name, email, password } = req.body;
  if (!name||!email||!password) return res.status(400).json({error:"All fields required"});
  if ([...users.values()].find(u=>u.email===email)) return res.status(400).json({error:"Email already registered"});
  const user={id:nanoid(),name,email,password,plan:"free",createdAt:new Date().toISOString()};
  users.set(user.id,user);
  const {password:_,...safe}=user;
  res.json({user:safe,token:`token_${user.id}`});
});

app.post("/api/auth/signin", (req, res) => {
  const {email,password}=req.body;
  const user=[...users.values()].find(u=>u.email===email&&u.password===password);
  if (!user) return res.status(401).json({error:"Invalid credentials"});
  const {password:_,...safe}=user;
  res.json({user:safe,token:`token_${user.id}`});
});

app.get("/api/auth/me", (req, res) => {
  const token=req.headers.authorization?.replace("Bearer ","");
  if (!token) return res.status(401).json({error:"No token"});
  const userId=token.replace("token_","");
  const user=users.get(userId);
  if (!user) return res.status(401).json({error:"Invalid token"});
  const {password:_,...safe}=user;
  res.json({user:safe});
});

// ── Polls ─────────────────────────────────────────────────────────
app.post("/api/polls", (req,res)=>{
  try {
    const d=req.body;
    const poll={
      id:nanoid(), code:ensureCode(),
      title:d.title||d.question||"Untitled Poll",
      question:d.question||d.title||"",
      description:d.description||"",
      type:d.type||"multiple_choice",
      status:"draft",
      options:(d.options||[]).map(o=>({id:o.id||nanoid(),text:o.text||"",emoji:o.emoji||"",imageUrl:o.imageUrl||""})),
      matrixRows:d.matrixRows||[], matrixCols:d.matrixCols||[],
      matchingPairs:d.matchingPairs||[], sentence:d.sentence||"",
      sliderMin:d.sliderMin??0, sliderMax:d.sliderMax??100, sliderLabel:d.sliderLabel||"",
      heatmapUrl:d.heatmapUrl||"", quizQuestions:d.quizQuestions||[],
      settings:{multiSelect:d.multiSelect||false,showResults:d.showResults!==false,oneVotePerPerson:d.oneVote!==false,duration:d.duration||null},
      creatorId:d.creatorId||"",
      responses:[], participants:[], qaQuestions:[],
      createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(),
    };
    polls.set(poll.id,poll);
    res.status(201).json({poll});
  } catch(e){res.status(500).json({error:e.message});}
});

app.get("/api/polls",(req,res)=>{
  const {creatorId}=req.query;
  let list=[...polls.values()];
  if (creatorId) list=list.filter(p=>p.creatorId===creatorId);
  list.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  res.json({polls:list.map(p=>({...p,responses:undefined,_count:{responses:p.responses.length,participants:p.participants.length}}))});
});

app.get("/api/polls/join/:code",(req,res)=>{
  const poll=[...polls.values()].find(p=>p.code===req.params.code.toUpperCase());
  if (!poll) return res.status(404).json({error:"Poll not found"});
  res.json({poll:{...poll,responses:undefined}});
});

app.get("/api/polls/:id",(req,res)=>{
  const poll=polls.get(req.params.id)||[...polls.values()].find(p=>p.code===req.params.id);
  if (!poll) return res.status(404).json({error:"Poll not found"});
  res.json({poll});
});

app.patch("/api/polls/:id",(req,res)=>{
  const poll=polls.get(req.params.id);
  if (!poll) return res.status(404).json({error:"Poll not found"});
  Object.assign(poll,req.body,{updatedAt:new Date().toISOString()});
  polls.set(poll.id,poll);
  trigger(poll.id,"poll:updated",{poll:{...poll,responses:undefined}});
  res.json({poll});
});

app.delete("/api/polls/:id",(req,res)=>{
  if (!polls.has(req.params.id)) return res.status(404).json({error:"Not found"});
  polls.delete(req.params.id);
  res.json({success:true});
});

app.get("/api/polls/:id/results",(req,res)=>{
  const poll=polls.get(req.params.id);
  if (!poll) return res.status(404).json({error:"Poll not found"});
  res.json({results:aggregateResults(poll),poll:{...poll,responses:undefined}});
});

app.get("/api/polls/:id/analytics",(req,res)=>{
  const poll=polls.get(req.params.id);
  if (!poll) return res.status(404).json({error:"Poll not found"});
  res.json({
    poll:{...poll,responses:undefined}, results:aggregateResults(poll),
    responseTimeline:poll.responses.slice(-50).map((_,i)=>({time:i,count:i+1})),
    devices:{desktop:Math.floor(poll.responses.length*0.6),mobile:Math.floor(poll.responses.length*0.4)}
  });
});

app.post("/api/polls/:id/vote",(req,res)=>{
  const poll=polls.get(req.params.id);
  if (!poll) return res.status(404).json({error:"Poll not found"});
  if (poll.status!=="live") return res.status(400).json({error:"Poll is not live"});
  const {answer,participantId,participantName,correct,points}=req.body;
  const response={id:nanoid(),answer,participantId:participantId||nanoid(),participantName,correct,points,createdAt:new Date().toISOString()};
  poll.responses.push(response);
  const results=aggregateResults(poll);
  trigger(poll.id,"poll:vote",{results,totalVotes:poll.responses.length});
  res.json({success:true,results});
});

// Participant tracking
app.post("/api/polls/:id/join",(req,res)=>{
  const poll=polls.get(req.params.id);
  if (!poll) return res.status(404).json({error:"Poll not found"});
  const {participantId,participantName}=req.body;
  poll.participants=poll.participants||[];
  if (!poll.participants.find(p=>p.id===participantId)) {
    poll.participants.push({id:participantId,name:participantName||"Anonymous",joinedAt:new Date().toISOString()});
    trigger(poll.id,"participant:joined",{count:poll.participants.length,name:participantName});
  }
  res.json({success:true,count:poll.participants.length});
});

// Status changes
app.post("/api/polls/:id/go-live",(req,res)=>{
  const poll=polls.get(req.params.id);
  if (!poll) return res.status(404).json({error:"Not found"});
  poll.status="live"; poll.updatedAt=new Date().toISOString();
  trigger(poll.id,"poll:started",{poll:{...poll,responses:undefined}});
  res.json({poll});
});

app.post("/api/polls/:id/pause",(req,res)=>{
  const poll=polls.get(req.params.id);
  if (!poll) return res.status(404).json({error:"Not found"});
  poll.status="paused"; poll.updatedAt=new Date().toISOString();
  trigger(poll.id,"poll:paused",{});
  res.json({poll});
});

app.post("/api/polls/:id/end",(req,res)=>{
  const poll=polls.get(req.params.id);
  if (!poll) return res.status(404).json({error:"Not found"});
  poll.status="closed"; poll.updatedAt=new Date().toISOString();
  trigger(poll.id,"poll:ended",{results:aggregateResults(poll)});
  res.json({poll});
});

// Q&A
app.post("/api/polls/:id/qa/question",(req,res)=>{
  const poll=polls.get(req.params.id);
  if (!poll) return res.status(404).json({error:"Not found"});
  const q={id:nanoid(),text:req.body.text,author:req.body.author||"Anonymous",upvotes:0,answered:false,starred:false,createdAt:new Date().toISOString()};
  poll.qaQuestions=poll.qaQuestions||[];
  poll.qaQuestions.push(q);
  trigger(poll.id,"qa:question",q);
  res.json({question:q});
});

app.patch("/api/polls/:id/qa/:qid",(req,res)=>{
  const poll=polls.get(req.params.id);
  if (!poll) return res.status(404).json({error:"Not found"});
  const q=(poll.qaQuestions||[]).find(x=>x.id===req.params.qid);
  if (!q) return res.status(404).json({error:"Question not found"});
  Object.assign(q,req.body);
  trigger(poll.id,"qa:updated",q);
  res.json({question:q});
});

app.post("/api/polls/:id/qa/:qid/upvote",(req,res)=>{
  const poll=polls.get(req.params.id);
  if (!poll) return res.status(404).json({error:"Not found"});
  const q=(poll.qaQuestions||[]).find(x=>x.id===req.params.qid);
  if (!q) return res.status(404).json({error:"Question not found"});
  q.upvotes=(q.upvotes||0)+1;
  trigger(poll.id,"qa:upvote",{questionId:q.id,upvotes:q.upvotes});
  res.json({upvotes:q.upvotes});
});

// CSV Export
app.get("/api/polls/:id/export/csv",(req,res)=>{
  const poll=polls.get(req.params.id);
  if (!poll) return res.status(404).json({error:"Not found"});
  const rows=[["Participant","Answer","Timestamp"]];
  poll.responses.forEach(r=>rows.push([r.participantName||r.participantId||"anon",JSON.stringify(r.answer),r.createdAt]));
  res.setHeader("Content-Type","text/csv");
  res.setHeader("Content-Disposition",`attachment; filename="poll-${poll.id}.csv"`);
  res.send(rows.map(r=>r.join(",")).join("\n"));
});

// Pusher auth for private channels (if needed)
app.post("/api/pusher/auth",(req,res)=>{
  const {socket_id,channel_name}=req.body;
  const auth=pusher.authorizeChannel(socket_id,channel_name);
  res.json(auth);
});

// Health
app.get("/api/health",(_,res)=>res.json({status:"ok",polls:polls.size,users:users.size,pusher:!!process.env.PUSHER_KEY}));
app.get("/",(_,res)=>res.json({name:"OmniPoll API",version:"2.0.0",status:"running",rt:"pusher"}));

export default app;
