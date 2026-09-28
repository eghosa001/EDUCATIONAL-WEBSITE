'use client';
import { useEffect,useState } from 'react';
import { BellIcon,CheckIcon } from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';
import { fetchNotifications,markNotificationAsRead,type Notification } from '@/services/api/notificationService';
const typeColors:Record<string,string>={exam:'bg-red-100 text-red-600',result:'bg-green-100 text-green-600',assignment:'bg-blue-100 text-blue-600',announcement:'bg-yellow-100 text-yellow-600',payment:'bg-purple-100 text-purple-600'};
export default function NotificationsPage(){const{token}=useAuthStore();const authToken=token??undefined;const[notifications,setNotifications]=useState<Notification[]>([]);const[loading,setLoading]=useState(true);const[error,setError]=useState('');
 useEffect(()=>{if(!authToken){setLoading(false);return;}let cancelled=false;fetchNotifications({limit:50},authToken).then(x=>{if(!cancelled)setNotifications(x.data||[])}).catch(err=>{if(!cancelled)setError(err instanceof Error?err.message:'Unable to load notifications')}).finally(()=>{if(!cancelled)setLoading(false)});return()=>{cancelled=true};},[authToken]);
 const markAsRead=async(id:string)=>{if(!authToken)return;try{await markNotificationAsRead(id,authToken);setNotifications(prev=>prev.map(n=>n.id===id?{...n,isRead:true}:n));}catch(err){setError(err instanceof Error?err.message:'Unable to update notification');}};
 if(loading)return <div className="space-y-6"><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1><div className="flex items-center justify-center py-12 text-gray-500">Loading…</div></div>;
 const unread=notifications.filter(n=>!n.isRead).length;
 return <div className="space-y-6"><div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>{unread>0&&<span className="rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">{unread} new</span>}</div>
 {error&&<div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
 {!error&&notifications.length===0?<div className="rounded-xl border border-gray-200 bg-white py-16 text-center text-gray-500 dark:border-slate-700 dark:bg-[#1b2045]"><BellIcon className="mx-auto mb-4 h-12 w-12 text-gray-300"/><p className="font-medium">No notifications</p><p className="mt-1 text-sm">You&apos;re all caught up!</p></div>:
 <div className="space-y-2">{notifications.map(n=><div key={n.id} className={`flex items-start gap-3 rounded-xl border p-4 ${n.isRead?'border-gray-200 bg-white':'border-blue-200 bg-blue-50'}`}><div className={`flex h-8 w-8 items-center justify-center rounded-lg ${typeColors[n.type]||'bg-gray-100 text-gray-600'}`}><BellIcon className="h-4 w-4"/></div><div className="flex-1"><p className="text-sm font-medium text-gray-900">{n.title}</p><p className="mt-0.5 text-sm text-gray-600">{n.message}</p><p className="mt-1 text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</p></div>{!n.isRead&&<button onClick={()=>void markAsRead(n.id)} className="rounded-lg p-1 hover:bg-gray-100" title="Mark as read"><CheckIcon className="h-4 w-4 text-green-600"/></button>}</div>)}</div>}
 </div>;
}
