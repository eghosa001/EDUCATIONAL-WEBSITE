import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const json = (body: unknown, status = 200, origin = '*') => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Vary': 'Origin',
  },
});
const safeOrigin=(request:Request)=>{const value=request.headers.get('origin');if(!value)return '*';try{const parsed=new URL(value);return ['http:','https:'].includes(parsed.protocol)?parsed.origin:'*'}catch{return '*'}};
const asInt=(value:string|null,fallback:number,min=1,max=100)=>{const parsed=Number.parseInt(String(value??''),10);return Number.isFinite(parsed)?Math.min(max,Math.max(min,parsed)):fallback};
const scalarAnswer=(value:unknown):string=>{if(value===null||value===undefined)return '';if(typeof value==='string'||typeof value==='number'||typeof value==='boolean')return String(value).trim();if(typeof value==='object'){const record=value as Record<string,unknown>;for(const key of ['id','label','answer','value','correct_answer','correctAnswer'])if(record[key]!==undefined&&record[key]!==null)return scalarAnswer(record[key])}return ''};
const normalizeAnswer=(value:unknown)=>scalarAnswer(value).toLowerCase().replace(/\s+/g,' ').trim();
const isVerifiedExamSource=(source:unknown)=>/^(?:(WAEC|JAMB|NECO|NABTEB)\s+[0-9]{4}|SOURCE_PAPER:(WAEC|JAMB|NECO|NABTEB))$/i.test(String(source||'').trim());
const inferPastQuestionTopic=(subject:unknown,tags:unknown,text:unknown)=>{
  const subjectName=String(subject||'').trim();
  const raw=String(text||'').toLowerCase();
  const tagRows=Array.isArray(tags)?tags.map(value=>String(value||'').trim()).filter(Boolean):[];
  const ignored=new Set(['jamb','waec','neco','nabteb','easy','medium','hard',subjectName.toLowerCase()]);
  const topicalTag=tagRows.find(tag=>{
    const lower=tag.toLowerCase();
    return !ignored.has(lower)&&!lower.endsWith('.pdf')&&!lower.includes('past-question')&&!lower.includes('past question')&&tag.length<=48;
  });
  if(topicalTag)return topicalTag.replace(/[_-]+/g,' ').replace(/\b\w/g,char=>char.toUpperCase());

  const has=(...terms:string[])=>terms.some(term=>raw.includes(term));
  const subjectKey=subjectName.toLowerCase();
  if(subjectKey.includes('economics')){
    if(has('demand','supply','elastic','price mechanism','equilibrium price'))return 'Demand, Supply & Price';
    if(has('utility','consumer','consumption'))return 'Consumer Behaviour';
    if(has('cost','revenue','diminishing return','production','productivity'))return 'Production, Costs & Revenue';
    if(has('monopoly','oligopoly','perfect competition','market structure'))return 'Market Structures';
    if(has('money market','bank','money supply','central bank','commercial bank','credit'))return 'Money & Banking';
    if(has('tax','public finance','government revenue','government expenditure','fiscal'))return 'Public Finance';
    if(has('balance of payment','balance of trade','foreign trade','international trade','exchange rate','tariff'))return 'International Trade & Balance of Payments';
    if(has('national income','gross domestic','gdp','gnp','per capita income'))return 'National Income';
    if(has('inflation','unemployment','deflation'))return 'Inflation & Unemployment';
    if(has('development','economic growth','development indicator'))return 'Economic Growth & Development';
    if(has('population','labour','labor','wage','employment'))return 'Population & Labour';
    if(has('co-operative','cooperative','company','business firm','sole propriet'))return 'Business Organisations';
    if(has('capitalism','socialism','mixed economy','economic system'))return 'Economic Systems';
    if(has('scarcity','opportunity cost','scale of preference','choice'))return 'Basic Economic Concepts';
    if(has('frequency','mean','median','mode','index number','standard deviation','∑'))return 'Economic Statistics';
  }
  if(subjectKey.includes('english')){
    if(has('nearest meaning','opposite meaning','synonym','antonym','meaning of'))return 'Vocabulary & Lexis';
    if(has('stress','vowel','consonant','diphthong','rhymes','syllable'))return 'Oral English';
    if(has('passage','comprehension','according to the passage'))return 'Comprehension';
    if(has('noun','verb','pronoun','adjective','adverb','preposition','concord','tense','clause','phrase'))return 'Grammar & Structure';
    if(has('character','novel','poem','drama','author','community','protagonist'))return 'Literature & Textual Study';
  }
  if(subjectKey.includes('mathematics')){
    if(has('algebra','equation','factor','indices','logarithm','simplify','polynomial'))return 'Algebra';
    if(has('triangle','circle','angle','geometry','trigon','sine','cosine','tangent'))return 'Geometry & Trigonometry';
    if(has('probability','mean','median','mode','frequency','variance','standard deviation'))return 'Statistics & Probability';
    if(has('differentiat','integrat','gradient','calculus'))return 'Calculus';
    if(has('fraction','ratio','percentage','decimal','number','base'))return 'Numbers & Arithmetic';
  }
  if(subjectKey.includes('physics')){
    if(has('force','motion','velocity','acceleration','momentum','pressure'))return 'Mechanics';
    if(has('current','voltage','resistance','electric','circuit','charge'))return 'Electricity';
    if(has('wave','sound','light','lens','mirror','frequency','wavelength'))return 'Waves, Sound & Optics';
    if(has('heat','temperature','thermal','specific heat'))return 'Heat & Thermal Physics';
    if(has('unit','dimension','measurement','s.i.','si unit'))return 'Measurements & Units';
  }
  if(subjectKey.includes('chemistry')){
    if(has('acid','base','ph','salt'))return 'Acids, Bases & Salts';
    if(has('reaction','oxidation','reduction','redox','zinc','hydrochloric'))return 'Chemical Reactions';
    if(has('organic','hydrocarbon','alkane','alkene','alcohol','ester'))return 'Organic Chemistry';
    if(has('periodic','element','atomic','electron','proton'))return 'Atomic Structure & Periodicity';
    if(has('mole','stoichiometr','molar','mass','formula'))return 'Mole Concept & Stoichiometry';
    if(has('electrolysis','electrode','electrolyte'))return 'Electrochemistry';
  }
  if(subjectKey.includes('biology')){
    if(has('cell','tissue','organelle'))return 'Cell Biology';
    if(has('ecology','ecosystem','habitat','food chain','population'))return 'Ecology';
    if(has('gene','genetic','heredity','chromosome','inherit'))return 'Genetics & Heredity';
    if(has('reproduction','fertilization','fertilisation','gamete'))return 'Reproduction';
    if(has('photosynthesis','transpiration','plant','root','leaf'))return 'Plant Biology';
    if(has('digestion','nutrition','respiration','circulation','excretion'))return 'Human & Animal Physiology';
  }
  if(subjectKey.includes('government')){
    if(has('constitution','constitutional'))return 'Constitution';
    if(has('election','electoral','voting','political party'))return 'Elections & Political Parties';
    if(has('legislature','executive','judiciary','separation of powers'))return 'Organs of Government';
    if(has('federal','federalism','unitary','confederation'))return 'Systems of Government';
    if(has('colonial','nationalism','independence'))return 'Colonialism & Nationalism';
    if(has('united nations','ecowas','african union','commonwealth'))return 'International Organisations';
  }
  if(subjectKey.includes('geography')){
    if(has('climate','rainfall','weather','temperature'))return 'Weather & Climate';
    if(has('map','scale','bearing','contour'))return 'Map Reading';
    if(has('population','settlement','migration'))return 'Human Geography';
    if(has('rock','soil','river','erosion','landform'))return 'Physical Geography';
  }
  return 'General ' + (subjectName||'Subject');
};
const answersEqual=(correct:unknown,submitted:unknown,type:string)=>{
  if(type==='multiple_select'){
    const expected=(Array.isArray(correct)?correct:[correct]).map(normalizeAnswer).filter(Boolean).sort();
    const given=(Array.isArray(submitted)?submitted:[submitted]).map(normalizeAnswer).filter(Boolean).sort();
    return expected.length===given.length&&expected.every((v,i)=>v===given[i]);
  }
  if(type==='matching'&&correct&&submitted&&typeof correct==='object'&&typeof submitted==='object'){
    const expected=Object.entries(correct as Record<string,unknown>).map(([k,v])=>[normalizeAnswer(k),normalizeAnswer(v)]).sort();
    const given=Object.entries(submitted as Record<string,unknown>).map(([k,v])=>[normalizeAnswer(k),normalizeAnswer(v)]).sort();
    return JSON.stringify(expected)===JSON.stringify(given);
  }
  return normalizeAnswer(correct)===normalizeAnswer(submitted);
};

Deno.serve(async(request)=>{const origin=safeOrigin(request);if(request.method==='OPTIONS')return json({ok:true},200,origin);const supabaseUrl=Deno.env.get('SUPABASE_URL');const anonKey=Deno.env.get('SUPABASE_ANON_KEY');const serviceRoleKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');if(!supabaseUrl||!anonKey||!serviceRoleKey)return json({error:{message:'API configuration is incomplete'}},500,origin);const admin=createClient(supabaseUrl,serviceRoleKey,{auth:{persistSession:false}});const authorization=request.headers.get('Authorization')||'';let currentUser:{id:string;email?:string}|null=null;const requireUser=async()=>{if(currentUser)return currentUser;if(!authorization.startsWith('Bearer '))throw Object.assign(new Error('Authentication required'),{status:401});const userClient=createClient(supabaseUrl,anonKey,{auth:{persistSession:false},global:{headers:{Authorization:authorization}}});const{data,error}=await userClient.auth.getUser();if(error||!data.user)throw Object.assign(new Error('Authentication required'),{status:401});currentUser={id:data.user.id,email:data.user.email};return currentUser};try{const url=new URL(request.url);let path=url.pathname||'/';path=path.replace(/^\/functions\/v1\/web-api(?=\/|$)/,'');path=path.replace(/^\/web-api(?=\/|$)/,'');if(path.startsWith('/api/v1'))path=path.slice('/api/v1'.length)||'/';if(!path.startsWith('/'))path='/'+path;
if(request.method==='GET'&&path==='/questions'){const page=asInt(url.searchParams.get('page'),1,1,10000),limit=asInt(url.searchParams.get('limit'),20,1,100),classId=url.searchParams.get('classId'),subjectId=url.searchParams.get('subjectId'),from=(page-1)*limit;let query=admin.from('questions').select('id,subject_id,topic_id,class_id,question_type,question_text,question_image_url,options,difficulty,marks,source,exam_year,exam_name,tags',{count:'exact'}).eq('is_active',true).not('source','in','("THE GUIDE Curriculum Practice","NERDC_GENERATED","SYLLABUS_GENERATED")').order('created_at',{ascending:false}).range(from,from+limit-1);if(classId)query=query.eq('class_id',classId);if(subjectId)query=query.eq('subject_id',subjectId);const{data,error,count}=await query;if(error)throw error;const questions=(data||[]).map((row:any)=>({id:row.id,subjectId:row.subject_id,topicId:row.topic_id,classId:row.class_id,questionType:row.question_type,questionText:row.question_text,questionImageUrl:row.question_image_url,options:row.options,difficulty:row.difficulty,marks:row.marks,source:row.source,examYear:row.exam_year,examName:row.exam_name,tags:row.tags}));const total=count||0;return json({data:{questions},pagination:{page,limit,total,totalPages:Math.ceil(total/limit)}},200,origin)}
if(request.method==='POST'&&path==='/class-practice/session'){
  const user=await requireUser();
  const body=await request.json().catch(()=>null);
  const classId=String(body?.classId||'');
  const subjectId=String(body?.subjectId||'');
  const requested=asInt(String(body?.count||20),20,5,50);
  if(!/^[0-9a-f-]{36}$/i.test(classId)||!/^[0-9a-f-]{36}$/i.test(subjectId)){
    return json({error:{message:'Valid class and subject are required'}},400,origin);
  }

  const{data:courseRows,error:courseError}=await admin.from('courses')
    .select('id')
    .eq('class_id',classId)
    .eq('subject_id',subjectId)
    .eq('status','published');
  if(courseError)throw courseError;
  const courseIds=(courseRows||[]).map((row:any)=>String(row.id));
  if(!courseIds.length)return json({error:{message:'No published course is available for this class and subject'}},404,origin);

  const{data:lessonRows,error:lessonError}=await admin.from('lessons')
    .select('id,title,topic_id,course_id')
    .in('course_id',courseIds)
    .eq('is_published',true)
    .neq('content_quality','needs_review');
  if(lessonError)throw lessonError;
  const candidates=[...(lessonRows||[])];
  for(let i=candidates.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]]}
  if(!candidates.length)return json({error:{message:'No published lessons are available for this class and subject'}},404,origin);

  const neededLessons=Math.min(candidates.length,Math.ceil(requested/5));
  const selectedLessons=candidates.slice(0,neededLessons);
  const generationResults=await Promise.all(selectedLessons.map(async(lesson:any)=>{
    try{
      const response=await fetch(`${supabaseUrl}/functions/v1/lesson-practice`,{
        method:'POST',
        headers:{Authorization:authorization,apikey:anonKey,'Content-Type':'application/json'},
        body:JSON.stringify({lessonId:lesson.id,count:5,allowAi:false}),
      });
      if(!response.ok)return{lesson,ok:false};
      const payload=await response.json().catch(()=>null);
      if(!payload?.quiz?.questions?.length)return{lesson,ok:false};
      return{lesson,ok:true};
    }catch{return{lesson,ok:false}}
  }));

  const usableLessons=generationResults.filter((item:any)=>item.ok).map((item:any)=>item.lesson);
  if(!usableLessons.length)return json({error:{message:'Unable to build grounded class practice from the selected lessons right now'}},503,origin);

  const setRows:any[]=[];
  for(const lesson of usableLessons){
    const{data:set,error:setError}=await admin.from('lesson_practice_sets')
      .select('questions,generation_method,source_version')
      .eq('lesson_id',lesson.id)
      .maybeSingle();
    if(setError)throw setError;
    if(!set||(!Array.isArray(set.questions))||set.questions.length<3)continue;
    if(set.generation_method!=='ai'&&Number(set.source_version||0)<2)continue;
    setRows.push({lesson,set});
  }
  if(!setRows.length)return json({error:{message:'Grounded class-practice sets are not ready yet. Please try again.'}},503,origin);

  const privateQuestions:any[]=[];
  for(const entry of setRows){
    const lesson:any=entry.lesson,set:any=entry.set;
    for(let index=0;index<set.questions.length&&privateQuestions.length<requested;index++){
      const question:any=set.questions[index];
      const options=Array.isArray(question?.options)?question.options.map((value:any)=>String(value||'').trim()).filter(Boolean):[];
      if(options.length!==4)continue;
      const correctIndex=options.findIndex((value:string)=>value===String(question?.correctAnswer||''));
      if(correctIndex<0)continue;
      privateQuestions.push({
        id:crypto.randomUUID(),
        lessonId:String(lesson.id),
        topicId:lesson.topic_id||null,
        lessonTitle:String(lesson.title||'Lesson'),
        questionText:String(question.questionText||'').trim(),
        options:options.map((text:string,optionIndex:number)=>({id:String.fromCharCode(65+optionIndex),text})),
        correctOptionId:String.fromCharCode(65+correctIndex),
        practiceIndex:index,
        explanation:String(question.explanation||'').trim(),
        difficulty:String(question.difficulty||'medium'),
        generationMethod:String(set.generation_method||'grounded-fallback'),
      });
    }
  }
  if(!privateQuestions.length)return json({error:{message:'No usable grounded questions were generated for this selection'}},503,origin);

  const expiresAt=new Date(Date.now()+2*60*60*1000).toISOString();
  const{data:session,error:sessionError}=await admin.from('class_practice_sessions').insert({
    user_id:user.id,
    class_id:classId,
    subject_id:subjectId,
    questions:privateQuestions,
    question_count:privateQuestions.length,
    status:'active',
    expires_at:expiresAt,
  }).select('id,started_at,expires_at').single();
  if(sessionError)throw sessionError;

  const questions=privateQuestions.map((question:any)=>({
    id:question.id,
    question_text:question.questionText,
    options:question.options,
    difficulty:question.difficulty,
    lesson_title:question.lessonTitle,
    source:'class',
  }));
  return json({data:{sessionId:session.id,questions,requestedCount:requested,returnedCount:questions.length,expiresAt}},201,origin);
}

const gradeClassPracticeMatch=path.match(/^\/class-practice\/([0-9a-f-]+)\/grade$/i);
if(request.method==='POST'&&gradeClassPracticeMatch){
  const user=await requireUser();
  const sessionId=gradeClassPracticeMatch[1];
  const body=await request.json().catch(()=>null);
  const answers=Array.isArray(body?.answers)?body.answers.slice(0,50):[];
  const{data:session,error:sessionError}=await admin.from('class_practice_sessions')
    .select('*')
    .eq('id',sessionId)
    .eq('user_id',user.id)
    .maybeSingle();
  if(sessionError||!session)return json({error:{message:'Class practice session not found'}},404,origin);
  if(session.status!=='active')return json({error:{message:'This class practice session has already been submitted'}},409,origin);
  if(new Date(session.expires_at).getTime()<Date.now()){
    await admin.from('class_practice_sessions').update({status:'expired'}).eq('id',sessionId).eq('user_id',user.id);
    return json({error:{message:'This class practice session has expired'}},410,origin);
  }

  const questions=Array.isArray(session.questions)?session.questions:[];
  const byId=new Map(answers.map((item:any)=>[String(item?.questionId||''),String(item?.answer||'').trim().toUpperCase()]));
  let correct=0,answered=0;
  const results:any[]=[];
  const analyticsRows:any[]=[];
  for(const question of questions){
    const submitted=String(byId.get(String(question.id))||'');
    const isAnswered=/^[A-D]$/.test(submitted);
    const isCorrect=isAnswered&&submitted===String(question.correctOptionId||'');
    if(isAnswered)answered++;
    if(isCorrect)correct++;
    results.push({
      question_id:String(question.id),
      is_correct:isCorrect,
      correct_answer:String(question.correctOptionId||''),
      explanation:String(question.explanation||''),
    });
    if(isAnswered)analyticsRows.push({
      user_id:user.id,
      lesson_id:question.lessonId,
      topic_id:question.topicId||null,
      subject_id:session.subject_id,
      question_index:Number(question.practiceIndex||0),
      selected_answer_id:submitted,
      is_correct:isCorrect,
      generation_method:String(question.generationMethod||'grounded-fallback'),
    });
  }
  if(analyticsRows.length){
    const{error:analyticsError}=await admin.from('lesson_practice_attempts').insert(analyticsRows);
    if(analyticsError)console.error('Unable to record class-practice analytics',analyticsError.message);
  }
  const total=questions.length;
  const incorrect=Math.max(0,answered-correct);
  const unanswered=Math.max(0,total-answered);
  const percentage=total?Math.round(correct/total*10000)/100:0;
  const{error:updateError}=await admin.from('class_practice_sessions').update({
    status:'submitted',
    submitted_at:new Date().toISOString(),
    score:correct,
    percentage,
  }).eq('id',sessionId).eq('user_id',user.id);
  if(updateError)throw updateError;
  return json({data:{result:{total,answered,correct,incorrect,unanswered,percentage,results}}},200,origin);
}

if(request.method==='GET'&&path==='/jamb/course-presets'){
  await requireUser();
  const[{data:presetRows,error:presetError},{data:subjectRows,error:subjectError},{data:availabilityRows,error:availabilityError}]=await Promise.all([
    admin.from('jamb_course_presets').select('id,course_name,aliases,notes,source_url,priority').eq('is_active',true).order('priority').order('course_name'),
    admin.from('jamb_course_preset_subjects').select('preset_id,subject_id,order_index,subject:subjects(id,name,code)').order('order_index'),
    admin.rpc('get_jamb_subject_availability'),
  ]);
  if(presetError)throw presetError;if(subjectError)throw subjectError;if(availabilityError)throw availabilityError;
  const availability=new Map((availabilityRows||[]).map((row:any)=>[String(row.subject_id),Number(row.question_count||0)]));
  const grouped=new Map<string,any[]>();
  for(const row of subjectRows||[]){
    const key=String((row as any).preset_id||'');
    const list=grouped.get(key)||[];
    list.push({
      id:String((row as any).subject_id),
      name:String((row as any).subject?.name||'Subject'),
      code:String((row as any).subject?.code||''),
      orderIndex:Number((row as any).order_index||0),
      availableQuestions:availability.get(String((row as any).subject_id))||0,
    });
    grouped.set(key,list);
  }
  const subjectAvailability=Object.fromEntries([...availability.entries()]);
  const presets=(presetRows||[]).map((row:any)=>{
    const subjects=(grouped.get(String(row.id))||[]).sort((a,b)=>a.orderIndex-b.orderIndex);
    const maxBalancedCount=subjects.length?Math.min(...subjects.map(item=>item.availableQuestions)):0;
    return{
      id:String(row.id),
      courseName:String(row.course_name),
      aliases:Array.isArray(row.aliases)?row.aliases:[],
      notes:String(row.notes||''),
      sourceUrl:String(row.source_url||'https://eligibility.jamb.gov.ng/'),
      subjects,
      maxBalancedCount,
      readyForTenEach:subjects.length===4&&maxBalancedCount>=10,
    };
  });
  return json({data:{presets,subjectAvailability}},200,origin);
}

if(request.method==='POST'&&path==='/jamb-cbt/session'){
  const user=await requireUser();
  const body=await request.json().catch(()=>null);
  const durationMinutes=asInt(String(body?.durationMinutes||40),40,5,240);
  const rawPlan=Array.isArray(body?.subjects)?body.subjects.slice(0,4):[];
  const coursePresetId=String(body?.coursePresetId||'');
  if(rawPlan.length!==4)return json({error:{message:'JAMB CBT requires exactly four subjects'}},400,origin);

  const plan=rawPlan.map((item:any)=>({
    subjectId:String(item?.subjectId||''),
    count:asInt(String(item?.count||10),10,1,100),
  }));
  if(plan.some(item=>!/^[0-9a-f-]{36}$/i.test(item.subjectId)))return json({error:{message:'Every JAMB subject must be valid'}},400,origin);
  if(new Set(plan.map(item=>item.subjectId)).size!==4)return json({error:{message:'Select four different JAMB subjects'}},400,origin);
  const totalRequested=plan.reduce((sum,item)=>sum+item.count,0);
  if(totalRequested<4||totalRequested>200)return json({error:{message:'Combined JAMB CBT must contain between 4 and 200 questions'}},400,origin);

  const subjectIds=plan.map(item=>item.subjectId);
  const[{data:subjects,error:subjectsError},{data:availabilityRows,error:availabilityError}]=await Promise.all([
    admin.from('subjects').select('id,name,code').in('id',subjectIds).eq('is_active',true),
    admin.rpc('get_jamb_subject_availability'),
  ]);
  if(subjectsError)throw subjectsError;if(availabilityError)throw availabilityError;
  if((subjects||[]).length!==4)return json({error:{message:'One or more selected subjects are unavailable'}},400,origin);
  const subjectMap=new Map((subjects||[]).map((row:any)=>[String(row.id),row]));
  const englishSelected=(subjects||[]).some((row:any)=>/^(english language|use of english)$/i.test(String(row.name||'').trim()));
  if(!englishSelected)return json({error:{message:'JAMB CBT must include Use of English / English Language'}},400,origin);

  if(coursePresetId){
    if(!/^[0-9a-f-]{36}$/i.test(coursePresetId))return json({error:{message:'Invalid course preset'}},400,origin);
    const{data:presetSubjects,error:presetError}=await admin.from('jamb_course_preset_subjects')
      .select('subject_id').eq('preset_id',coursePresetId);
    if(presetError)throw presetError;
    const expected=new Set((presetSubjects||[]).map((row:any)=>String(row.subject_id)));
    if(expected.size!==4||subjectIds.some(id=>!expected.has(id))){
      return json({error:{message:'Selected subjects do not match the chosen course preset'}},400,origin);
    }
  }

  const availability=new Map((availabilityRows||[]).map((row:any)=>[String(row.subject_id),Number(row.question_count||0)]));
  for(const item of plan){
    const available=availability.get(item.subjectId)||0;
    if(available<item.count){
      const name=String((subjectMap.get(item.subjectId) as any)?.name||'This subject');
      return json({error:{message:`${name} currently has ${available} verified JAMB past question(s), below the requested ${item.count}.`,code:'INSUFFICIENT_JAMB_BANK',subjectId:item.subjectId,available,requested:item.count}},409,origin);
    }
  }

  const columns='id,year,subject_id,topic_id,question_text,question_image_url,options,difficulty,marks,source,tags,correct_answer,explanation';
  const loadSubject=async(item:{subjectId:string;count:number})=>{
    const available=availability.get(item.subjectId)||0;
    const windowSize=Math.min(250,Math.max(item.count*4,80));
    const windows=available<=windowSize?1:Math.min(6,Math.ceil((item.count*6)/windowSize));
    const pool:any[]=[];const seen=new Set<string>();
    for(let index=0;index<windows&&pool.length<Math.max(item.count*2,item.count+10);index++){
      const offset=available<=windowSize?0:Math.floor(Math.random()*Math.max(1,available-windowSize+1));
      const{data,error}=await admin.from('past_questions').select(columns)
        .eq('is_active',true)
        .ilike('board','jamb')
        .eq('subject_id',item.subjectId)
        .eq('question_type','mcq')
        .not('correct_answer','is',null)
        .or('source.like.storage:%,source.like.JAMB %')
        .range(offset,Math.min(available-1,offset+windowSize-1));
      if(error)throw error;
      for(const row of data||[]){
        if(seen.has(String(row.id)))continue;
        const answer=scalarAnswer(row.correct_answer);
        const options=Array.isArray(row.options)?row.options:[];
        if(!answer||options.length<4||!options.some((option:any)=>String(option?.id||'').toUpperCase()===answer.toUpperCase()))continue;
        seen.add(String(row.id));pool.push(row);
      }
    }
    for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}
    if(pool.length<item.count){
      const name=String((subjectMap.get(item.subjectId) as any)?.name||'Subject');
      throw Object.assign(new Error(`Only ${pool.length} clean verified ${name} questions could be assembled for this session`),{status:409});
    }
    return pool.slice(0,item.count).map((row:any)=>({
      id:String(row.id),
      year:row.year||null,
      subjectId:item.subjectId,
      subjectName:String((subjectMap.get(item.subjectId) as any)?.name||'Subject'),
      topicId:row.topic_id||null,
      questionText:String(row.question_text||''),
      questionImageUrl:row.question_image_url||null,
      options:row.options,
      difficulty:row.difficulty||null,
      marks:Number(row.marks||1),
      source:String(row.source||''),
      tags:Array.isArray(row.tags)?row.tags:[],
      correctAnswer:scalarAnswer(row.correct_answer),
      explanation:String(row.explanation||''),
    }));
  };

  const groups=await Promise.all(plan.map(loadSubject));
  const privateQuestions=groups.flat();
  for(let i=privateQuestions.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[privateQuestions[i],privateQuestions[j]]=[privateQuestions[j],privateQuestions[i]]}
  const subjectPlan=plan.map(item=>({
    subjectId:item.subjectId,
    subjectName:String((subjectMap.get(item.subjectId) as any)?.name||'Subject'),
    count:item.count,
    availableQuestions:availability.get(item.subjectId)||0,
  }));
  const startedAt=new Date();
  const expiresAt=new Date(startedAt.getTime()+durationMinutes*60*1000);
  const{data:session,error:sessionError}=await admin.from('jamb_cbt_sessions').insert({
    user_id:user.id,
    course_preset_id:coursePresetId||null,
    duration_minutes:durationMinutes,
    subject_plan:subjectPlan,
    questions:privateQuestions,
    question_count:privateQuestions.length,
    status:'active',
    started_at:startedAt.toISOString(),
    expires_at:expiresAt.toISOString(),
  }).select('id,started_at,expires_at,duration_minutes').single();
  if(sessionError)throw sessionError;

  const publicQuestions=privateQuestions.map((question:any)=>({
    id:question.id,
    year:question.year,
    subject_id:question.subjectId,
    subject_name:question.subjectName,
    question_text:question.questionText,
    question_image_url:question.questionImageUrl,
    options:question.options,
    difficulty:question.difficulty,
    marks:question.marks,
    board:'jamb',
    source:'exam',
  }));
  return json({data:{
    sessionId:session.id,
    startedAt:session.started_at,
    expiresAt:session.expires_at,
    durationMinutes:session.duration_minutes,
    subjectPlan,
    questionCount:publicQuestions.length,
    questions:publicQuestions,
  }},201,origin);
}

const saveJambAnswerMatch=path.match(/^\/jamb-cbt\/([0-9a-f-]+)\/answer$/i);
if(request.method==='POST'&&saveJambAnswerMatch){
  const user=await requireUser();
  const sessionId=saveJambAnswerMatch[1];
  const body=await request.json().catch(()=>null);
  const questionId=String(body?.questionId||'');
  const answer=scalarAnswer(body?.answer).toUpperCase();
  if(!/^[0-9a-f-]{36}$/i.test(sessionId)||!questionId||!/^[A-E]$/.test(answer)){
    return json({error:{message:'Valid JAMB session, question and answer are required'}},400,origin);
  }
  const{data:saved,error:saveError}=await admin.rpc('save_jamb_cbt_answer',{
    p_session_id:sessionId,
    p_user_id:user.id,
    p_question_id:questionId,
    p_answer:answer,
  });
  if(saveError)throw saveError;
  if(!saved)return json({error:{message:'Answer could not be saved because the session expired or the question is invalid'}},409,origin);
  return json({data:{saved:true,questionId}},200,origin);
}

const gradeJambCbtMatch=path.match(/^\/jamb-cbt\/([0-9a-f-]+)\/grade$/i);
if(request.method==='POST'&&gradeJambCbtMatch){
  const user=await requireUser();
  const sessionId=gradeJambCbtMatch[1];
  const body=await request.json().catch(()=>null);
  const answers=Array.isArray(body?.answers)?body.answers.slice(0,200):[];
  const{data:session,error:sessionError}=await admin.from('jamb_cbt_sessions').select('*')
    .eq('id',sessionId).eq('user_id',user.id).maybeSingle();
  if(sessionError||!session)return json({error:{message:'JAMB CBT session not found'}},404,origin);
  if(session.status!=='active')return json({error:{message:'This JAMB CBT session has already been submitted'}},409,origin);

  const questions=Array.isArray(session.questions)?session.questions:[];
  const nowMs=Date.now();
  const expiresMs=new Date(session.expires_at).getTime();
  const timedOut=nowMs>expiresMs;
  const savedAnswers=session.answers&&typeof session.answers==='object'&&!Array.isArray(session.answers)
    ?session.answers as Record<string,unknown>
    :{};
  const finalAnswerMap=new Map<string,string>(
    Object.entries(savedAnswers).map(([questionId,value])=>[questionId,scalarAnswer(value).toUpperCase()])
  );
  if(!timedOut){
    for(const item of answers){
      const questionId=String(item?.questionId||'');
      const answer=scalarAnswer(item?.answer).toUpperCase();
      if(questionId&&/^[A-E]$/.test(answer))finalAnswerMap.set(questionId,answer);
    }
  }
  const byId=finalAnswerMap;
  let correct=0,answered=0;
  const analyticsAnswers:any[]=[];
  const subjectStats=new Map<string,{subjectId:string;subjectName:string;total:number;correct:number;answered:number}>();
  const results=questions.map((question:any)=>{
    const submitted=String(byId.get(String(question.id))||'');
    const expected=String(question.correctAnswer||'').toUpperCase();
    const isAnswered=Boolean(submitted);
    const isCorrect=isAnswered&&submitted===expected;
    if(isAnswered)answered++;if(isCorrect)correct++;
    const stat=subjectStats.get(String(question.subjectId))||{
      subjectId:String(question.subjectId),
      subjectName:String(question.subjectName||'Subject'),
      total:0,correct:0,answered:0,
    };
    stat.total++;if(isAnswered)stat.answered++;if(isCorrect)stat.correct++;subjectStats.set(stat.subjectId,stat);
    analyticsAnswers.push({
      questionId:String(question.id),
      subjectId:String(question.subjectId),
      topicId:question.topicId||null,
      topicLabel:inferPastQuestionTopic(question.subjectName,question.tags,question.questionText),
      answered:isAnswered,
      isCorrect,
    });
    return{
      question_id:String(question.id),
      is_correct:isCorrect,
      correct_answer:expected,
      explanation:String(question.explanation||'')||null,
    };
  });

  const total=questions.length;
  const incorrect=Math.max(0,answered-correct);
  const unanswered=Math.max(0,total-answered);
  const percentage=total?Math.round(correct/total*10000)/100:0;
  const startedMs=new Date(session.started_at).getTime();
  const timeSpentSeconds=Math.max(0,Math.round((Math.min(nowMs,expiresMs)-startedMs)/1000));
  const{data:attempt,error:attemptError}=await admin.from('past_question_attempts').insert({
    user_id:user.id,
    board:'jamb',
    year:null,
    question_count:total,
    answered_count:answered,
    correct_count:correct,
    incorrect_count:incorrect,
    unanswered_count:unanswered,
    percentage,
    time_spent_seconds:timeSpentSeconds,
    answers:analyticsAnswers,
    submitted_at:new Date().toISOString(),
  }).select('id,submitted_at').single();
  if(attemptError)throw attemptError;

  const{error:updateError}=await admin.from('jamb_cbt_sessions').update({
    status:'submitted',
    submitted_at:new Date().toISOString(),
    score:correct,
    percentage,
  }).eq('id',sessionId).eq('user_id',user.id);
  if(updateError)throw updateError;

  const subjectBreakdown=[...subjectStats.values()].map(row=>({
    ...row,
    percentage:row.total?Math.round(row.correct/row.total*10000)/100:0,
  }));
  return json({data:{result:{
    total,answered,correct,incorrect,unanswered,percentage,
    attemptId:attempt.id,results,subjectBreakdown,timedOut,timeSpentSeconds,
  }}},200,origin);
}

if(request.method==='GET'&&path==='/past-questions'){const page=asInt(url.searchParams.get('page'),1,1,10000),limit=asInt(url.searchParams.get('limit'),20,1,100),board=url.searchParams.get('board'),subjectId=url.searchParams.get('subjectId'),year=url.searchParams.get('year'),questionType=String(url.searchParams.get('questionType')||'').toLowerCase(),from=(page-1)*limit;let query=admin.from('past_questions').select('id,board,year,subject_id,topic_id,question_type,question_text,question_image_url,options,difficulty,marks,source,tags,correct_answer',{count:'exact'}).eq('is_active',true).order('year',{ascending:false}).range(from,from+limit-1);if(board)query=query.ilike('board',board);if(subjectId)query=query.eq('subject_id',subjectId);if(year)query=query.eq('year',Number(year));if(['mcq','essay'].includes(questionType))query=query.eq('question_type',questionType);const{data,error,count}=await query;if(error)throw error;const questions=(data||[]).map((row:any)=>{const{correct_answer,...safe}=row;return{...safe,hasAnswer:Boolean(scalarAnswer(correct_answer)),storageBacked:String(row.source||'').startsWith('storage:')}});const total=count||0;return json({data:{questions},pagination:{page,limit,total,totalPages:Math.ceil(total/limit)}},200,origin)}
if(request.method==='GET'&&path==='/past-question-availability'){const{data,error}=await admin.rpc('get_past_question_availability');if(error)throw error;return new Response(JSON.stringify({data:{availability:data||{}}}),{status:200,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'GET, POST, PATCH, DELETE, OPTIONS','Cache-Control':'public, max-age=300, stale-while-revalidate=900','Vary':'Origin'}})}

if(request.method==='POST'&&path==='/past-questions/session'){
  await requireUser();
  const body=await request.json().catch(()=>null);
  const board=String(body?.board||'').toLowerCase();
  const subjectId=String(body?.subjectId||'');
  const year=body?.year?Number(body.year):null;
  const requested=asInt(String(body?.count||20),20,5,100);
  if(!['jamb','waec','neco','nabteb'].includes(board))return json({error:{message:'Valid examination board is required'}},400,origin);
  if(!/^[0-9a-f-]{36}$/i.test(subjectId))return json({error:{message:'Valid subject is required'}},400,origin);
  const applyFilters=(query:any)=>{
    let q=query.eq('is_active',true).ilike('board',board).eq('subject_id',subjectId).eq('question_type','mcq').not('correct_answer','is',null);
    if(year)q=q.eq('year',year);
    return q;
  };
  const countResult=await applyFilters(admin.from('past_questions').select('id',{count:'exact',head:true}));
  if(countResult.error)throw countResult.error;
  const total=countResult.count||0;
  if(!total)return json({error:{message:'No graded multiple-choice questions are available for this selection yet'}},404,origin);
  const columns='id,board,year,subject_id,question_type,question_text,question_image_url,options,difficulty,marks,source,correct_answer';
  const pool:any[]=[]; const seen=new Set<string>();
  const windowSize=Math.min(200,Math.max(requested*3,60));
  const windows=total<=windowSize?1:Math.min(5,Math.ceil((requested*5)/windowSize));
  for(let i=0;i<windows;i++){
    const offset=total<=windowSize?0:Math.floor(Math.random()*Math.max(1,total-windowSize+1));
    const query=applyFilters(admin.from('past_questions').select(columns)).range(offset,Math.min(total-1,offset+windowSize-1));
    const{data,error}=await query;if(error)throw error;
    for(const row of data||[]){
      if(seen.has(row.id))continue;
      const answer=scalarAnswer(row.correct_answer),options=Array.isArray(row.options)?row.options:[];
      if(!answer||options.length<2)continue;
      seen.add(row.id);pool.push(row);
    }
  }
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}
  const selected=pool.slice(0,Math.min(requested,pool.length)).map((row:any)=>{const{correct_answer,...safe}=row;return safe});
  if(!selected.length)return json({error:{message:'No usable graded questions were found for this selection'}},404,origin);
  return json({data:{questions:selected,requestedCount:requested,returnedCount:selected.length,availableCount:total}},200,origin)
}
if(request.method==='POST'&&path==='/past-questions/grade'){
  const user=await requireUser();
  const body=await request.json().catch(()=>null);
  const answers=Array.isArray(body?.answers)?body.answers.slice(0,100):[];
  if(!answers.length)return json({error:{message:'Answers are required'}},400,origin);
  const ids=[...new Set(answers.map((item:any)=>String(item?.questionId||'')).filter((id:string)=>/^[0-9a-f-]{36}$/i.test(id)))];
  if(!ids.length)return json({error:{message:'Valid question IDs are required'}},400,origin);
  const{data,error}=await admin.from('past_questions')
    .select('id,board,year,subject_id,topic_id,tags,question_text,correct_answer,explanation,is_active,subject:subjects(name),topic:topics(name)')
    .in('id',ids).eq('is_active',true);
  if(error)throw error;
  const rows=data||[];
  const byId=new Map(rows.map((row:any)=>[String(row.id),row]));
  let correct=0,incorrect=0,unanswered=0;
  const analyticsAnswers:any[]=[];
  const results=answers.map((item:any)=>{
    const id=String(item?.questionId||''),row:any=byId.get(id),submitted=scalarAnswer(item?.answer);
    const expected=row?scalarAnswer(row.correct_answer):null;
    const answered=Boolean(row&&submitted);
    if(!row||!submitted){
      unanswered++;
      if(row)analyticsAnswers.push({
        questionId:id,
        subjectId:row.subject_id||null,
        topicId:row.topic_id||null,
        topicLabel:String(row.topic?.name||inferPastQuestionTopic(row.subject?.name,row.tags,row.question_text)),
        answered:false,
        isCorrect:false,
      });
      return{question_id:id,is_correct:false,correct_answer:expected,explanation:row?.explanation||null};
    }
    const ok=Boolean(expected&&submitted.toLowerCase()===expected.toLowerCase());
    if(ok)correct++;else incorrect++;
    analyticsAnswers.push({
      questionId:id,
      subjectId:row.subject_id||null,
      topicId:row.topic_id||null,
      topicLabel:String(row.topic?.name||inferPastQuestionTopic(row.subject?.name,row.tags,row.question_text)),
      answered,
      isCorrect:ok,
    });
    return{question_id:id,is_correct:ok,correct_answer:expected,explanation:row.explanation||null};
  });
  const total=answers.length,answered=Math.max(0,total-unanswered),percentage=total?Math.round(correct/total*10000)/100:0;
  const requestedBoard=String(body?.board||'').toLowerCase();
  const inferredBoard=String(rows[0]?.board||'').toLowerCase();
  const board=['jamb','waec','neco','nabteb'].includes(requestedBoard)?requestedBoard:(inferredBoard||'unknown');
  const requestedYear=Number(body?.year||0);
  const year=Number.isInteger(requestedYear)&&requestedYear>=1900&&requestedYear<=2200?requestedYear:null;
  const timeSpentSeconds=Math.max(0,Math.min(86400,Number(body?.timeSpentSeconds||0)||0));
  const{data:attempt,error:attemptError}=await admin.from('past_question_attempts').insert({
    user_id:user.id,
    board,
    year,
    question_count:total,
    answered_count:answered,
    correct_count:correct,
    incorrect_count:incorrect,
    unanswered_count:unanswered,
    percentage,
    time_spent_seconds:timeSpentSeconds,
    answers:analyticsAnswers,
    submitted_at:new Date().toISOString(),
  }).select('id,submitted_at').single();
  if(attemptError)throw attemptError;
  return json({data:{result:{total,answered,correct,incorrect,unanswered,percentage,attemptId:attempt.id,results}}},200,origin)
}

if(request.method==='GET'&&path==='/past-questions/insights'){
  const user=await requireUser();
  const limit=asInt(url.searchParams.get('limit'),200,1,500);
  const{data:attemptRows,error:attemptError}=await admin.from('past_question_attempts')
    .select('id,board,year,question_count,answered_count,correct_count,incorrect_count,unanswered_count,percentage,time_spent_seconds,answers,submitted_at')
    .eq('user_id',user.id).order('submitted_at',{ascending:false}).limit(limit);
  if(attemptError)throw attemptError;
  const attempts=attemptRows||[];
  const subjectStats=new Map<string,{subjectId:string;attempts:number;correct:number}>();
  const topicStats=new Map<string,{key:string;topicId:string|null;topicName:string;subjectId:string;attempts:number;correct:number}>();
  const boardStats=new Map<string,{board:string;sessions:number;questions:number;correct:number}>();
  let questions=0,correct=0,timeSpentSeconds=0;

  for(const attempt of attempts as any[]){
    const questionCount=Math.max(0,Number(attempt.question_count||0));
    const correctCount=Math.max(0,Number(attempt.correct_count||0));
    questions+=questionCount;
    correct+=correctCount;
    timeSpentSeconds+=Math.max(0,Number(attempt.time_spent_seconds||0));
    const board=String(attempt.board||'unknown').toLowerCase();
    const boardRow=boardStats.get(board)||{board,sessions:0,questions:0,correct:0};
    boardRow.sessions+=1; boardRow.questions+=questionCount; boardRow.correct+=correctCount; boardStats.set(board,boardRow);
    const answerRows=Array.isArray(attempt.answers)?attempt.answers:[];
    for(const answer of answerRows){
      if(!answer?.answered)continue;
      const subjectId=String(answer?.subjectId||'');
      const topicId=String(answer?.topicId||'');
      const topicName=String(answer?.topicLabel||'').trim();
      if(subjectId){
        const row=subjectStats.get(subjectId)||{subjectId,attempts:0,correct:0};
        row.attempts+=1;if(answer?.isCorrect)row.correct+=1;subjectStats.set(subjectId,row);
      }
      if(topicName){
        const key=(topicId?'id:'+topicId:'label:'+subjectId+':'+topicName.toLowerCase());
        const row=topicStats.get(key)||{key,topicId:topicId||null,topicName,subjectId,attempts:0,correct:0};
        row.attempts+=1;if(answer?.isCorrect)row.correct+=1;topicStats.set(key,row);
      }
    }
  }

  const subjectIds=[...subjectStats.keys()];
  const{data:subjectRows,error:subjectError}=subjectIds.length
    ?await admin.from('subjects').select('id,name').in('id',subjectIds)
    :{data:[],error:null};
  if(subjectError)throw subjectError;
  const subjectName=new Map((subjectRows||[]).map((row:any)=>[String(row.id),String(row.name||'Subject')]));

  const subjects=[...subjectStats.values()].map(row=>({
    subjectId:row.subjectId,
    subjectName:subjectName.get(row.subjectId)||'Subject',
    attempts:row.attempts,
    correct:row.correct,
    accuracy:row.attempts?Math.round(row.correct/row.attempts*10000)/100:0,
  })).sort((a,b)=>b.attempts-a.attempts);

  const topics=[...topicStats.values()].map(row=>({
    topicId:row.topicId||row.key,
    topicName:row.topicName,
    subjectId:row.subjectId||null,
    subjectName:subjectName.get(row.subjectId)||'Subject',
    attempts:row.attempts,
    correct:row.correct,
    accuracy:row.attempts?Math.round(row.correct/row.attempts*10000)/100:0,
  }));
  const strongTopics=topics.filter(row=>row.attempts>=3&&row.accuracy>=75)
    .sort((a,b)=>b.accuracy-a.accuracy||b.attempts-a.attempts).slice(0,8);
  const weakTopics=topics.filter(row=>row.attempts>=3&&row.accuracy<60)
    .sort((a,b)=>a.accuracy-b.accuracy||b.attempts-a.attempts).slice(0,8);
  const weakSubjects=subjects.filter(row=>row.attempts>=5&&row.accuracy<60)
    .sort((a,b)=>a.accuracy-b.accuracy||b.attempts-a.attempts).slice(0,8);
  const boards=[...boardStats.values()].map(row=>({
    ...row,
    accuracy:row.questions?Math.round(row.correct/row.questions*10000)/100:0,
  })).sort((a,b)=>b.sessions-a.sessions);

  return json({data:{insights:{
    sessions:attempts.length,
    questions,
    correct,
    accuracy:questions?Math.round(correct/questions*10000)/100:0,
    timeSpentSeconds,
    boards,
    subjects,
    strongTopics,
    weakTopics,
    weakSubjects,
    recentAttempts:attempts.slice(0,10).map((row:any)=>({
      id:row.id,
      board:row.board,
      year:row.year,
      questionCount:Number(row.question_count||0),
      correctCount:Number(row.correct_count||0),
      percentage:Number(row.percentage||0),
      timeSpentSeconds:Number(row.time_spent_seconds||0),
      submittedAt:row.submitted_at,
    })),
  }}},200,origin)
}
const explainPastQuestionMatch=path.match(/^\/past-questions\/([0-9a-f-]+)\/explain$/i);
if(request.method==='POST'&&explainPastQuestionMatch){
  const user=await requireUser();
  const questionId=explainPastQuestionMatch[1];

  const{data:attemptRows,error:attemptError}=await admin.from('past_question_attempts')
    .select('id,answers')
    .eq('user_id',user.id)
    .contains('answers',[{questionId}])
    .order('submitted_at',{ascending:false})
    .limit(1);
  if(attemptError)throw attemptError;
  if(!(attemptRows||[]).length)return json({error:{message:'Submit this question in a graded CBT before requesting an explanation'}},403,origin);

  const{data:question,error:questionError}=await admin.from('past_questions')
    .select('id,board,year,subject_id,question_text,options,correct_answer,explanation,explanation_source,is_active,subject:subjects(name)')
    .eq('id',questionId).eq('is_active',true).maybeSingle();
  if(questionError||!question)return json({error:{message:'Question not found'}},404,origin);
  const correct=scalarAnswer(question.correct_answer);
  if(!correct)return json({error:{message:'This question does not have a verified answer key yet'}},409,origin);

  const existing=String(question.explanation||'').trim();
  if(existing)return json({data:{explanation:existing,source:String(question.explanation_source||'source'),cached:true}},200,origin);

  const optionText=Array.isArray(question.options)
    ?question.options.map((option:any,index:number)=>`${String.fromCharCode(65+index)}. ${String(option?.text??option?.value??option??'')}`).join('\n')
    :question.options&&typeof question.options==='object'
      ?Object.entries(question.options as Record<string,unknown>).map(([key,value]:[string,unknown])=>`${key}. ${String((value as any)?.text??(value as any)?.value??value??'')}`).join('\n')
      :'';
  const prompt=[
    'Explain this verified examination question accurately for a Nigerian student.',
    `Examination: ${String(question.board||'').toUpperCase()}${question.year?' '+question.year:''}.`,
    `Subject: ${String((question as any).subject?.name||'General')}.`,
    `Question: ${String(question.question_text||'').slice(0,6000)}`,
    optionText?`Options:\n${optionText.slice(0,4000)}`:'',
    `Verified correct answer: ${correct}.`,
    'Explain why the verified answer is correct and, where useful, why the main distractors are wrong. Do not change the answer key or invent missing source facts. Keep the explanation clear and concise.'
  ].filter(Boolean).join('\n\n');

  const aiResponse=await fetch(`${supabaseUrl}/functions/v1/ai`,{
    method:'POST',
    headers:{
      Authorization:authorization,
      apikey:anonKey,
      'Content-Type':'application/json',
    },
    body:JSON.stringify({
      action:'explain',
      question:prompt,
      subjectId:question.subject_id||undefined,
      level:'intermediate',
    }),
  });
  const aiPayload=await aiResponse.json().catch(()=>null);
  if(!aiResponse.ok||aiPayload?.error){
    const message=String(aiPayload?.error||'AI explanation is temporarily unavailable');
    return json({error:{message}},aiResponse.status>=400?aiResponse.status:503,origin);
  }
  const explanation=String(aiPayload?.explanation?.explanation||'').trim().slice(0,12000);
  if(explanation.length<40)return json({error:{message:'AI explanation was incomplete. Please try again.'}},503,origin);

  const{error:cacheError}=await admin.from('past_questions').update({
    explanation,
    explanation_source:'ai-grounded',
    explanation_generated_at:new Date().toISOString(),
    updated_at:new Date().toISOString(),
  }).eq('id',questionId).eq('is_active',true);
  if(cacheError)throw cacheError;

  return json({data:{explanation,source:'ai-grounded',cached:false}},200,origin);
}

const questionCheck=path.match(/^\/(questions|past-questions)\/([0-9a-f-]+)\/check$/i);if(request.method==='POST'&&questionCheck){await requireUser();const payload=await request.json().catch(()=>({}));const submitted=scalarAnswer(payload?.answer);if(!submitted)return json({error:{message:'Answer is required'}},400,origin);const table=questionCheck[1]==='past-questions'?'past_questions':'questions';const columns=table==='past_questions'?'id,correct_answer,explanation,is_active':'id,correct_answer,explanation,explanation_image_url,is_active';const{data:row,error}=await admin.from(table).select(columns).eq('id',questionCheck[2]).eq('is_active',true).maybeSingle();if(error||!row)return json({error:{message:'Question not found'}},404,origin);const correctAnswer=scalarAnswer((row as any).correct_answer);if(!correctAnswer)return json({data:{result:{isCorrect:null,correctAnswer:null,explanation:(row as any).explanation||'This source question does not include a verified answer key yet. Your response is kept as practice and is not marked right or wrong.',explanationImageUrl:(row as any).explanation_image_url||null}}},200,origin);const isCorrect=submitted.toLowerCase()===correctAnswer.toLowerCase();return json({data:{result:{isCorrect,correctAnswer,explanation:(row as any).explanation||null,explanationImageUrl:(row as any).explanation_image_url||null}}},200,origin)}

if(request.method==='GET'&&path==='/exams'){
  const page=asInt(url.searchParams.get('page'),1,1,10000),limit=asInt(url.searchParams.get('limit'),100,1,100),from=(page-1)*limit;
  const examType=url.searchParams.get('examType'),subjectId=url.searchParams.get('subjectId'),classId=url.searchParams.get('classId');
  let examQuery=admin.from('exams').select('id,title,description,exam_type,subject_id,class_id,duration_minutes,total_marks,passing_marks,instructions,is_timed,shuffle_questions,show_results_immediately,allow_review,max_attempts,is_active,is_public,created_at',{count:'exact'}).eq('is_active',true).eq('is_public',true).order('created_at',{ascending:false}).range(from,from+limit-1);
  if(examType)examQuery=examQuery.eq('exam_type',examType);
  if(subjectId)examQuery=examQuery.eq('subject_id',subjectId);
  if(classId)examQuery=examQuery.eq('class_id',classId);
  const{data:examRows,error:examError,count}=await examQuery;
  if(examError)throw examError;
  const ids=(examRows||[]).map((row:any)=>row.id);
  let links:any[]=[];
  if(ids.length){
    const result=await admin.from('exam_questions').select('exam_id,question:questions(source,is_active)').in('exam_id',ids);
    if(result.error)throw result.error;
    links=result.data||[];
  }
  const counts=new Map<string,number>();
  for(const row of links){const q:any=row.question;if(!q?.is_active||!isVerifiedExamSource(q?.source))continue;counts.set(String(row.exam_id),(counts.get(String(row.exam_id))||0)+1);}
  const exams=(examRows||[]).map((row:any)=>({...row,questionCount:counts.get(String(row.id))||0})).filter((row:any)=>row.questionCount>0);
  return json({data:{exams},pagination:{page,limit,total:count||0,totalPages:Math.ceil((count||0)/limit)}},200,origin);
}

const examMatch=path.match(/^\/exams\/([0-9a-f-]+)$/i);
if(request.method==='GET'&&examMatch){
  const examId=examMatch[1];
  const{data:exam,error}=await admin.from('exams').select('id,title,description,exam_type,duration_minutes,total_marks,passing_marks,instructions,is_timed,shuffle_questions,show_results_immediately,allow_review,max_attempts,is_active,is_public,start_time,end_time').eq('id',examId).eq('is_active',true).eq('is_public',true).maybeSingle();
  if(error||!exam)return json({error:{message:'Exam not found'}},404,origin);
  const{data:detailLinks,error:countError}=await admin.from('exam_questions').select('question:questions(source,is_active)').eq('exam_id',examId);
  if(countError)throw countError;
  const questionCount=(detailLinks||[]).filter((row:any)=>row.question?.is_active&&isVerifiedExamSource(row.question?.source)).length;
  if(!questionCount)return json({error:{message:'Exam not found'}},404,origin);
  return json({data:{exam,stats:{questionCount,totalMarks:Number(exam.total_marks||0)}}},200,origin);
}
const startExamMatch=path.match(/^\/exams\/([0-9a-f-]+)\/attempts$/i);
if(request.method==='POST'&&startExamMatch){
  const user=await requireUser(); const examId=startExamMatch[1];
  const{data:exam,error}=await admin.from('exams').select('*').eq('id',examId).eq('is_active',true).eq('is_public',true).maybeSingle();
  if(error||!exam)return json({error:{message:'Exam not found'}},404,origin);
  const now=Date.now();
  if(exam.start_time&&new Date(exam.start_time).getTime()>now)return json({error:{message:'Exam has not started yet'}},400,origin);
  if(exam.end_time&&new Date(exam.end_time).getTime()<now)return json({error:{message:'Exam has ended'}},400,origin);

  const{data:attemptRows,error:attemptRowsError}=await admin.from('exam_attempts')
    .select('id,exam_id,student_id,attempt_number,status,started_at,submitted_at,time_spent_seconds,score,percentage,is_passed,metadata')
    .eq('exam_id',examId).eq('student_id',user.id).order('attempt_number',{ascending:false});
  if(attemptRowsError)throw attemptRowsError;
  const attempts=attemptRows||[];
  const maxAttempts=Math.max(1,Number(exam.max_attempts||5));
  const durationSeconds=Math.max(60,Number(exam.duration_minutes||60)*60);
  let active:any=attempts.find((row:any)=>row.status==='in_progress')||null;
  let finalized=attempts.filter((row:any)=>row.status==='submitted'||row.status==='expired').length;

  if(active&&exam.is_timed){
    const meta=(active.metadata&&typeof active.metadata==='object')?active.metadata:{};
    const startedMs=new Date(active.started_at).getTime();
    const deadlineMs=Date.parse(String(meta.deadlineAt||''))||startedMs+durationSeconds*1000;
    if(now>deadlineMs){
      const expiredMeta={...meta,timedOut:true,deadlineAt:new Date(deadlineMs).toISOString()};
      const expired=await admin.from('exam_attempts').update({
        status:'expired',
        submitted_at:new Date(deadlineMs).toISOString(),
        time_spent_seconds:durationSeconds,
        metadata:expiredMeta,
      }).eq('id',active.id).eq('student_id',user.id);
      if(expired.error)throw expired.error;
      active=null;
      finalized+=1;
    }
  }
  if(!active&&finalized>=maxAttempts)return json({error:{message:'Maximum attempts reached for this exam'}},400,origin);

  const{data:links,error:linksError}=await admin.from('exam_questions')
    .select('id,question_id,order_index,marks,section_name,question:questions(id,question_text,question_type,options,difficulty,is_active,source)')
    .eq('exam_id',examId).order('order_index',{ascending:true});
  if(linksError)throw linksError;
  const available=(links||[]).filter((row:any)=>row.question?.is_active&&isVerifiedExamSource(row.question?.source));
  if(!available.length)return json({error:{message:'This exam has no available questions'}},400,origin);

  let selected:any[]=[];
  let attempt:any=active;
  let metadata:any=(active?.metadata&&typeof active.metadata==='object')?active.metadata:{};
  if(active){
    const ids=Array.isArray(metadata.questionIds)?metadata.questionIds.map((id:any)=>String(id)):[];
    if(ids.length){
      const byId=new Map(available.map((row:any)=>[String(row.question_id),row]));
      selected=ids.map((id:string)=>byId.get(id)).filter(Boolean);
    }
    if(!selected.length)selected=[...available];
  }else{
    selected=[...available];
    if(exam.shuffle_questions)selected.sort(()=>Math.random()-0.5);
    const startedAt=new Date();
    const deadlineAt=exam.is_timed?new Date(startedAt.getTime()+durationSeconds*1000).toISOString():null;
    metadata={
      questionIds:selected.map((row:any)=>String(row.question_id)),
      deadlineAt,
      durationSeconds,
      timed:Boolean(exam.is_timed),
    };
    const nextAttemptNumber=Math.max(0,...attempts.map((row:any)=>Number(row.attempt_number||0)))+1;
    const created=await admin.from('exam_attempts').insert({
      exam_id:examId,
      student_id:user.id,
      attempt_number:nextAttemptNumber,
      status:'in_progress',
      started_at:startedAt.toISOString(),
      metadata,
    }).select('id,exam_id,student_id,attempt_number,status,started_at,metadata').single();
    if(created.error)throw created.error;
    attempt=created.data;
  }

  if(!Array.isArray(metadata.questionIds)||!metadata.questionIds.length){
    metadata={
      ...metadata,
      questionIds:selected.map((row:any)=>String(row.question_id)),
      durationSeconds,
      timed:Boolean(exam.is_timed),
      deadlineAt:exam.is_timed
        ? new Date(new Date(attempt.started_at).getTime()+durationSeconds*1000).toISOString()
        : null,
    };
    const patched=await admin.from('exam_attempts').update({metadata}).eq('id',attempt.id).eq('student_id',user.id);
    if(patched.error)throw patched.error;
  }

  const{data:savedAnswerRows,error:savedAnswerError}=await admin.from('exam_answers')
    .select('question_id,student_answer')
    .eq('attempt_id',attempt.id);
  if(savedAnswerError)throw savedAnswerError;
  const savedAnswers=(savedAnswerRows||[]).map((row:any)=>({questionId:String(row.question_id),studentAnswer:row.student_answer}));

  const questions=selected.map((row:any)=>({
    id:row.id,
    questionId:row.question_id,
    questionText:row.question?.question_text||'',
    questionType:row.question?.question_type||'mcq',
    options:row.question?.options||[],
    marks:Number(row.marks||1),
    orderIndex:Number(row.order_index||0),
    sectionName:row.section_name||undefined,
    difficulty:row.question?.difficulty||undefined,
  }));
  const deadlineMs=exam.is_timed
    ? (Date.parse(String(metadata.deadlineAt||''))||new Date(attempt.started_at).getTime()+durationSeconds*1000)
    : null;
  const remainingSeconds=exam.is_timed?Math.max(0,Math.ceil(((deadlineMs as number)-Date.now())/1000)):0;
  return json({data:{
    attempt,
    exam:{
      id:exam.id,
      title:exam.title,
      durationMinutes:Number(exam.duration_minutes||60),
      isTimed:Boolean(exam.is_timed),
      totalQuestions:questions.length,
      remainingSeconds,
    },
    questions,
    savedAnswers,
    resumed:Boolean(active),
  }},active?200:201,origin);
}

const saveExamAnswerMatch=path.match(/^\/exams\/([0-9a-f-]+)\/attempts\/([0-9a-f-]+)\/answer$/i);
if(request.method==='PATCH'&&saveExamAnswerMatch){
  const user=await requireUser(); const examId=saveExamAnswerMatch[1],attemptId=saveExamAnswerMatch[2];
  const payload=await request.json().catch(()=>({}));
  const questionId=String(payload?.questionId||'');
  if(!/^[0-9a-f-]{36}$/i.test(questionId))return json({error:{message:'Valid question ID is required'}},400,origin);
  const{data:attempt,error:attemptError}=await admin.from('exam_attempts')
    .select('id,status,started_at,metadata')
    .eq('id',attemptId).eq('exam_id',examId).eq('student_id',user.id).maybeSingle();
  if(attemptError||!attempt)return json({error:{message:'Attempt not found'}},404,origin);
  if(attempt.status!=='in_progress')return json({error:{message:'This attempt is no longer active'}},409,origin);

  const{data:exam,error:examError}=await admin.from('exams').select('is_timed,duration_minutes').eq('id',examId).maybeSingle();
  if(examError||!exam)return json({error:{message:'Exam not found'}},404,origin);
  const metadata=(attempt.metadata&&typeof attempt.metadata==='object')?attempt.metadata:{};
  if(exam.is_timed){
    const deadlineMs=Date.parse(String(metadata.deadlineAt||''))||new Date(attempt.started_at).getTime()+Math.max(60,Number(exam.duration_minutes||60)*60)*1000;
    if(Date.now()>deadlineMs)return json({error:{message:'Time is up for this attempt'}},409,origin);
  }
  const assigned=Array.isArray(metadata.questionIds)?metadata.questionIds.map((id:any)=>String(id)):[];
  if(assigned.length&&!assigned.includes(questionId))return json({error:{message:'Question is not part of this attempt'}},400,origin);
  const{data:link,error:linkError}=await admin.from('exam_questions').select('question_id').eq('exam_id',examId).eq('question_id',questionId).maybeSingle();
  if(linkError||!link)return json({error:{message:'Question is not part of this exam'}},400,origin);

  const answer=payload?.studentAnswer;
  if(answer===undefined||answer===null||String(answer).trim()===''){
    const deleted=await admin.from('exam_answers').delete().eq('attempt_id',attemptId).eq('question_id',questionId);
    if(deleted.error)throw deleted.error;
    return json({data:{saved:true,cleared:true}},200,origin);
  }

  const saved=await admin.from('exam_answers').upsert({
    attempt_id:attemptId,
    question_id:questionId,
    student_answer:answer,
    is_correct:null,
    marks_obtained:0,
    time_spent_seconds:Number(payload?.timeSpentSeconds||0)||null,
    answered_at:new Date().toISOString(),
  },{onConflict:'attempt_id,question_id'}).select('id,question_id,answered_at').single();
  if(saved.error)throw saved.error;
  return json({data:{saved:true,answer:saved.data}},200,origin);
}

const submitExamMatch=path.match(/^\/exams\/([0-9a-f-]+)\/attempts\/([0-9a-f-]+)\/submit$/i);
if(request.method==='POST'&&submitExamMatch){
  const user=await requireUser(); const examId=submitExamMatch[1],attemptId=submitExamMatch[2];
  const payload=await request.json().catch(()=>({})); const submittedAnswers=Array.isArray(payload?.answers)?payload.answers:[];

  const{data:attempt,error:attemptError}=await admin.from('exam_attempts').select('*')
    .eq('id',attemptId).eq('exam_id',examId).eq('student_id',user.id).maybeSingle();
  if(attemptError||!attempt)return json({error:{message:'Attempt not found'}},404,origin);
  if(attempt.status==='submitted')return json({error:{message:'Attempt already submitted'}},409,origin);
  if(attempt.status==='expired'&&attempt.score!==null)return json({error:{message:'Attempt already finalized'}},409,origin);

  const{data:exam,error:examError}=await admin.from('exams')
    .select('id,title,passing_marks,total_marks,show_results_immediately,allow_review,is_timed,duration_minutes,end_time')
    .eq('id',examId).maybeSingle();
  if(examError||!exam)return json({error:{message:'Exam not found'}},404,origin);

  const metadata=(attempt.metadata&&typeof attempt.metadata==='object')?attempt.metadata:{};
  const durationSeconds=Math.max(60,Number(exam.duration_minutes||60)*60);
  const deadlineMs=exam.is_timed
    ? (Date.parse(String(metadata.deadlineAt||''))||new Date(attempt.started_at).getTime()+durationSeconds*1000)
    : null;
  const timedOut=Boolean(exam.is_timed&&deadlineMs&&Date.now()>deadlineMs);

  if(!timedOut&&submittedAnswers.length){
    const assigned=Array.isArray(metadata.questionIds)?metadata.questionIds.map((id:any)=>String(id)):[];
    const rows=submittedAnswers
      .map((item:any)=>({
        questionId:String(item?.questionId||''),
        studentAnswer:item?.studentAnswer,
        timeSpentSeconds:Number(item?.timeSpentSeconds||0)||null,
      }))
      .filter((item:any)=>/^[0-9a-f-]{36}$/i.test(item.questionId)&&(!assigned.length||assigned.includes(item.questionId))&&item.studentAnswer!==undefined&&item.studentAnswer!==null&&String(item.studentAnswer).trim()!=='')
      .map((item:any)=>({
        attempt_id:attemptId,
        question_id:item.questionId,
        student_answer:item.studentAnswer,
        is_correct:null,
        marks_obtained:0,
        time_spent_seconds:item.timeSpentSeconds,
        answered_at:new Date().toISOString(),
      }));
    if(rows.length){
      const saved=await admin.from('exam_answers').upsert(rows,{onConflict:'attempt_id,question_id'});
      if(saved.error)throw saved.error;
    }
  }

  const{data:allLinks,error:linksError}=await admin.from('exam_questions')
    .select('question_id,marks,question:questions(id,question_text,question_type,options,correct_answer,explanation,is_active,source)')
    .eq('exam_id',examId);
  if(linksError)throw linksError;
  const verified=(allLinks||[]).filter((row:any)=>row.question?.is_active&&isVerifiedExamSource(row.question?.source));
  const assigned=Array.isArray(metadata.questionIds)?metadata.questionIds.map((id:any)=>String(id)):[];
  const byQuestion=new Map(verified.map((row:any)=>[String(row.question_id),row]));
  const questionRows=(assigned.length?assigned.map((id:string)=>byQuestion.get(id)).filter(Boolean):verified) as any[];
  if(!questionRows.length)return json({error:{message:'No gradable questions remain for this attempt'}},409,origin);

  const{data:persisted,error:persistedError}=await admin.from('exam_answers')
    .select('id,question_id,student_answer,time_spent_seconds')
    .eq('attempt_id',attemptId);
  if(persistedError)throw persistedError;
  const submittedById=new Map((persisted||[]).map((row:any)=>[String(row.question_id),row]));

  let score=0,totalMarks=0,correctCount=0,incorrectCount=0;
  const gradedRows:any[]=[]; const review:any[]=[];
  for(const row of questionRows){
    const marks=Number(row.marks||1); totalMarks+=marks; const q=row.question;
    const saved:any=submittedById.get(String(row.question_id));
    if(!saved)continue;
    const isCorrect=answersEqual(q.correct_answer,saved.student_answer,String(q.question_type||'mcq'));
    const marksObtained=isCorrect?marks:0;
    score+=marksObtained;
    if(isCorrect)correctCount++;else incorrectCount++;
    gradedRows.push({
      attempt_id:attemptId,
      question_id:row.question_id,
      student_answer:saved.student_answer,
      is_correct:isCorrect,
      marks_obtained:marksObtained,
      time_spent_seconds:saved.time_spent_seconds||null,
      answered_at:new Date().toISOString(),
    });
    if(exam.show_results_immediately&&exam.allow_review)review.push({
      questionId:row.question_id,
      questionText:q.question_text,
      studentAnswer:saved.student_answer,
      isCorrect,
      correctAnswer:q.correct_answer,
      explanation:q.explanation||null,
    });
  }
  if(gradedRows.length){
    const graded=await admin.from('exam_answers').upsert(gradedRows,{onConflict:'attempt_id,question_id'});
    if(graded.error)throw graded.error;
  }

  const percentage=totalMarks>0?Math.round((score/totalMarks)*10000)/100:0;
  const passMarks=Number(exam.passing_marks||0); const isPassed=score>=passMarks;
  const serverElapsed=Math.max(0,Math.round((Date.now()-new Date(attempt.started_at).getTime())/1000));
  const timeSpentSeconds=exam.is_timed?Math.min(durationSeconds,serverElapsed):serverElapsed;
  const finalMetadata={...metadata,timedOut};
  const{data:finalAttempt,error:updateError}=await admin.from('exam_attempts').update({
    status:'submitted',
    submitted_at:new Date().toISOString(),
    time_spent_seconds:timeSpentSeconds,
    score,
    percentage,
    is_passed:isPassed,
    metadata:finalMetadata,
  }).eq('id',attemptId).eq('student_id',user.id).select('*').single();
  if(updateError)throw updateError;
  return json({data:{attempt:finalAttempt,result:{
    score,totalMarks,percentage,isPassed,correctCount,incorrectCount,
    unansweredCount:Math.max(0,questionRows.length-gradedRows.length),
    showResults:Boolean(exam.show_results_immediately),
    timedOut,
    answers:review,
  }}},200,origin);
}

const latestExamResultMatch=path.match(/^\/exams\/([0-9a-f-]+)\/attempts\/latest\/result$/i);
const examResultMatch=path.match(/^\/exams\/([0-9a-f-]+)\/attempts\/([0-9a-f-]+)\/result$/i);
if(request.method==='GET'&&(latestExamResultMatch||examResultMatch)){
  const user=await requireUser();
  const examId=latestExamResultMatch?latestExamResultMatch[1]:examResultMatch![1];
  const attemptId=examResultMatch?examResultMatch[2]:null;
  let attemptQuery=admin.from('exam_attempts').select('*').eq('exam_id',examId).eq('student_id',user.id).eq('status','submitted').order('submitted_at',{ascending:false}).limit(1);
  if(attemptId)attemptQuery=admin.from('exam_attempts').select('*').eq('id',attemptId).eq('exam_id',examId).eq('student_id',user.id).eq('status','submitted').limit(1);
  const{data:attemptRows,error:attemptError}=await attemptQuery;
  if(attemptError)throw attemptError;
  const attempt=(attemptRows||[])[0];
  if(!attempt)return json({error:{message:'No completed result found for this exam'}},404,origin);

  const{data:exam,error:examError}=await admin.from('exams')
    .select('id,title,show_results_immediately,allow_review')
    .eq('id',examId).maybeSingle();
  if(examError||!exam)return json({error:{message:'Exam not found'}},404,origin);

  const{data:answers,error:answersError}=await admin.from('exam_answers')
    .select('question_id,student_answer,is_correct,marks_obtained,time_spent_seconds,question:questions(question_text,correct_answer,explanation)')
    .eq('attempt_id',attempt.id).order('answered_at',{ascending:true});
  if(answersError)throw answersError;
  const answerRows=answers||[];
  const correctCount=answerRows.filter((row:any)=>row.is_correct===true).length;
  const incorrectCount=answerRows.filter((row:any)=>row.is_correct===false).length;
  const metadata=(attempt.metadata&&typeof attempt.metadata==='object')?attempt.metadata:{};
  const assignedCount=Array.isArray(metadata.questionIds)?metadata.questionIds.length:answerRows.length;
  const canReview=Boolean(exam.show_results_immediately&&exam.allow_review);
  const review=canReview?answerRows.map((row:any)=>({
    questionId:String(row.question_id),
    questionText:row.question?.question_text||'Question',
    studentAnswer:row.student_answer,
    isCorrect:Boolean(row.is_correct),
    correctAnswer:row.question?.correct_answer,
    explanation:row.question?.explanation||null,
  })):[];
  return json({data:{result:{
    examTitle:exam.title,
    attemptId:attempt.id,
    score:Number(attempt.score||0),
    percentage:Number(attempt.percentage||0),
    isPassed:Boolean(attempt.is_passed),
    correctCount,
    incorrectCount,
    unansweredCount:Math.max(0,assignedCount-answerRows.length),
    showResults:Boolean(exam.show_results_immediately),
    timedOut:Boolean(metadata.timedOut),
    timeSpentSeconds:Number(attempt.time_spent_seconds||0),
    answers:review,
  }}},200,origin);
}

if(request.method==='GET'&&path==='/progress/lessons'){const user=await requireUser();const limit=asInt(url.searchParams.get('limit'),20,1,100);const{data,error}=await admin.from('lesson_progress').select('id,lesson_id,course_id,status,progress_percentage,completed_at,updated_at,lesson:lessons(id,title,slug)').eq('student_id',user.id).order('updated_at',{ascending:false}).limit(limit);if(error)throw error;return json({data:data||[]},200,origin)}
const completeCourseLesson=path.match(/^\/progress\/courses\/([0-9a-f-]+)\/lessons\/([0-9a-f-]+)\/complete$/i);const completeLesson=path.match(/^\/lessons\/([0-9a-f-]+)\/complete$/i);if(request.method==='POST'&&(completeCourseLesson||completeLesson)){const user=await requireUser();const lessonId=completeCourseLesson?completeCourseLesson[2]:completeLesson![1];let courseId=completeCourseLesson?completeCourseLesson[1]:null;if(!courseId){const{data:lesson,error}=await admin.from('lessons').select('id,course_id,is_published').eq('id',lessonId).eq('is_published',true).maybeSingle();if(error||!lesson?.course_id)return json({error:{message:'Lesson not found'}},404,origin);courseId=lesson.course_id}const{data:enrollment,error:enrollmentError}=await admin.from('student_courses').select('id').eq('student_id',user.id).eq('course_id',courseId).maybeSingle();if(enrollmentError||!enrollment)return json({error:{message:'You are not enrolled in this course'}},403,origin);const now=new Date().toISOString();const{data:progress,error:progressError}=await admin.from('lesson_progress').upsert({student_id:user.id,lesson_id:lessonId,course_id:courseId,status:'completed',progress_percentage:100,completed_at:now,updated_at:now},{onConflict:'student_id,lesson_id'}).select().single();if(progressError)throw progressError;const[{count:totalLessons},{count:completedLessons}]=await Promise.all([admin.from('lessons').select('id',{count:'exact',head:true}).eq('course_id',courseId).eq('is_published',true),admin.from('lesson_progress').select('id',{count:'exact',head:true}).eq('student_id',user.id).eq('course_id',courseId).eq('status','completed')]);const total=totalLessons||0,completed=completedLessons||0,percentage=total>0?Math.min(100,Math.round(completed/total*100)):0;const update:Record<string,unknown>={progress_percentage:percentage,last_accessed_at:now};if(percentage>=100){update.completed_at=now;update.certificate_issued_at=now;}await admin.from('student_courses').update(update).eq('id',enrollment.id).eq('student_id',user.id);return json({data:{progress,courseProgress:{courseId,completedLessons:completed,totalLessons:total,progressPercentage:percentage,courseCompleted:percentage>=100}}},200,origin)}
if(request.method==='GET'&&path==='/parents/children'){const user=await requireUser();const{data:parent,error:parentError}=await admin.from('parents').select('id').eq('user_id',user.id).maybeSingle();if(parentError)throw parentError;if(!parent)return json({data:{children:[]}},200,origin);const{data:links,error}=await admin.from('parent_children').select('id,child_user_id,relationship,preferred_contact_method,notifications_enabled,created_at').eq('parent_id',parent.id).order('created_at',{ascending:true});if(error)throw error;const ids=(links||[]).map((link:any)=>link.child_user_id).filter(Boolean);let users:any[]=[];if(ids.length){const result=await admin.from('users').select('id,first_name,last_name,avatar_url').in('id',ids);if(result.error)throw result.error;users=result.data||[]}const byId=new Map(users.map((child:any)=>[child.id,child]));const children=(links||[]).map((link:any)=>{const child:any=byId.get(link.child_user_id)||{};return{id:link.id,userId:link.child_user_id,firstName:child.first_name||'',lastName:child.last_name||'',avatar:child.avatar_url||null,relationship:link.relationship,preferredContactMethod:link.preferred_contact_method,notificationsEnabled:link.notifications_enabled,joinedAt:link.created_at}});return json({data:{children}},200,origin)}
if(request.method==='POST'&&path==='/parents/children'){const user=await requireRoleUser('parent');const body=await request.json().catch(()=>null);const childId=String(body?.userId||'').trim();if(!/^[0-9a-f-]{36}$/i.test(childId)||childId===user.id)return json({error:{message:'Valid child user ID is required'}},400,origin);let{data:parent,error:parentError}=await admin.from('parents').select('id').eq('user_id',user.id).maybeSingle();if(parentError)throw parentError;if(!parent){const created=await admin.from('parents').insert({user_id:user.id}).select('id').single();if(created.error)throw created.error;parent=created.data}const{data:roleLinks,error:linkError}=await admin.from('user_roles').select('role_id').eq('user_id',childId);if(linkError)throw linkError;const roleIds=(roleLinks||[]).map((row:any)=>row.role_id).filter(Boolean);let student=false;if(roleIds.length){const{data:defs,error:defsError}=await admin.from('roles').select('name').in('id',roleIds);if(defsError)throw defsError;student=(defs||[]).some((row:any)=>row.name==='student')}if(!student)return json({error:{message:'The linked account must be a student account'}},400,origin);const{data:child,error:childError}=await admin.from('users').select('id,email,first_name,last_name,avatar_url').eq('id',childId).eq('is_active',true).maybeSingle();if(childError)throw childError;if(!child)return json({error:{message:'Student account not found'}},404,origin);const{data:link,error}=await admin.from('parent_children').upsert({parent_id:parent.id,child_user_id:childId,relationship:String(body?.relationship||'child').trim().slice(0,50)||'child'},{onConflict:'parent_id,child_user_id'}).select().single();if(error)throw error;return json({data:{link,child:{id:link.id,userId:child.id,firstName:child.first_name||'',lastName:child.last_name||'',email:child.email||'',avatar:child.avatar_url||null,relationship:link.relationship,joinedAt:link.created_at}}},200,origin)}
const removeChildRoute=path.match(/^\/parents\/children\/([0-9a-f-]+)$/i);if(request.method==='DELETE'&&removeChildRoute){const user=await requireRoleUser('parent');const childId=removeChildRoute[1];const{data:parent,error:parentError}=await admin.from('parents').select('id').eq('user_id',user.id).maybeSingle();if(parentError)throw parentError;if(!parent)return json({error:{message:'Parent profile not found'}},404,origin);const{error,count}=await admin.from('parent_children').delete({count:'exact'}).eq('parent_id',parent.id).eq('child_user_id',childId);if(error)throw error;if(!count)return json({error:{message:'Child link not found'}},404,origin);return json({success:true,message:'Child link removed'},200,origin)}
const parentRoute=path.match(/^\/parents\/children\/([0-9a-f-]+)\/(performance|progress|study-time)$/i);if(request.method==='GET'&&parentRoute){const user=await requireUser();const childId=parentRoute[1],section=parentRoute[2];const{data:parent}=await admin.from('parents').select('id').eq('user_id',user.id).maybeSingle();if(!parent)return json({error:{message:'Parent profile not found'}},404,origin);const{data:link}=await admin.from('parent_children').select('id').eq('parent_id',parent.id).eq('child_user_id',childId).maybeSingle();if(!link)return json({error:{message:'Child is not linked to this parent account'}},404,origin);if(section==='study-time'){const startDate=url.searchParams.get('startDate'),endDate=url.searchParams.get('endDate');let query=admin.from('study_sessions').select('started_at,duration_seconds,course_id').eq('student_id',childId).not('ended_at','is',null).order('started_at',{ascending:true});if(startDate)query=query.gte('started_at',`${startDate}T00:00:00Z`);if(endDate)query=query.lt('started_at',new Date(new Date(`${endDate}T00:00:00Z`).getTime()+86400000).toISOString());const{data,error}=await query;if(error)throw error;const days=new Map<string,{date:string;studyTimeSeconds:number;coursesStudied:string[]}>();for(const row of data||[]){const date=String(row.started_at).slice(0,10),item=days.get(date)||{date,studyTimeSeconds:0,coursesStudied:[]};item.studyTimeSeconds+=Number(row.duration_seconds||0);if(row.course_id&&!item.coursesStudied.includes(row.course_id))item.coursesStudied.push(row.course_id);days.set(date,item)}return json({data:{studyTime:[...days.values()]}},200,origin)}const[study,courses,lessons,exams,points,childUser]=await Promise.all([admin.from('study_sessions').select('duration_seconds,started_at').eq('student_id',childId).not('ended_at','is',null),admin.from('student_courses').select('course_id,completed_at,progress_percentage,last_accessed_at').eq('student_id',childId),admin.from('lesson_progress').select('lesson_id,updated_at').eq('student_id',childId).eq('status','completed'),admin.from('exam_attempts').select('exam_id,percentage,submitted_at').eq('student_id',childId).eq('status','submitted'),admin.from('student_points').select('current_streak').eq('user_id',childId).maybeSingle(),admin.from('users').select('id,first_name,last_name').eq('id',childId).maybeSingle()]);for(const result of[study,courses,lessons,exams,points,childUser])if(result.error)throw result.error;const studyRows=study.data||[],courseRows=courses.data||[],lessonRows=lessons.data||[],examRows=exams.data||[],studyTimeSeconds=studyRows.reduce((sum:number,row:any)=>sum+Number(row.duration_seconds||0),0),examScores=examRows.map((row:any)=>Number(row.percentage||0)),averageExamScore=examScores.length?examScores.reduce((a:number,b:number)=>a+b,0)/examScores.length:0,lastActivityCandidates=[...studyRows.map((row:any)=>row.started_at),...courseRows.map((row:any)=>row.last_accessed_at),...lessonRows.map((row:any)=>row.updated_at),...examRows.map((row:any)=>row.submitted_at)].filter(Boolean).sort();const performance={userId:childId,coursesEnrolled:courseRows.length,coursesCompleted:courseRows.filter((row:any)=>row.completed_at).length,lessonsCompleted:lessonRows.length,examsTaken:new Set(examRows.map((row:any)=>row.exam_id)).size,averageExamScore,studyTimeSeconds,currentStreak:Number(points.data?.current_streak||0),lastActiveAt:lastActivityCandidates.at(-1)||null};if(section==='performance')return json({data:{performance}},200,origin);const recentActivity=[...lessonRows.map((row:any)=>({type:'lesson',title:'Lesson completed',timestamp:row.updated_at})),...examRows.map((row:any)=>({type:'exam',title:`Exam score ${Math.round(Number(row.percentage||0))}%`,timestamp:row.submitted_at}))].filter((row:any)=>row.timestamp).sort((a:any,b:any)=>String(b.timestamp).localeCompare(String(a.timestamp))).slice(0,10);return json({data:{progress:{enrolledCourses:courseRows.length,completedLessons:lessonRows.length,totalStudyTimeSeconds:studyTimeSeconds,averageCourseProgress:courseRows.length?Math.round(courseRows.reduce((sum:number,row:any)=>sum+Number(row.progress_percentage||0),0)/courseRows.length):0,examsTaken:performance.examsTaken,averageExamScore,quizzesTaken:performance.examsTaken,subjectPerformance:[],recentActivity,childName:[childUser.data?.first_name,childUser.data?.last_name].filter(Boolean).join(' ')||'Student'}}},200,origin)}

const requireRoleUser=async(role:string)=>{const user=await requireUser();const{data:links,error:linksError}=await admin.from('user_roles').select('role_id').eq('user_id',user.id);if(linksError)throw linksError;const roleIds=(links||[]).map((row:any)=>row.role_id).filter(Boolean);let names:string[]=[];if(roleIds.length){const{data:defs,error:defsError}=await admin.from('roles').select('name').in('id',roleIds);if(defsError)throw defsError;names=(defs||[]).map((row:any)=>String(row.name))}const metadataRole=String(user.user_metadata?.role||'');if(!names.includes(role)&&metadataRole!==role){const error:any=new Error(role+' access required');error.status=403;throw error}return user};
if(request.method==='POST'&&path==='/auth/reset-password'){const body=await request.json().catch(()=>null);const token=String(body?.token||'');const password=String(body?.password||'');if(!token||token.length>256)return json({error:{message:'Invalid reset token'}},400,origin);if(password.length<8||password.length>128||!/[a-z]/.test(password)||!/[A-Z]/.test(password)||!/\d/.test(password))return json({error:{message:'Password must be 8–128 characters and include uppercase, lowercase, and a number.'}},400,origin);const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));const tokenHash=[...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join('');const{data:userId,error:consumeError}=await admin.rpc('consume_password_reset',{p_token_hash:tokenHash});if(consumeError)throw consumeError;if(!userId)return json({error:{message:'Invalid or expired reset token'}},400,origin);const{error:updateError}=await admin.auth.admin.updateUserById(String(userId),{password});if(updateError)throw updateError;await admin.from('sessions').delete().eq('user_id',String(userId));return json({success:true,message:'Password reset successful'},200,origin)}
if(request.method==='GET'&&path==='/parents/me'){const user=await requireRoleUser('parent');let{data:parent,error:parentError}=await admin.from('parents').select('*').eq('user_id',user.id).maybeSingle();if(parentError)throw parentError;if(!parent){const created=await admin.from('parents').insert({user_id:user.id}).select().single();if(created.error)throw created.error;parent=created.data}const{data:account,error:accountError}=await admin.from('users').select('id,email,first_name,last_name,phone,avatar_url,created_at,updated_at').eq('id',user.id).maybeSingle();if(accountError)throw accountError;return json({data:{parent:{id:parent.id,userId:user.id,firstName:account?.first_name||user.user_metadata?.first_name||'',lastName:account?.last_name||user.user_metadata?.last_name||'',email:account?.email||user.email||'',phone:parent.phone||account?.phone||null,avatar:account?.avatar_url||null,occupation:parent.occupation||null,address:parent.address||null,createdAt:parent.created_at||account?.created_at,updatedAt:parent.updated_at||account?.updated_at}}},200,origin)}
if(request.method==='PATCH'&&path==='/parents/me'){const user=await requireRoleUser('parent');const body=await request.json().catch(()=>null);if(!body||typeof body!=='object'||Array.isArray(body))return json({error:{message:'Invalid profile update'}},400,origin);let{data:parent,error:parentError}=await admin.from('parents').select('*').eq('user_id',user.id).maybeSingle();if(parentError)throw parentError;if(!parent){const created=await admin.from('parents').insert({user_id:user.id}).select().single();if(created.error)throw created.error;parent=created.data}const accountUpdate:Record<string,unknown>={};if(body.firstName!==undefined)accountUpdate.first_name=String(body.firstName||'').trim().slice(0,100);if(body.lastName!==undefined)accountUpdate.last_name=String(body.lastName||'').trim().slice(0,100);if(body.phone!==undefined)accountUpdate.phone=String(body.phone||'').trim().slice(0,40)||null;if(body.avatarUrl!==undefined)accountUpdate.avatar_url=String(body.avatarUrl||'').trim().slice(0,1000)||null;if(Object.keys(accountUpdate).length){accountUpdate.updated_at=new Date().toISOString();const result=await admin.from('users').update(accountUpdate).eq('id',user.id);if(result.error)throw result.error}const parentUpdate:Record<string,unknown>={};if(body.phone!==undefined)parentUpdate.phone=String(body.phone||'').trim().slice(0,40)||null;if(body.occupation!==undefined)parentUpdate.occupation=String(body.occupation||'').trim().slice(0,200)||null;if(body.address!==undefined)parentUpdate.address=String(body.address||'').trim().slice(0,1000)||null;if(Object.keys(parentUpdate).length){parentUpdate.updated_at=new Date().toISOString();const result=await admin.from('parents').update(parentUpdate).eq('id',parent.id).select().single();if(result.error)throw result.error;parent=result.data}const{data:account,error:accountError}=await admin.from('users').select('id,email,first_name,last_name,phone,avatar_url,created_at,updated_at').eq('id',user.id).maybeSingle();if(accountError)throw accountError;return json({data:{parent:{id:parent.id,userId:user.id,firstName:account?.first_name||'',lastName:account?.last_name||'',email:account?.email||user.email||'',phone:parent.phone||account?.phone||null,avatar:account?.avatar_url||null,occupation:parent.occupation||null,address:parent.address||null,createdAt:parent.created_at||account?.created_at,updatedAt:parent.updated_at||account?.updated_at}}},200,origin)}

const parentDetailRoute=path.match(/^\/parents\/children\/([0-9a-f-]+)\/(courses|exams)$/i);if(request.method==='GET'&&parentDetailRoute){const user=await requireRoleUser('parent');const childId=parentDetailRoute[1],section=parentDetailRoute[2];const{data:parent,error:parentError}=await admin.from('parents').select('id').eq('user_id',user.id).maybeSingle();if(parentError)throw parentError;if(!parent)return json({error:{message:'Parent profile not found'}},404,origin);const{data:link,error:linkError}=await admin.from('parent_children').select('id').eq('parent_id',parent.id).eq('child_user_id',childId).maybeSingle();if(linkError)throw linkError;if(!link)return json({error:{message:'Child is not linked to this parent account'}},404,origin);const page=asInt(url.searchParams.get('page'),1,1,100000),limit=asInt(url.searchParams.get('limit'),20,1,100),from=(page-1)*limit,to=from+limit-1;if(section==='courses'){const{data,error,count}=await admin.from('student_courses').select('*,course:courses(id,title,slug,thumbnail_url,subject_id,class_id,teacher_id)',{count:'exact'}).eq('student_id',childId).order('last_accessed_at',{ascending:false}).range(from,to);if(error)throw error;const courses=(data||[]).map((row:any)=>({...row,title:row.course?.title||'Course',slug:row.course?.slug||null,thumbnail_url:row.course?.thumbnail_url||null,subject_id:row.course?.subject_id||null,class_id:row.course?.class_id||null,teacher_id:row.course?.teacher_id||null}));const total=count||0;return json({data:{courses},pagination:{page,limit,total,totalPages:Math.ceil(total/limit)}},200,origin)}const{data,error,count}=await admin.from('exam_attempts').select('*,exam:exams(id,title,slug,exam_type,subject_id,class_id,duration_minutes,total_marks,passing_marks)',{count:'exact'}).eq('student_id',childId).order('started_at',{ascending:false}).range(from,to);if(error)throw error;const exams=(data||[]).map((row:any)=>({...row,title:row.exam?.title||'Exam',slug:row.exam?.slug||null,exam_type:row.exam?.exam_type||null}));const total=count||0;return json({data:{exams},pagination:{page,limit,total,totalPages:Math.ceil(total/limit)}},200,origin)}
if(request.method==='POST'&&path==='/parents/reports'){const user=await requireRoleUser('parent');const body=await request.json().catch(()=>null);const childId=String(body?.childId||''),reportType=String(body?.reportType||'progress');if(!/^[0-9a-f-]{36}$/i.test(childId)||!['weekly','monthly','exam','progress'].includes(reportType))return json({error:{message:'Invalid report request'}},400,origin);const{data:parent}=await admin.from('parents').select('id').eq('user_id',user.id).maybeSingle();if(!parent)return json({error:{message:'Parent profile not found'}},404,origin);const{data:link}=await admin.from('parent_children').select('id').eq('parent_id',parent.id).eq('child_user_id',childId).maybeSingle();if(!link)return json({error:{message:'Child is not linked to this parent account'}},404,origin);const{data:child}=await admin.from('users').select('first_name,last_name').eq('id',childId).maybeSingle();const childName=[child?.first_name,child?.last_name].filter(Boolean).join(' ')||'Student';const{data:report,error}=await admin.from('reports').insert({type:reportType,title:reportType.charAt(0).toUpperCase()+reportType.slice(1)+' report for '+childName,description:'Academic progress report for '+childName,filters:{childId,childName,reportType},generated_by:user.id,status:'completed',completed_at:new Date().toISOString()}).select().single();if(error)throw error;return json({data:{report:{id:report.id,childId,childName,type:reportType,data:report.filters||{},generatedAt:report.created_at,status:report.status,fileUrl:report.file_url||null}}},201,origin)}
if(request.method==='GET'&&path==='/parents/reports'){const user=await requireRoleUser('parent');const page=asInt(url.searchParams.get('page'),1,1,100000),limit=asInt(url.searchParams.get('limit'),20,1,100),from=(page-1)*limit,to=from+limit-1;const{data,error,count}=await admin.from('reports').select('*',{count:'exact'}).eq('generated_by',user.id).order('created_at',{ascending:false}).range(from,to);if(error)throw error;const reports=(data||[]).map((row:any)=>({id:row.id,childId:row.filters?.childId||null,childName:row.filters?.childName||null,type:row.type,data:row.filters||{},generatedAt:row.created_at,status:row.status,fileUrl:row.file_url||null}));const total=count||0;return json({data:{reports},pagination:{page,limit,total,totalPages:Math.ceil(total/limit)}},200,origin)}
if(request.method==='GET'&&path==='/parents/notifications'){const user=await requireRoleUser('parent');const page=asInt(url.searchParams.get('page'),1,1,100000),limit=asInt(url.searchParams.get('limit'),20,1,100),from=(page-1)*limit,to=from+limit-1;const{data,error,count}=await admin.from('notifications').select('*',{count:'exact'}).eq('user_id',user.id).order('created_at',{ascending:false}).range(from,to);if(error)throw error;const notifications=(data||[]).map((row:any)=>({id:row.id,type:row.type,title:row.title,message:row.body||'',data:row.data||{},isRead:Boolean(row.read_at),actionUrl:row.action_url||null,channel:row.channel||null,sentAt:row.sent_at||null,createdAt:row.created_at}));const total=count||0;return json({data:{notifications},pagination:{page,limit,total,totalPages:Math.ceil(total/limit)}},200,origin)}
const parentNotifRead=path.match(/^\/parents\/notifications\/([0-9a-f-]+)\/read$/i);if(request.method==='POST'&&parentNotifRead){const user=await requireRoleUser('parent');const{data,error}=await admin.from('notifications').update({read_at:new Date().toISOString()}).eq('id',parentNotifRead[1]).eq('user_id',user.id).select().maybeSingle();if(error)throw error;if(!data)return json({error:{message:'Notification not found'}},404,origin);return json({data:{notification:{id:data.id,type:data.type,title:data.title,message:data.body||'',data:data.data||{},isRead:true,actionUrl:data.action_url||null,channel:data.channel||null,sentAt:data.sent_at||null,createdAt:data.created_at}}},200,origin)}
if(request.method==='GET'&&path==='/teachers/me'){const user=await requireRoleUser('teacher');const[{data:account,error:accountError},{data:teacher,error:teacherError}]=await Promise.all([admin.from('users').select('id,email,first_name,last_name,phone,avatar_url,created_at,updated_at').eq('id',user.id).maybeSingle(),admin.from('teachers').select('*').eq('user_id',user.id).maybeSingle()]);if(accountError)throw accountError;if(teacherError)throw teacherError;return json({data:{teacher:{id:teacher?.id||user.id,userId:user.id,firstName:account?.first_name||user.user_metadata?.first_name||'',lastName:account?.last_name||user.user_metadata?.last_name||'',email:account?.email||user.email||'',phone:account?.phone||null,avatar:teacher?.avatar_url||account?.avatar_url||null,bio:teacher?.bio||null,qualification:teacher?.qualification||null,specialization:teacher?.specialization||null,verified:Boolean(teacher?.is_verified),rating:Number(teacher?.rating||0),reviewCount:Number(teacher?.review_count||0),totalEarnings:Number(teacher?.total_earnings||0),createdAt:teacher?.created_at||account?.created_at,updatedAt:teacher?.updated_at||account?.updated_at}}},200,origin)}
if(request.method==='PATCH'&&path==='/teachers/me'){const user=await requireRoleUser('teacher');const body=await request.json().catch(()=>null);if(!body||typeof body!=='object'||Array.isArray(body))return json({error:{message:'Invalid profile update'}},400,origin);const accountUpdate:Record<string,unknown>={};if(body.firstName!==undefined)accountUpdate.first_name=String(body.firstName||'').trim().slice(0,100);if(body.lastName!==undefined)accountUpdate.last_name=String(body.lastName||'').trim().slice(0,100);if(body.phone!==undefined)accountUpdate.phone=String(body.phone||'').trim().slice(0,40)||null;if(body.avatar!==undefined)accountUpdate.avatar_url=String(body.avatar||'').trim().slice(0,1000)||null;if(Object.keys(accountUpdate).length){accountUpdate.updated_at=new Date().toISOString();const result=await admin.from('users').update(accountUpdate).eq('id',user.id);if(result.error)throw result.error}let{data:teacher,error:teacherError}=await admin.from('teachers').select('*').eq('user_id',user.id).maybeSingle();if(teacherError)throw teacherError;const teacherUpdate:Record<string,unknown>={};if(body.bio!==undefined)teacherUpdate.bio=String(body.bio||'').trim().slice(0,4000)||null;if(body.avatar!==undefined)teacherUpdate.avatar_url=String(body.avatar||'').trim().slice(0,1000)||null;if(!teacher){const created=await admin.from('teachers').insert({user_id:user.id,...teacherUpdate}).select().single();if(created.error)throw created.error;teacher=created.data}else if(Object.keys(teacherUpdate).length){teacherUpdate.updated_at=new Date().toISOString();const updated=await admin.from('teachers').update(teacherUpdate).eq('id',teacher.id).select().single();if(updated.error)throw updated.error;teacher=updated.data}const{data:account,error:accountError}=await admin.from('users').select('id,email,first_name,last_name,phone,avatar_url,created_at,updated_at').eq('id',user.id).maybeSingle();if(accountError)throw accountError;return json({data:{teacher:{id:teacher?.id||user.id,userId:user.id,firstName:account?.first_name||'',lastName:account?.last_name||'',email:account?.email||user.email||'',phone:account?.phone||null,avatar:teacher?.avatar_url||account?.avatar_url||null,bio:teacher?.bio||null,qualification:teacher?.qualification||null,specialization:teacher?.specialization||null,verified:Boolean(teacher?.is_verified),rating:Number(teacher?.rating||0),reviewCount:Number(teacher?.review_count||0),totalEarnings:Number(teacher?.total_earnings||0),createdAt:teacher?.created_at||account?.created_at,updatedAt:teacher?.updated_at||account?.updated_at}}},200,origin)}
if(request.method==='GET'&&path==='/teachers/courses'){const user=await requireRoleUser('teacher');const page=asInt(url.searchParams.get('page'),1,1,100000),limit=asInt(url.searchParams.get('limit'),20,1,100),from=(page-1)*limit,to=from+limit-1;const{data,error,count}=await admin.from('courses').select('*',{count:'exact'}).eq('teacher_id',user.id).order('created_at',{ascending:false}).range(from,to);if(error)throw error;const ids=(data||[]).map((row:any)=>row.id);let enrollments:any[]=[];if(ids.length){const result=await admin.from('student_courses').select('course_id,student_id,progress_percentage,completed_at').in('course_id',ids);if(result.error)throw result.error;enrollments=result.data||[]}const courses=(data||[]).map((course:any)=>{const rows=enrollments.filter((row:any)=>row.course_id===course.id);const studentIds=new Set(rows.map((row:any)=>row.student_id));const avg=rows.length?rows.reduce((sum:number,row:any)=>sum+Number(row.progress_percentage||0),0)/rows.length:0;return{...course,studentCount:studentIds.size,averageProgress:Number(avg.toFixed(2)),enrollmentCount:studentIds.size}});const total=count||0;return json({data:{courses},pagination:{page,limit,total,totalPages:Math.ceil(total/limit)}},200,origin)}
const teacherCourseStats=path.match(/^\/teachers\/courses\/([0-9a-f-]+)\/stats$/i);if(request.method==='GET'&&teacherCourseStats){const user=await requireRoleUser('teacher');const courseId=teacherCourseStats[1];const{data:course}=await admin.from('courses').select('id').eq('id',courseId).eq('teacher_id',user.id).maybeSingle();if(!course)return json({error:{message:'Course not found'}},404,origin);const{data:rows,error}=await admin.from('student_courses').select('student_id,progress_percentage,completed_at').eq('course_id',courseId);if(error)throw error;const list=rows||[],students=new Set(list.map((row:any)=>row.student_id)),completed=list.filter((row:any)=>row.completed_at).length,avg=list.length?list.reduce((sum:number,row:any)=>sum+Number(row.progress_percentage||0),0)/list.length:0;return json({data:{stats:{courseId,enrollmentCount:students.size,completedCount:completed,completionRate:students.size?Number((completed/students.size*100).toFixed(2)):0,avgProgress:Number(avg.toFixed(2))}}},200,origin)}
if(request.method==='GET'&&path==='/teachers/students'){const user=await requireRoleUser('teacher');const page=asInt(url.searchParams.get('page'),1,1,100000),limit=asInt(url.searchParams.get('limit'),20,1,100);const{data:courseRows,error:courseError}=await admin.from('courses').select('id').eq('teacher_id',user.id);if(courseError)throw courseError;const courseIds=(courseRows||[]).map((row:any)=>row.id);if(!courseIds.length)return json({data:{students:[]},pagination:{page,limit,total:0,totalPages:0}},200,origin);const{data:enrollments,error}=await admin.from('student_courses').select('student_id,progress_percentage,enrolled_at,last_accessed_at').in('course_id',courseIds);if(error)throw error;const byStudent=new Map<string,any>();for(const row of enrollments||[]){const current=byStudent.get(row.student_id)||{studentId:row.student_id,progressPercentage:0,enrolledAt:row.enrolled_at,lastActiveAt:row.last_accessed_at};current.progressPercentage=Math.max(Number(current.progressPercentage||0),Number(row.progress_percentage||0));if(String(row.last_accessed_at||'')>String(current.lastActiveAt||''))current.lastActiveAt=row.last_accessed_at;if(String(row.enrolled_at||'')<String(current.enrolledAt||''))current.enrolledAt=row.enrolled_at;byStudent.set(row.student_id,current)}const ids=[...byStudent.keys()];let accounts:any[]=[];if(ids.length){const result=await admin.from('users').select('id,first_name,last_name,email,avatar_url').in('id',ids);if(result.error)throw result.error;accounts=result.data||[]}const accountMap=new Map(accounts.map((row:any)=>[row.id,row]));const all=[...byStudent.values()].map((row:any)=>{const account:any=accountMap.get(row.studentId)||{};return{id:row.studentId,userId:row.studentId,firstName:account.first_name||'',lastName:account.last_name||'',email:account.email||'',avatar:account.avatar_url||null,enrolledAt:row.enrolledAt,progressPercentage:row.progressPercentage,lastActiveAt:row.lastActiveAt}}).sort((a:any,b:any)=>String(b.lastActiveAt||'').localeCompare(String(a.lastActiveAt||'')));const total=all.length,from=(page-1)*limit;return json({data:{students:all.slice(from,from+limit)},pagination:{page,limit,total,totalPages:Math.ceil(total/limit)}},200,origin)}
if(request.method==='GET'&&path==='/teachers/earnings/summary'){const user=await requireRoleUser('teacher');const{data,error}=await admin.from('teacher_earnings').select('amount,status,created_at').eq('teacher_id',user.id);if(error)throw error;const rows=data||[],monthStart=new Date();monthStart.setUTCDate(1);monthStart.setUTCHours(0,0,0,0);const sum=(predicate:(row:any)=>boolean)=>rows.filter(predicate).reduce((total:number,row:any)=>total+Number(row.amount||0),0);const summary={total:sum((row:any)=>row.status!=='failed'),pending:sum((row:any)=>row.status==='pending'),paid:sum((row:any)=>row.status==='paid'),failed:sum((row:any)=>row.status==='failed'),thisMonth:sum((row:any)=>row.status!=='failed'&&new Date(row.created_at)>=monthStart),totalEarnings:sum((row:any)=>row.status!=='failed'),pendingEarnings:sum((row:any)=>row.status==='pending'),last30Days:sum((row:any)=>row.status!=='failed'&&new Date(row.created_at).getTime()>=Date.now()-30*86400000)};return json({data:{summary}},200,origin)}
if(request.method==='GET'&&path==='/teachers/analytics'){const user=await requireRoleUser('teacher');const{data:courses,error:courseError}=await admin.from('courses').select('id,rating').eq('teacher_id',user.id);if(courseError)throw courseError;const courseIds=(courses||[]).map((row:any)=>row.id);let enrollments:any[]=[],lessonCount=0;if(courseIds.length){const[e,l]=await Promise.all([admin.from('student_courses').select('student_id,progress_percentage').in('course_id',courseIds),admin.from('lessons').select('id',{count:'exact',head:true}).in('course_id',courseIds)]);if(e.error)throw e.error;if(l.error)throw l.error;enrollments=e.data||[];lessonCount=l.count||0}const[examResult,earningResult]=await Promise.all([admin.from('exams').select('id',{count:'exact',head:true}).eq('created_by',user.id),admin.from('teacher_earnings').select('amount,status').eq('teacher_id',user.id)]);if(examResult.error)throw examResult.error;if(earningResult.error)throw earningResult.error;const students=new Set(enrollments.map((row:any)=>row.student_id)),avgProgress=enrollments.length?enrollments.reduce((sum:number,row:any)=>sum+Number(row.progress_percentage||0),0)/enrollments.length:0,ratings=(courses||[]).map((row:any)=>Number(row.rating||0)).filter((value:number)=>value>0),avgRating=ratings.length?ratings.reduce((a:number,b:number)=>a+b,0)/ratings.length:0,earnings=earningResult.data||[];const analytics={totalStudents:students.size,totalCourses:courseIds.length,totalLessons:lessonCount,totalExams:examResult.count||0,averageCourseRating:Number(avgRating.toFixed(2)),averageStudentProgress:Number(avgProgress.toFixed(2)),totalEarnings:earnings.filter((row:any)=>row.status!=='failed').reduce((sum:number,row:any)=>sum+Number(row.amount||0),0),pendingEarnings:earnings.filter((row:any)=>row.status==='pending').reduce((sum:number,row:any)=>sum+Number(row.amount||0),0)};return json({data:{analytics}},200,origin)}


if(request.method==='GET'&&path==='/schools'){
  await requireUser();
  const page=asInt(url.searchParams.get('page'),1,1,100000),limit=asInt(url.searchParams.get('limit'),20,1,100),from=(page-1)*limit,to=from+limit-1,search=String(url.searchParams.get('search')||'').trim().slice(0,120);
  let query=admin.from('schools').select('id,name,code,email,phone,address,state,lga,type,logo_url,status,subscription_status,created_at',{count:'exact'}).eq('status','active').order('name',{ascending:true}).range(from,to);
  if(search)query=query.or(`name.ilike.%${search.replace(/[%_,()]/g,'')}%,code.ilike.%${search.replace(/[%_,()]/g,'')}%`);
  const{data,error,count}=await query;if(error)throw error;
  const ids=(data||[]).map((row:any)=>row.id);
  let students:any[]=[],teachers:any[]=[];
  if(ids.length){
    const[s,t]=await Promise.all([
      admin.from('school_students').select('school_id,student_id').in('school_id',ids).eq('status','active'),
      admin.from('school_teachers').select('school_id,teacher_id').in('school_id',ids).eq('status','active'),
    ]);
    if(s.error)throw s.error;if(t.error)throw t.error;students=s.data||[];teachers=t.data||[];
  }
  const schools=(data||[]).map((row:any)=>({
    id:row.id,name:row.name,code:row.code,email:row.email||null,phone:row.phone||null,address:row.address||null,state:row.state||null,lga:row.lga||null,type:row.type||null,
    logo:row.logo_url||null,status:row.status,subscriptionStatus:row.subscription_status||null,
    studentCount:new Set(students.filter((x:any)=>x.school_id===row.id).map((x:any)=>x.student_id)).size,
    teacherCount:new Set(teachers.filter((x:any)=>x.school_id===row.id).map((x:any)=>x.teacher_id)).size,
    createdAt:row.created_at,
  }));
  const total=count||0;return json({data:{schools},pagination:{page,limit,total,totalPages:Math.ceil(total/limit)}},200,origin)
}
if(request.method==='POST'&&path==='/schools/join'){
  const user=await requireUser();const body=await request.json().catch(()=>null);const schoolCode=String(body?.schoolCode||'').trim().toUpperCase().slice(0,64);
  if(!schoolCode)return json({error:{message:'School code is required'}},400,origin);
  const{data:school,error:schoolError}=await admin.from('schools').select('id,name,code,status').eq('code',schoolCode).eq('status','active').maybeSingle();
  if(schoolError)throw schoolError;if(!school)return json({error:{message:'No active school matches that code'}},404,origin);
  const{data:links,error:roleLinkError}=await admin.from('user_roles').select('role_id').eq('user_id',user.id);if(roleLinkError)throw roleLinkError;
  const roleIds=(links||[]).map((row:any)=>row.role_id).filter(Boolean);let roleNames:string[]=[];
  if(roleIds.length){const{data:defs,error:defsError}=await admin.from('roles').select('name').in('id',roleIds);if(defsError)throw defsError;roleNames=(defs||[]).map((row:any)=>String(row.name))}
  let membership:any=null;
  if(roleNames.includes('teacher')){
    const{data,error}=await admin.from('school_teachers').upsert({school_id:school.id,teacher_id:user.id,status:'active'},{onConflict:'school_id,teacher_id'}).select().single();if(error)throw error;membership=data;
  }else if(roleNames.includes('student')){
    const{data,error}=await admin.from('school_students').upsert({school_id:school.id,student_id:user.id,status:'active',enrollment_year:new Date().getUTCFullYear()},{onConflict:'school_id,student_id'}).select().single();if(error)throw error;membership=data;
  }else{
    return json({error:{message:'Only student and teacher accounts can join a school with a school code'}},403,origin);
  }
  return json({data:{school:{id:school.id,name:school.name,code:school.code},membership}},200,origin)
}
return json({error:{message:`Route ${request.method} ${path} is not available in the Supabase web API`}},404,origin)}catch(error){const status=Number((error as any)?.status||500),message=error instanceof Error?error.message:'Request failed';console.error('web-api request failed',{message,status});return json({error:{message:status>=500?'Request failed':message}},status,origin)}});
