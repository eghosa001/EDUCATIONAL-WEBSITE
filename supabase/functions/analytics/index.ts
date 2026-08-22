import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const cors={ 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type' };
const out=(x:unknown,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{...cors,'Content-Type':'application/json'}});
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS') return new Response('ok',{headers:cors});
 try{
  const url=Deno.env.get('SUPABASE_URL')!, anon=Deno.env.get('SUPABASE_ANON_KEY')!, service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const auth=req.headers.get('Authorization'); if(!auth) return out({error:'Authentication required'},401);
  const userClient=createClient(url,anon,{global:{headers:{Authorization:auth}}}); const admin=createClient(url,service);
  const {data:{user},error:ae}=await userClient.auth.getUser(); if(ae||!user) return out({error:'Authentication required'},401);
  const b=await req.json(); const a=String(b.action||'');
  const count=async(table:string,filter?:[string,string])=>{let q=admin.from(table).select('*',{count:'exact',head:true}); if(filter) q=q.eq(filter[0],filter[1]); const r=await q; return r.count||0;};
  if(a==='user'){
   const [sessions,study,courses,completed,lessons,exams]=await Promise.all([count('sessions',['user_id',user.id]),count('study_sessions',['student_id',user.id]),count('student_courses',['student_id',user.id]),count('student_courses',['student_id',user.id]),count('lesson_progress',['student_id',user.id]),count('exam_attempts',['student_id',user.id])]);
   const {data: attempts}=await admin.from('exam_attempts').select('percentage').eq('student_id',user.id).not('percentage','is',null); const avg=attempts?.length?attempts.reduce((s,r)=>s+Number(r.percentage||0),0)/attempts.length:0;
   const {data:ss}=await admin.from('study_sessions').select('duration_seconds,started_at').eq('student_id',user.id); const days=new Set((ss||[]).map(r=>String(r.started_at).slice(0,10))).size; const total=(ss||[]).reduce((s,r)=>s+Number(r.duration_seconds||0),0);
   return out({analytics:{totalSessions:sessions,totalStudyTime:total,coursesEnrolled:courses,coursesCompleted:completed,lessonsCompleted:lessons,examsTaken:exams,averageExamScore:avg,activeDays:days,currentStreak:0,longestStreak:0}});
  }
  if(a==='course'){
   const {data:en}=await admin.from('student_courses').select('progress_percentage').eq('course_id',b.courseId); const {data:course}=await admin.from('courses').select('lesson_count,rating,review_count').eq('id',b.courseId).maybeSingle(); const {data:lp}=await admin.from('lesson_progress').select('lesson_id,status').eq('course_id',b.courseId); const n=en?.length||0; const avg=n?(en||[]).reduce((s,r)=>s+Number(r.progress_percentage||0),0)/n:0;
   return out({analytics:{enrollmentCount:n,completionRate:n?((en||[]).filter(r=>Number(r.progress_percentage||0)>=100).length/n)*100:0,averageProgress:avg,totalLessons:Number(course?.lesson_count||lp?.length||0),completedLessons:(lp||[]).filter(r=>r.status==='completed').length,averageRating:Number(course?.rating||0),reviewCount:Number(course?.review_count||0),popularLessons:[]}});
  }
  if(a==='exam'){
   const {data:at}=await admin.from('exam_attempts').select('percentage,is_passed').eq('exam_id',b.examId); const n=at?.length||0; const avg=n?(at||[]).reduce((s,r)=>s+Number(r.percentage||0),0)/n:0; const pass=n?((at||[]).filter(r=>r.is_passed).length/n)*100:0;
   return out({analytics:{totalAttempts:n,averageScore:avg,passRate:pass,difficultyDistribution:{},questionPerformance:[]}});
  }
  if(a==='platform'||a==='content'||a==='revenue'||a==='time-series'||a==='learning'){
   if(a==='platform'||a==='revenue'){
    const [users,courses,lessons,questions,exams,subs]=await Promise.all([count('users'),count('courses'),count('lessons'),count('questions'),count('exams'),count('subscriptions')]);
    if(a==='platform') return out({stats:{totalUsers:users,activeUsers:0,totalCourses:courses,totalLessons:lessons,totalQuestions:questions,totalExams:exams,totalSubscriptions:subs,monthlyRevenue:0,userGrowth:0,courseCompletionRate:0}});
    const {data:p}=await admin.from('payments').select('amount,paid_at,status').eq('status','success'); const revenue=(p||[]).reduce((s,r)=>s+Number(r.amount||0),0); return out({analytics:{totalRevenue:revenue,monthlyRevenue:[],revenueBySource:{},subscriptionBreakdown:{},activeSubscriptions:subs,churnRate:0}});
   }
   if(a==='content'){return out({analytics:{mostViewedCourses:[],mostPopularLessons:[],highestRatedCourses:[],mostAttemptedExams:[]}});}
   if(a==='learning'){return out({analytics:{timeSpentBySubject:{},performanceBySubject:{},activityByDay:{},popularTopics:[],weakAreas:[]}});}
   const start=new Date(String(b.startDate||new Date(Date.now()-30*86400000).toISOString())); const end=new Date(String(b.endDate||new Date().toISOString())); const days:any[]=[]; for(let d=new Date(start);d<=end;d.setUTCDate(d.getUTCDate()+1)) days.push({date:d.toISOString().slice(0,10),value:0}); return out({analytics:{userSignups:days,courseEnrollments:days,examAttempts:days,revenue:days,activeUsers:days}});
  }
  if(a==='export') return out({error:'Analytics export is not enabled yet; use the analytics datasets directly.'},501);
  return out({error:`Unsupported analytics action: ${a}`},400);
 }catch(e){console.error(e);return out({error:e instanceof Error?e.message:'Analytics operation failed'},500)}
});