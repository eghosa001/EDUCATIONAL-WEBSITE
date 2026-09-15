import { getSupabase } from '@/lib/supabase';
import type { PaginatedResponse } from '@/types/api/api';

export interface Payment { id:string; userId:string; amount:number; currency:string; status:'pending'|'completed'|'failed'|'refunded'; method?:string; gateway?:string; reference:string; description?:string; metadata?:Record<string,unknown>; createdAt:string; updatedAt:string; }
export interface PaymentFilters { page?:number; limit?:number; status?:string; userId?:string; startDate?:string; endDate?:string; }
export interface CreatePaymentData { amount:number; currency?:string; gateway:'paystack'|'flutterwave'; planId?:string; courseId?:string; examId?:string; redirectUrl?:string; metadata?:Record<string,unknown>; }
export interface CreatePaymentResponse { success:boolean; message?:string; data:{ payment:Payment; authorizationUrl?:string|null; accessCode?:string|null; reference?:string; }; }
export interface PaymentGateway { id:string; name:string; code:string; isActive:boolean; config?:Record<string,unknown>; }

const mapPayment=(row:any):Payment=>({id:row.id,userId:row.user_id,amount:Number(row.amount||0),currency:row.currency,status:row.status,gateway:row.gateway,reference:row.reference,metadata:row.metadata||{},createdAt:row.created_at,updatedAt:row.updated_at});
const invoke=async<T>(body:Record<string,unknown>):Promise<T>=>{const {data,error}=await getSupabase().functions.invoke('payments',{body});if(error)throw new Error(error.message||'Payment operation failed');if(data?.error)throw new Error(String(data.error));return data as T;};

export const fetchPayments=async(filters:PaymentFilters={},_token:string):Promise<PaginatedResponse<Payment>>=>{const user=(await getSupabase().auth.getUser()).data.user;if(!user)throw new Error('You must be signed in');const page=Math.max(1,filters.page||1);const limit=Math.min(100,Math.max(1,filters.limit||20));const from=(page-1)*limit;let query=getSupabase().from('payments').select('*',{count:'exact'}).eq('user_id',user.id).order('created_at',{ascending:false}).range(from,from+limit-1);if(filters.status)query=query.eq('status',filters.status);const {data,error,count}=await query;if(error)throw new Error(error.message);return{data:(data||[]).map(mapPayment),page,pageSize:limit,total:count||0,totalPages:Math.ceil((count||0)/limit)};};
export const fetchPaymentById=async(paymentId:string,_token:string):Promise<{payment:Payment}>=>{const user=(await getSupabase().auth.getUser()).data.user;if(!user)throw new Error('You must be signed in');const {data,error}=await getSupabase().from('payments').select('*').eq('id',paymentId).eq('user_id',user.id).maybeSingle();if(error||!data)throw new Error(error?.message||'Payment not found');return{payment:mapPayment(data)};};
export const createPayment=async(data:CreatePaymentData,_token:string):Promise<CreatePaymentResponse>=>invoke<CreatePaymentResponse>({action:'create-payment',...data});
export const verifyPayment=async(reference:string,_token:string,transactionId?:string)=>invoke({action:'verify-payment',reference,transactionId});
export const fetchPaymentGateways=async(_token?:string):Promise<{success?:boolean;data?:{gateways:PaymentGateway[]};gateways?:PaymentGateway[]}>=>{const result=await invoke<{gateways:PaymentGateway[]}>({action:'get-gateways'});return{gateways:result.gateways,data:{gateways:result.gateways}};};

export interface Wallet { id:string; userId:string; balance:number; currency:string; createdAt:string; updatedAt:string; }
export interface WalletTransaction { id:string; walletId:string; type:'credit'|'debit'; amount:number; description:string; reference?:string; balanceAfter:number; createdAt:string; }
export const fetchMyWallet=async(_token:string):Promise<{wallet:Wallet}>=>{throw new Error('Wallet funding is not enabled in this release.');};
export const fetchWalletTransactions=async(_page=1,_limit=20,_token:string):Promise<PaginatedResponse<WalletTransaction>>=>({data:[],page:_page,pageSize:_limit,total:0,totalPages:0});
export const fundWallet=async(_amount:number,_paymentMethodId:string,_token:string)=>{throw new Error('Wallet funding is not enabled in this release.');};
