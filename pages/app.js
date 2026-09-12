import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.3';
import { marked } from 'https://esm.sh/marked@15.0.7';
import DOMPurify from 'https://esm.sh/dompurify@3.2.6';

const SUPABASE_URL = 'https://xanrzsszrysianxhpprk.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_-b8MMXYbJQKauBFjYVJ0vg_SG0GMpFs';
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const app = document.getElementById('app');
const authNav = document.getElementById('auth-nav');
const year = document.getElementById('year');
year.textContent = new Date().getFullYear();

let session = null;
let profile = null;
let curriculumCache = { classes: null, subjects: null, terms: null };
let currentTopics = [];
let cbtState = null;
let cbtTimer = null;

const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const route = () => (location.hash || '#/').slice(1);
const go = path => { location.hash = path.startsWith('/') ? path : `/${path}`; };
const baseUrl = () => `${location.origin}${location.pathname}`;
const optionValue = (option, index) => option?.id ?? option?.value ?? option?.label ?? String.fromCharCode(65 + index);
const optionText = option => typeof option === 'string' ? option : option?.text ?? option?.label ?? option?.value ?? String(option ?? '');

function setBusy(message='Loading…') {
  app.innerHTML = `<div class="view shell"><div class="spinner"></div><div class="empty">${esc(message)}</div></div>`;
}

function renderNav() {
  authNav.innerHTML = session?.user
    ? `<a class="desktop" href="#/dashboard">Dashboard</a><a class="desktop" href="#/curriculum">Curriculum</a><a class="desktop" href="#/cbt">CBT</a><button id="logout-btn">Sign out</button>`
    : `<a class="desktop" href="#/login">Sign in</a><a class="btn primary" href="#/register">Create account</a>`;
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    clearCbtTimer();
    await supabase.auth.signOut();
    session = null; profile = null; cbtState = null; renderNav(); go('/');
  });
}

async function ensureProfile() {
  if (!session?.user) return null;
  if (profile) return profile;
  const { data } = await supabase.from('profiles').select('first_name,last_name,email').eq('id', session.user.id).maybeSingle();
  profile = data || { email: session.user.email, first_name: session.user.user_metadata?.first_name || '', last_name: session.user.user_metadata?.last_name || '' };
  return profile;
}

function requireAuth() {
  if (session?.user) return true;
  go('/login');
  return false;
}

async function loadPublicCounts() {
  const specs = [['topics','is_active'],['lessons','is_published'],['questions','is_active']];
  const values = {};
  await Promise.all(specs.map(async ([table, col]) => {
    const { count } = await supabase.from(table).select('id',{count:'exact',head:true}).eq(col,true);
    values[table] = count ?? '—';
  }));
  return values;
}

async function renderHome() {
  app.innerHTML = `<main class="shell view">
    <section class="hero">
      <div><span class="eyebrow">Nigerian curriculum learning platform</span><h1>Learn with direction.</h1><p class="lead">THE GUIDE brings curriculum topics, complete lessons, practice questions and timed CBT into one focused learning experience.</p><div class="row"><a class="btn primary" href="#/${session ? 'dashboard' : 'login'}">${session ? 'Open dashboard' : 'Sign in with email'} →</a><a class="btn" href="#/curriculum">Browse curriculum</a>${session ? '<a class="btn" href="#/cbt">Start CBT</a>' : ''}</div></div>
      <div class="hero-card"><h3 style="margin-top:0">Live learning library</h3><div id="home-metrics" class="metrics"><div class="metric"><strong>…</strong><span>curriculum topics</span></div><div class="metric"><strong>…</strong><span>published lessons</span></div><div class="metric"><strong>…</strong><span>practice questions</span></div><div class="metric"><strong>CBT</strong><span>timed practice mode</span></div></div></div>
    </section>
    <section><h2 class="section-title">Everything organised for easy navigation.</h2><p class="muted">Study a topic, then test yourself in a timed computer-based practice session.</p><div class="grid" style="margin-top:22px"><div class="card"><h3>Structured curriculum</h3><p class="muted">Topics are grouped by class, subject and school term.</p></div><div class="card"><h3>Full lessons</h3><p class="muted">Published teaching content loads directly from production Supabase.</p></div><div class="card"><h3>Secure CBT practice</h3><p class="muted">Timed MCQ sessions are graded server-side without exposing answer keys before submission.</p></div></div></section>
  </main>`;
  const counts = await loadPublicCounts().catch(() => ({}));
  const box = document.getElementById('home-metrics');
  if (box) box.innerHTML = `<div class="metric"><strong>${esc(counts.topics ?? '5,920')}</strong><span>curriculum topics</span></div><div class="metric"><strong>${esc(counts.lessons ?? '6,000+')}</strong><span>published lessons</span></div><div class="metric"><strong>${esc(counts.questions ?? '11,840')}</strong><span>practice questions</span></div><div class="metric"><strong>CBT</strong><span>timed practice mode</span></div>`;
}

function renderLogin() {
  if (session) return go('/dashboard');
  app.innerHTML = `<main class="shell view"><div class="card form-card"><h1>Sign in</h1><p class="muted">Use the email and password attached to your THE GUIDE account.</p><div id="form-notice"></div><form id="login-form"><div class="field"><label for="email">Email</label><input id="email" type="email" autocomplete="email" required></div><div class="field"><label for="password">Password</label><input id="password" type="password" autocomplete="current-password" minlength="6" required></div><button class="btn primary" type="submit">Sign in</button></form><p class="muted">No account? <a href="#/register" style="color:var(--blue)">Create one</a></p></div></main>`;
  document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault(); const btn=e.currentTarget.querySelector('button'); btn.disabled=true;
    const email=document.getElementById('email').value.trim().toLowerCase(); const password=document.getElementById('password').value;
    const { data, error } = await supabase.auth.signInWithPassword({email,password});
    btn.disabled=false; const notice=document.getElementById('form-notice');
    if(error){notice.innerHTML=`<div class="notice error">${esc(error.message)}</div>`;return;}
    session=data.session; profile=null; renderNav(); go('/dashboard');
  });
}

function renderRegister() {
  if (session) return go('/dashboard');
  app.innerHTML = `<main class="shell view"><div class="card form-card"><h1>Create account</h1><p class="muted">Register with email. If email confirmation is enabled, verify your inbox before signing in.</p><div id="form-notice"></div><form id="register-form"><div class="field"><label for="first">First name</label><input id="first" autocomplete="given-name" required></div><div class="field"><label for="last">Last name</label><input id="last" autocomplete="family-name" required></div><div class="field"><label for="email">Email</label><input id="email" type="email" autocomplete="email" required></div><div class="field"><label for="password">Password</label><input id="password" type="password" autocomplete="new-password" minlength="8" required></div><button class="btn primary" type="submit">Create account</button></form><p class="muted">Already registered? <a href="#/login" style="color:var(--blue)">Sign in</a></p></div></main>`;
  document.getElementById('register-form').addEventListener('submit', async e => {
    e.preventDefault(); const btn=e.currentTarget.querySelector('button'); btn.disabled=true;
    const first_name=document.getElementById('first').value.trim(); const last_name=document.getElementById('last').value.trim(); const email=document.getElementById('email').value.trim().toLowerCase(); const password=document.getElementById('password').value;
    const { data, error } = await supabase.auth.signUp({email,password,options:{emailRedirectTo:baseUrl(),data:{first_name,last_name,role:'student'}}});
    btn.disabled=false; const notice=document.getElementById('form-notice');
    if(error){notice.innerHTML=`<div class="notice error">${esc(error.message)}</div>`;return;}
    if(data.session){session=data.session; renderNav(); go('/dashboard');} else notice.innerHTML='<div class="notice ok">Account created. Check your email to confirm your address, then sign in.</div>';
  });
}

async function renderDashboard() {
  if (!requireAuth()) return;
  setBusy('Opening your dashboard…'); const p=await ensureProfile(); const counts=await loadPublicCounts().catch(()=>({}));
  const name=[p?.first_name,p?.last_name].filter(Boolean).join(' ') || session.user.email;
  app.innerHTML=`<main class="shell view"><div class="dashboard-head"><div><p class="eyebrow">Student dashboard</p><h1 style="margin:10px 0 4px">Welcome, ${esc(name)}</h1><p class="muted">Choose where you want to continue.</p></div><span class="notice">${esc(session.user.email)}</span></div><div class="grid"><a class="card" href="#/curriculum"><h3>Browse curriculum →</h3><p class="muted">Find topics by class, subject and term.</p></a><a class="card" href="#/cbt"><h3>Computer-Based Test →</h3><p class="muted">Run a timed curriculum practice exam with secure grading.</p></a><div class="card"><h3>${esc(counts.lessons ?? '6,000+')} lessons</h3><p class="muted">Published teaching content in the live library.</p></div><div class="card"><h3>${esc(counts.questions ?? '11,840')} questions</h3><p class="muted">Active curriculum-linked practice currently available.</p></div></div></main>`;
}

async function loadCurriculumLists() {
  if (curriculumCache.classes) return curriculumCache;
  const [classes,subjects,terms]=await Promise.all([
    supabase.from('classes').select('id,name,order_index').eq('is_active',true).order('order_index'),
    supabase.from('subjects').select('id,name,order_index').eq('is_active',true).order('order_index'),
    supabase.from('terms').select('id,name,order_index').eq('is_active',true).order('order_index')
  ]);
  if(classes.error||subjects.error||terms.error) throw classes.error||subjects.error||terms.error;
  curriculumCache={classes:classes.data||[],subjects:subjects.data||[],terms:terms.data||[]}; return curriculumCache;
}

async function renderCurriculum() {
  if (!requireAuth()) return;
  setBusy('Loading curriculum…');
  try{
    const lists=await loadCurriculumLists();
    app.innerHTML=`<main class="shell view"><div class="dashboard-head"><div><p class="eyebrow">Curriculum navigator</p><h1 style="margin:10px 0 4px">Find a topic</h1><p class="muted">Select class, subject and term. Topics then appear in curriculum order.</p></div></div><div class="filters"><select id="class-filter"><option value="">Choose class</option>${lists.classes.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select><select id="subject-filter"><option value="">Choose subject</option>${lists.subjects.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select><select id="term-filter"><option value="">Choose term</option>${lists.terms.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select><input id="topic-search" placeholder="Search loaded topics"></div><div id="topic-results" class="topic-list"><div class="empty">Choose all three filters to list topics.</div></div></main>`;
    ['class-filter','subject-filter','term-filter'].forEach(id=>document.getElementById(id).addEventListener('change',loadTopics)); document.getElementById('topic-search').addEventListener('input',filterTopics);
  }catch(error){app.innerHTML=`<main class="shell view"><div class="notice error">Unable to load curriculum: ${esc(error.message)}</div></main>`;}
}

async function loadTopics(){
  const classId=document.getElementById('class-filter').value, subjectId=document.getElementById('subject-filter').value, termId=document.getElementById('term-filter').value, out=document.getElementById('topic-results');
  if(!classId||!subjectId||!termId){currentTopics=[];out.innerHTML='<div class="empty">Choose all three filters to list topics.</div>';return;}
  out.innerHTML='<div class="spinner"></div>';
  const {data,error}=await supabase.from('topics').select('id,name,order_index').eq('is_active',true).eq('class_id',classId).eq('subject_id',subjectId).eq('term_id',termId).order('order_index').limit(500);
  if(error){out.innerHTML=`<div class="notice error">${esc(error.message)}</div>`;return;} currentTopics=data||[]; filterTopics();
}
function filterTopics(){
  const out=document.getElementById('topic-results'); if(!out)return; const q=(document.getElementById('topic-search')?.value||'').trim().toLowerCase(); const rows=currentTopics.filter(t=>!q||t.name.toLowerCase().includes(q));
  out.innerHTML=rows.length?rows.map((t,i)=>`<a class="topic" href="#/topic/${t.id}"><span><strong>${i+1}. ${esc(t.name)}</strong></span><span class="muted">Open lesson →</span></a>`).join(''):'<div class="empty">No topics match these filters.</div>';
}

async function renderTopic(topicId) {
  if (!requireAuth()) return;
  setBusy('Loading lesson and practice…');
  const [topicRes,lessonRes,qRes]=await Promise.all([
    supabase.from('topics').select('id,name,learning_objectives').eq('id',topicId).maybeSingle(),
    supabase.from('lessons').select('id,title,description,written_content,learning_objectives,key_points,estimated_minutes').eq('topic_id',topicId).eq('is_published',true).order('order_index').limit(1),
    supabase.from('questions').select('id,question_text,options,difficulty').eq('topic_id',topicId).eq('is_active',true).order('created_at').limit(20)
  ]);
  if(topicRes.error||lessonRes.error||qRes.error){const e=topicRes.error||lessonRes.error||qRes.error;app.innerHTML=`<main class="shell view"><div class="notice error">Unable to open this topic: ${esc(e.message)}</div></main>`;return;}
  const topic=topicRes.data, lesson=lessonRes.data?.[0], questions=qRes.data||[];
  const lessonHtml=lesson?.written_content?DOMPurify.sanitize(marked.parse(lesson.written_content)):'<p>No published lesson is available for this topic.</p>';
  app.innerHTML=`<main class="shell view"><div class="row space"><a href="#/curriculum" class="btn">← Curriculum</a><a href="#/cbt" class="btn primary">Practice in CBT</a></div><div style="margin-top:24px"><p class="eyebrow">${esc(topic?.name||'Topic')}</p><h1>${esc(lesson?.title||topic?.name||'Lesson')}</h1>${lesson?.description?`<p class="lead">${esc(lesson.description)}</p>`:''}</div><article class="card lesson-content">${lessonHtml}</article><section style="margin-top:28px"><h2 class="section-title">Practice questions</h2><p class="muted">Use these for quick recognition practice, or open CBT for timed scoring.</p><div class="stack" style="margin-top:18px">${questions.length?questions.map((q,i)=>renderQuestion(q,i)).join(''):'<div class="empty">No active practice questions for this topic.</div>'}</div></section></main>`;
}
function renderQuestion(q,i){
  const options=Array.isArray(q.options)?q.options:[];
  return `<div class="question"><div class="row space"><strong>${i+1}. ${esc(q.question_text)}</strong><span class="muted">${esc(q.difficulty||'practice')}</span></div><div class="options">${options.map((o,index)=>`<label class="option"><input type="radio" name="q-${q.id}" value="${esc(optionValue(o,index))}"><span><strong>${esc(optionValue(o,index))}.</strong> ${esc(optionText(o))}</span></label>`).join('')}</div></div>`;
}

async function renderCbtSetup(){
  if(!requireAuth()) return;
  clearCbtTimer(); cbtState=null; setBusy('Preparing CBT…');
  try{
    const lists=await loadCurriculumLists();
    app.innerHTML=`<main class="shell view"><div class="dashboard-head"><div><p class="eyebrow">Computer-Based Test</p><h1 style="margin:10px 0 4px">Curriculum CBT</h1><p class="muted">Choose a class and subject. Questions are drawn randomly from the active curriculum bank and graded securely after submission.</p></div><span class="notice">Answer keys stay server-side</span></div><div class="card form-card" style="max-width:760px"><div id="cbt-notice"></div><div class="field"><label>Class</label><select id="cbt-class"><option value="">Choose class</option>${lists.classes.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></div><div class="field"><label>Subject</label><select id="cbt-subject"><option value="">Choose subject</option>${lists.subjects.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></div><div class="field"><label>Number of questions</label><select id="cbt-count"><option>10</option><option selected>20</option><option>30</option><option>40</option><option>50</option></select></div><div class="notice">Timing: 1 minute per question. The test submits automatically when time expires.</div><button id="start-cbt" class="btn primary" style="margin-top:18px">Start CBT</button></div></main>`;
    document.getElementById('start-cbt').addEventListener('click',startCbt);
  }catch(error){app.innerHTML=`<main class="shell view"><div class="notice error">Unable to prepare CBT: ${esc(error.message)}</div></main>`;}
}

async function startCbt(){
  const classId=document.getElementById('cbt-class').value, subjectId=document.getElementById('cbt-subject').value, count=Number(document.getElementById('cbt-count').value||20), notice=document.getElementById('cbt-notice'), btn=document.getElementById('start-cbt');
  if(!classId||!subjectId){notice.innerHTML='<div class="notice error">Choose both class and subject.</div>';return;}
  btn.disabled=true; notice.innerHTML='<div class="notice">Loading random questions…</div>';
  const {data,error}=await supabase.rpc('cbt_get_questions',{p_class_id:classId,p_subject_id:subjectId,p_count:count});
  btn.disabled=false;
  if(error){notice.innerHTML=`<div class="notice error">${esc(error.message)}</div>`;return;}
  if(!data?.length){notice.innerHTML='<div class="notice error">No active multiple-choice questions are available for this class and subject yet.</div>';return;}
  const className=document.getElementById('cbt-class').selectedOptions[0]?.textContent||'Class';
  const subjectName=document.getElementById('cbt-subject').selectedOptions[0]?.textContent||'Subject';
  cbtState={questions:data,answers:{},flagged:new Set(),current:0,seconds:data.length*60,className,subjectName,startedAt:Date.now()};
  renderCbtExam(); startCbtTimer();
}

function startCbtTimer(){
  clearCbtTimer();
  cbtTimer=setInterval(()=>{
    if(!cbtState) return clearCbtTimer();
    cbtState.seconds=Math.max(0,cbtState.seconds-1);
    const timer=document.getElementById('cbt-timer'); if(timer) timer.textContent=formatTime(cbtState.seconds);
    if(cbtState.seconds===0){clearCbtTimer(); submitCbt(true);}
  },1000);
}
function clearCbtTimer(){if(cbtTimer){clearInterval(cbtTimer);cbtTimer=null;}}
function formatTime(seconds){return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;}

function renderCbtExam(){
  if(!cbtState) return go('/cbt');
  const q=cbtState.questions[cbtState.current], options=Array.isArray(q.options)?q.options:[], answered=Object.values(cbtState.answers).filter(v=>v!==undefined&&v!=='').length;
  app.innerHTML=`<main class="shell view"><div class="card" style="position:sticky;top:10px;z-index:5;display:flex;justify-content:space-between;gap:16px;align-items:center"><div><strong>${esc(cbtState.subjectName)} CBT</strong><div class="muted">${esc(cbtState.className)} · Answered ${answered}/${cbtState.questions.length}</div></div><div id="cbt-timer" class="notice" style="font-size:18px;font-weight:800">${formatTime(cbtState.seconds)}</div></div><div style="display:grid;grid-template-columns:minmax(180px,240px) 1fr;gap:20px;margin-top:20px" class="cbt-layout"><aside class="card"><strong>Questions</strong><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:14px">${cbtState.questions.map((item,i)=>`<button class="btn cbt-jump" data-index="${i}" style="padding:8px;${i===cbtState.current?'outline:2px solid var(--gold);':''}${cbtState.answers[item.id]!==undefined?'background:rgba(34,197,94,.12);':''}">${i+1}${cbtState.flagged.has(item.id)?' ⚑':''}</button>`).join('')}</div></aside><section class="card"><div class="row space"><span class="muted">Question ${cbtState.current+1} of ${cbtState.questions.length}</span><button id="flag-question" class="btn">${cbtState.flagged.has(q.id)?'⚑ Flagged':'⚑ Flag for review'}</button></div><h2 style="margin-top:22px">${esc(q.question_text)}</h2><div class="options" style="margin-top:20px">${options.map((o,i)=>{const value=String(optionValue(o,i));const selected=String(cbtState.answers[q.id]??'')===value;return `<button class="option cbt-option" data-value="${esc(value)}" style="width:100%;text-align:left;${selected?'border-color:var(--gold);background:rgba(202,154,70,.12);':''}"><strong>${esc(value)}.</strong> ${esc(optionText(o))}</button>`}).join('')}</div><div class="row space" style="margin-top:24px"><button id="cbt-prev" class="btn" ${cbtState.current===0?'disabled':''}>← Previous</button><div class="row"><button id="cbt-next" class="btn" ${cbtState.current===cbtState.questions.length-1?'disabled':''}>Next →</button><button id="cbt-submit" class="btn primary">Submit CBT</button></div></div></section></div></main>`;
  document.querySelectorAll('.cbt-jump').forEach(b=>b.addEventListener('click',()=>{cbtState.current=Number(b.dataset.index);renderCbtExam();}));
  document.querySelectorAll('.cbt-option').forEach(b=>b.addEventListener('click',()=>{cbtState.answers[q.id]=b.dataset.value;renderCbtExam();}));
  document.getElementById('flag-question').addEventListener('click',()=>{cbtState.flagged.has(q.id)?cbtState.flagged.delete(q.id):cbtState.flagged.add(q.id);renderCbtExam();});
  document.getElementById('cbt-prev').addEventListener('click',()=>{cbtState.current=Math.max(0,cbtState.current-1);renderCbtExam();});
  document.getElementById('cbt-next').addEventListener('click',()=>{cbtState.current=Math.min(cbtState.questions.length-1,cbtState.current+1);renderCbtExam();});
  document.getElementById('cbt-submit').addEventListener('click',()=>submitCbt(false));
}

async function submitCbt(automatic=false){
  if(!cbtState) return;
  const unanswered=cbtState.questions.filter(q=>cbtState.answers[q.id]===undefined||cbtState.answers[q.id]==='').length;
  if(!automatic&&!window.confirm(`Submit this CBT? ${unanswered} question(s) are unanswered.`)) return;
  clearCbtTimer(); setBusy('Grading your CBT securely…');
  const payload=cbtState.questions.map(q=>({question_id:q.id,answer:cbtState.answers[q.id]??''}));
  const {data,error}=await supabase.rpc('cbt_grade',{p_answers:payload});
  if(error){app.innerHTML=`<main class="shell view"><div class="notice error">Unable to grade CBT: ${esc(error.message)}</div><button id="retry-cbt" class="btn">Return to CBT</button></main>`;document.getElementById('retry-cbt').addEventListener('click',()=>{renderCbtExam();startCbtTimer();});return;}
  cbtState.result=data; cbtState.elapsed=Math.max(0,Math.round((Date.now()-cbtState.startedAt)/1000)); renderCbtResults();
}

function renderCbtResults(){
  if(!cbtState?.result) return go('/cbt');
  const r=cbtState.result, resultMap=new Map((r.results||[]).map(x=>[x.question_id,x]));
  app.innerHTML=`<main class="shell view"><div class="dashboard-head"><div><p class="eyebrow">CBT result</p><h1 style="margin:10px 0 4px">${esc(cbtState.subjectName)} · ${esc(cbtState.className)}</h1><p class="muted">Completed in ${formatTime(cbtState.elapsed||0)}</p></div><div class="notice" style="font-size:24px;font-weight:800">${esc(r.percentage)}%</div></div><div class="metrics"><div class="metric"><strong>${esc(r.correct)}</strong><span>correct</span></div><div class="metric"><strong>${esc(r.incorrect)}</strong><span>incorrect</span></div><div class="metric"><strong>${esc(r.unanswered)}</strong><span>unanswered</span></div><div class="metric"><strong>${esc(r.total)}</strong><span>total</span></div></div><div class="row" style="margin:24px 0"><a class="btn primary" href="#/cbt">Start another CBT</a><a class="btn" href="#/dashboard">Dashboard</a></div><section><h2 class="section-title">Review answers</h2><div class="stack">${cbtState.questions.map((q,i)=>{const rr=resultMap.get(q.id)||{};const chosen=cbtState.answers[q.id]??'—';return `<div class="question"><div class="row space"><strong>${i+1}. ${esc(q.question_text)}</strong><span class="notice ${rr.is_correct?'ok':'error'}">${rr.is_correct?'Correct':'Review'}</span></div><p class="muted">Your answer: <strong>${esc(chosen)}</strong> · Correct answer: <strong>${esc(rr.correct_answer??'—')}</strong></p>${rr.explanation?`<p class="muted">${esc(rr.explanation)}</p>`:''}</div>`}).join('')}</div></section></main>`;
}

function renderNotFound(){app.innerHTML=`<main class="shell view"><div class="card form-card"><h1>Page not found</h1><p class="muted">Return to THE GUIDE home or dashboard.</p><div class="row"><a class="btn primary" href="#/">Home</a><a class="btn" href="#/dashboard">Dashboard</a></div></div></main>`;}

async function render(){
  const path=route(); renderNav();
  if(path!=='/cbt/exam') clearCbtTimer();
  if(path==='/'||path==='') return renderHome();
  if(path==='/login') return renderLogin();
  if(path==='/register') return renderRegister();
  if(path==='/dashboard') return renderDashboard();
  if(path==='/curriculum') return renderCurriculum();
  if(path==='/cbt') return renderCbtSetup();
  if(path==='/cbt/results') return renderCbtResults();
  if(path.startsWith('/topic/')) return renderTopic(path.split('/')[2]);
  renderNotFound();
}

const { data:{ session:initialSession } } = await supabase.auth.getSession();
session=initialSession;
supabase.auth.onAuthStateChange((_event,next)=>{session=next;profile=null;renderNav();});
window.addEventListener('hashchange',render);
await render();