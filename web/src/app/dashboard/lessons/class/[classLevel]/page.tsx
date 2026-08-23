'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, BookOpen, ChevronRight, GraduationCap, Loader2, Search } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type ClassRow={id:string;name:string;code:string;order_index:number};
type Course={id:string;title:string;slug:string;description:string|null;subject_id:string|null;class_id:string};
type Subject={id:string;name:string;order_index:number};
type Lesson={id:string;course_id:string;title:string;is_published:boolean};

const labels:Record<string,{title:string;subtitle:string;accent:string}>={
 'primary-1':{title:'Primary 1',subtitle:'Build strong foundations through guided teaching and practice.',accent:'📚'},
 'primary-2':{title:'Primary 2',subtitle:'Strengthen core skills with progressive lessons and questions.',accent:'📘'},
 'primary-3':{title:'Primary 3',subtitle:'Learn concepts clearly, practise often and keep progressing.',accent:'✏️'},
 'primary-4':{title:'Primary 4',subtitle:'Develop deeper understanding across every subject.',accent:'🧠'},
 'primary-5':{title:'Primary 5',subtitle:'Master important concepts and prepare for the next stage.',accent:'🎯'},
 'primary-6':{title:'Primary 6',subtitle:'Consolidate primary school knowledge through structured learning.',accent:'🏆'},
 'jss-1':{title:'JSS 1',subtitle:'Start junior secondary learning with clear explanations and practice.',accent:'🎓'},
 'jss-2':{title:'JSS 2',subtitle:'Build on your knowledge with increasingly challenging lessons.',accent:'📖'},
 'jss-3':{title:'JSS 3',subtitle:'Strengthen your secondary foundation and prepare for senior school.',accent:'🚀'},
 'ss-1':{title:'SS 1',subtitle:'Develop strong senior secondary knowledge subject by subject.',accent:'🔬'},
 'ss-2':{title:'SS 2',subtitle:'Go deeper into concepts and practise examination-style thinking.',accent:'📐'},
 'ss-3':{title:'SS 3',subtitle:'Complete your senior secondary journey with focused learning.',accent:'🏅'},
};
function slugify(s:string){return s.toLowerCase().replace(/class\s+[ab]$/,'').trim().replace(/\s+/g,'-')}

export default function ClassCurriculumPage(){
 const {classLevel}=useParams();const {token}=useAuth();const key=String(classLevel||'').toLowerCase();const meta=labels[key];
 const [courses,setCourses]=useState<Course[]>([]);const [subjects,setSubjects]=useState<Subject[]>([]);const [lessons,setLessons]=useState<Lesson[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [search,setSearch]=useState('');
 useEffect(()=>{if(!token||!meta)return;let cancelled=false;(async()=>{try{const s=getSupabase();const {data:classes,error:ce}=await s.from('classes').select('id,name,code,order_index').eq('is_active',true);if(ce)throw ce;const matching=(classes||[]).filter((c:any)=>slugify(c.name)===key||slugify(c.code)===key);if(!matching.length)throw new Error('Class not found');const ids=matching.map((c:any)=>c.id);const [{data:cs,error:co},{data:ss,error:se}]=await Promise.all([s.from('courses').select('id,title,slug,description,subject_id,class_id').in('class_id',ids).eq('status','published').order('title'),s.from('subjects').select('id,name,order_index').eq('is_active',true).order('order_index')]);if(co)throw co;if(se)throw se;const courseIds=(cs||[]).map((c:any)=>c.id);const {data:ls,error:le}=courseIds.length?await s.from('lessons').select('id,course_id,title,is_published').in('course_id',courseIds).eq('is_published',true).order('order_index'):{data:[],error:null} as any;if(le)throw le;if(!cancelled){setCourses((cs||[]) as Course[]);setSubjects((ss||[]) as Subject[]);setLessons((ls||[]) as Lesson[])}}catch(e:any){if(!cancelled)setError(e?.message||'Unable to load this class')}finally{if(!cancelled)setLoading(false)}})();return()=>{cancelled=true}},[key,token,meta]);
 const filtered=useMemo(()=>{const q=search.trim().toLowerCase();return courses.filter(c=>{const sub=subjects.find(s=>s.id===c.subject_id)?.name||'';return !q||`${c.title} ${sub} ${c.description||''}`.toLowerCase().includes(q)})},[courses,subjects,search]);
 if(!meta)return <div className="p-10 text-center">Class not found.</div>;
 if(loading)return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#151A3A]"/></div>;
 return <div className="space-y-7"><Link href="/dashboard/lessons" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#151A3A]"><ArrowLeft className="h-4 w-4"/>All classes</Link><section className="overflow-hidden rounded-3xl bg-[#151A3A] p-7 text-white shadow-xl sm:p-9"><div className="flex items-end justify-between gap-5"><div><div className="text-4xl">{meta.accent}</div><p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-300">THE GUIDE CURRICULUM</p><h1 className="mt-2 text-4xl font-extrabold">{meta.title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{meta.subtitle} Choose a subject, open its course and learn topic by topic.</p></div><GraduationCap className="hidden h-14 w-14 text-white/70 sm:block"/></div></section><div className="flex items-center justify-between gap-4"><div><h2 className="text-2xl font-extrabold text-[#151A3A] dark:text-white">Subjects & Courses</h2><p className="text-sm text-slate-500">{courses.length} course{courses.length===1?'':'s'} · {lessons.length} published lesson{lessons.length===1?'':'s'}</p></div><div className="relative hidden w-72 sm:block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search subjects…" className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#151A3A] dark:border-slate-700 dark:bg-[#1b2045] dark:text-white"/></div></div>{error&&<div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}{!filtered.length?<div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-[#1b2045]"><BookOpen className="mx-auto h-10 w-10 text-stone-300"/><h3 className="mt-3 font-bold text-[#151A3A] dark:text-white">No published courses yet</h3><p className="mt-1 text-sm text-slate-500">Content for {meta.title} will appear here when published.</p></div>:<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(c=>{const sub=subjects.find(s=>s.id===c.subject_id)?.name||'General Studies';const count=lessons.filter(l=>l.course_id===c.id).length;return <Link key={c.id} href={`/dashboard/courses/${c.slug||c.id}`} className="group rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#151A3A]/30 hover:shadow-lg dark:border-slate-700 dark:bg-[#1b2045]"><div className="flex items-start justify-between gap-3"><div className="rounded-xl bg-[#151A3A] p-3 text-white"><BookOpen className="h-5 w-5"/></div><ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#151A3A]"/></div><p className="mt-5 text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">{sub}</p><h3 className="mt-1 text-lg font-bold text-[#151A3A] dark:text-white">{c.title}</h3>{c.description&&<p className="mt-2 line-clamp-2 text-sm text-slate-500">{c.description}</p>}<div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4 text-xs font-semibold text-slate-500 dark:border-slate-700"><span>{count} lesson{count===1?'':'s'}</span><span className="text-[#151A3A] dark:text-white">View course</span></div></Link>})}</div>}</div>;
}
