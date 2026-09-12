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

const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const route = () => (location.hash || '#/').slice(1);
const go = path => { location.hash = path.startsWith('/') ? path : `/${path}`; };
const baseUrl = () => `${location.origin}${location.pathname}`;

function setBusy(message='Loading…') {
  app.innerHTML = `<div class="view shell"><div class="spinner"></div><div class="empty">${esc(message)}</div></div>`;
}

function renderNav() {
  authNav.innerHTML = session?.user
    ? `<a class="desktop" href="#/dashboard">Dashboard</a><a class="desktop" href="#/curriculum">Curriculum</a><button id="logout-btn">Sign out</button>`
    : `<a class="desktop" href="#/login">Sign in</a><a class="btn primary" href="#/register">Create account</a>`;
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await supabase.auth.signOut();
    session = null; profile = null; renderNav(); go('/');
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
      <div><span class="eyebrow">Nigerian curriculum learning platform</span><h1>Learn with direction.</h1><p class="lead">THE GUIDE brings curriculum topics, complete lessons and practice questions into one focused learning experience. Sign in with your email and move directly from class → subject → term → topic.</p><div class="row"><a class="btn primary" href="#/${session ? 'dashboard' : 'login'}">${session ? 'Open dashboard' : 'Sign in with email'} →</a><a class="btn" href="#/curriculum">Browse curriculum</a></div></div>
      <div class="hero-card"><h3 style="margin-top:0">Live learning library</h3><div id="home-metrics" class="metrics"><div class="metric"><strong>…</strong><span>curriculum topics</span></div><div class="metric"><strong>…</strong><span>published lessons</span></div><div class="metric"><strong>…</strong><span>practice questions</span></div><div class="metric"><strong>Email</strong><span>Supabase authentication</span></div></div></div>
    </section>
    <section><h2 class="section-title">Everything organised for easy navigation.</h2><p class="muted">Choose your class, subject and term, then open a topic to read the lesson and practise its questions.</p><div class="grid" style="margin-top:22px"><div class="card"><h3>Structured curriculum</h3><p class="muted">Topics are grouped by class, subject and school term instead of appearing as one long list.</p></div><div class="card"><h3>Full lessons</h3><p class="muted">Published lesson content is loaded directly from the production Supabase database.</p></div><div class="card"><h3>Topic practice</h3><p class="muted">Each mapped curriculum topic has linked multiple-choice practice questions.</p></div></div></section>
  </main>`;
  const counts = await loadPublicCounts().catch(() => ({}));
  const box = document.getElementById('home-metrics');
  if (box) box.innerHTML = `<div class="metric"><strong>${esc(counts.topics ?? '5,920')}</strong><span>curriculum topics</span></div><div class="metric"><strong>${esc(counts.lessons ?? '6,000+')}</strong><span>published lessons</span></div><div class="metric"><strong>${esc(counts.questions ?? '11,840')}</strong><span>practice questions</span></div><div class="metric"><strong>Email</strong><span>Supabase authentication</span></div>`;
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
  app.innerHTML=`<main class="shell view"><div class="dashboard-head"><div><p class="eyebrow">Student dashboard</p><h1 style="margin:10px 0 4px">Welcome, ${esc(name)}</h1><p class="muted">Choose where you want to continue.</p></div><span class="notice">${esc(session.user.email)}</span></div><div class="grid"><a class="card" href="#/curriculum"><h3>Browse curriculum →</h3><p class="muted">Find topics by class, subject and term.</p></a><div class="card"><h3>${esc(counts.lessons ?? '6,000+')} lessons</h3><p class="muted">Published teaching content in the live library.</p></div><div class="card"><h3>${esc(counts.questions ?? '11,840')} questions</h3><p class="muted">Curriculum-linked practice currently available.</p></div></div></main>`;
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
    const ids=['class-filter','subject-filter','term-filter']; ids.forEach(id=>document.getElementById(id).addEventListener('change',loadTopics)); document.getElementById('topic-search').addEventListener('input',filterTopics);
  }catch(error){app.innerHTML=`<main class="shell view"><div class="notice error">Unable to load curriculum: ${esc(error.message)}</div></main>`;}
}
let currentTopics=[];
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
    supabase.from('questions').select('id,question_text,options,explanation,difficulty').eq('topic_id',topicId).eq('is_active',true).order('created_at').limit(20)
  ]);
  if(topicRes.error||lessonRes.error||qRes.error){const e=topicRes.error||lessonRes.error||qRes.error;app.innerHTML=`<main class="shell view"><div class="notice error">Unable to open this topic: ${esc(e.message)}</div></main>`;return;}
  const topic=topicRes.data, lesson=lessonRes.data?.[0], questions=qRes.data||[];
  const lessonHtml=lesson?.written_content?DOMPurify.sanitize(marked.parse(lesson.written_content)):'<p>No published lesson is available for this topic.</p>';
  app.innerHTML=`<main class="shell view"><div class="row space"><a href="#/curriculum" class="btn">← Curriculum</a><span class="notice">${esc(lesson?.estimated_minutes ? `${lesson.estimated_minutes} min` : 'Topic lesson')}</span></div><div style="margin-top:24px"><p class="eyebrow">${esc(topic?.name||'Topic')}</p><h1>${esc(lesson?.title||topic?.name||'Lesson')}</h1>${lesson?.description?`<p class="lead">${esc(lesson.description)}</p>`:''}</div><article class="card lesson-content">${lessonHtml}</article><section style="margin-top:28px"><h2 class="section-title">Practice questions</h2><p class="muted">Questions are linked to this curriculum topic. Answers are evaluated by protected exam services in the full assessment flow; this Pages view intentionally does not expose answer keys in browser source.</p><div class="stack" style="margin-top:18px">${questions.length?questions.map((q,i)=>renderQuestion(q,i)).join(''):'<div class="empty">No active practice questions for this topic.</div>'}</div></section></main>`;
}
function renderQuestion(q,i){
  const options=Array.isArray(q.options)?q.options:[];
  return `<div class="question"><div class="row space"><strong>${i+1}. ${esc(q.question_text)}</strong><span class="muted">${esc(q.difficulty||'practice')}</span></div><div class="options">${options.map(o=>`<label class="option"><input type="radio" name="q-${q.id}" value="${esc(o.id)}"><span><strong>${esc(o.id)}.</strong> ${esc(o.text)}</span></label>`).join('')}</div>${q.explanation?`<details style="margin-top:12px"><summary class="muted">Study explanation</summary><p class="muted">${esc(q.explanation)}</p></details>`:''}</div>`;
}

function renderNotFound(){app.innerHTML=`<main class="shell view"><div class="card form-card"><h1>Page not found</h1><p class="muted">Return to THE GUIDE home or curriculum.</p><div class="row"><a class="btn primary" href="#/">Home</a><a class="btn" href="#/curriculum">Curriculum</a></div></div></main>`;}

async function render(){
  const path=route(); renderNav();
  if(path==='/'||path==='') return renderHome();
  if(path==='/login') return renderLogin();
  if(path==='/register') return renderRegister();
  if(path==='/dashboard') return renderDashboard();
  if(path==='/curriculum') return renderCurriculum();
  if(path.startsWith('/topic/')) return renderTopic(path.split('/')[2]);
  renderNotFound();
}

const { data:{ session:initialSession } } = await supabase.auth.getSession();
session=initialSession;
supabase.auth.onAuthStateChange((_event,next)=>{session=next;profile=null;renderNav();});
window.addEventListener('hashchange',render);
await render();
