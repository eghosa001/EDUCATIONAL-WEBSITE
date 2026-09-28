'use client';
import { useEffect, useState } from 'react';
import { BookOpenIcon, ClockIcon, PlayIcon } from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';
import { getLearnerApiHeaders, handleApiResponse, learnerApiConfig } from '@/services/api/config';

interface RecentItem { id:string; title:string; time:string; }

export default function RecentPage(){
 const {token}=useAuthStore(); const authToken=token??undefined;
 const [items,setItems]=useState<RecentItem[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState('');
 useEffect(()=>{ if(!authToken){setLoading(false);return;} let cancelled=false;
  (async()=>{setLoading(true);setError('');try{
   const response=await fetch(`${learnerApiConfig.baseUrl}/progress/lessons?limit=10`,{headers:getLearnerApiHeaders(authToken),credentials:learnerApiConfig.credentials});
   const payload=await handleApiResponse<{data:any[]}>(response);
   if(!cancelled)setItems((payload.data||[]).map((row:any)=>({id:String(row.lesson_id),title:String(row.lesson?.title||'Lesson'),time:new Date(row.updated_at).toLocaleString()})));
  }catch(err){if(!cancelled)setError(err instanceof Error?err.message:'Unable to load recent activity');}finally{if(!cancelled)setLoading(false);}})();
  return()=>{cancelled=true};
 },[authToken]);
 if(loading)return <div className="space-y-6"><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Activity</h1><div className="flex items-center justify-center gap-2 py-8 text-gray-500"><ClockIcon className="h-5 w-5 animate-spin"/>Loading…</div></div>;
 return <div className="space-y-6"><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Activity</h1>
  {error&&<div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
  {!error&&items.length===0?<div className="rounded-xl border border-gray-200 bg-white py-16 text-center text-gray-500 dark:border-slate-700 dark:bg-[#1b2045]"><ClockIcon className="mx-auto mb-4 h-12 w-12 text-gray-300"/><p className="font-medium">No recent activity</p><p className="mt-1 text-sm">Start learning to see your progress here</p></div>:
  <div className="space-y-3">{items.map(item=><div key={item.id} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-[#1b2045]"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100"><BookOpenIcon className="h-5 w-5 text-blue-600"/></div><div className="flex-1"><p className="font-medium text-gray-900 dark:text-white">{item.title}</p><p className="text-sm text-gray-500">{item.time}</p></div><PlayIcon className="h-5 w-5 text-gray-400"/></div>)}</div>}
 </div>;
}
