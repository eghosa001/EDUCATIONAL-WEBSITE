import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const configuredOrigins=(Deno.env.get('PAYMENT_ALLOWED_ORIGINS')||'').split(',').map(x=>x.trim()).filter(Boolean);
const corsHeadersFor=(request:Request)=>{const origin=request.headers.get('Origin');const allowed=origin&&(configuredOrigins.length===0||configuredOrigins.includes(origin));return{'Access-Control-Allow-Origin':allowed?origin:(configuredOrigins.length===0?'*':configuredOrigins[0]),'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'}};
const json=(request:Request,body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeadersFor(request),'Content-Type':'application/json'}});
const uuid=(value:unknown)=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const ref=()=>`TG-${Date.now()}-${crypto.randomUUID().slice(0,8)}`;

Deno.serve(async(request)=>{
 if(request.method==='OPTIONS')return new Response('ok',{headers:corsHeadersFor(request)});
 if(request.method!=='POST')return json(request,{error:'Method not allowed'},405);
 try{
  const contentLength=Number(request.headers.get('content-length')||0);if(contentLength>32*1024)return json(request,{error:'Request body is too large'},413);
  const url=Deno.env.get('SUPABASE_URL');const anon=Deno.env.get('SUPABASE_ANON_KEY');const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');const auth=request.headers.get('Authorization');
  if(!url||!anon||!service)return json(request,{error:'Payment service configuration is incomplete'},500);if(!auth?.startsWith('Bearer '))return json(request,{error:'Authentication required'},401);
  const userClient=createClient(url,anon,{global:{headers:{Authorization:auth}}});const admin=createClient(url,service);const {data:{user},error:authError}=await userClient.auth.getUser();if(authError||!user)return json(request,{error:'Authentication required'},401);
  const body=await request.json();if(!body||typeof body!=='object'||Array.isArray(body))return json(request,{error:'Invalid request body'},400);const action=String(body.action||'');
  const paystackSecret=Deno.env.get('PAYSTACK_SECRET_KEY')||'';const flutterwaveSecret=Deno.env.get('FLUTTERWAVE_SECRET_KEY')||'';

  if(action==='get-gateways'){
   const gateways=[];if(paystackSecret)gateways.push({id:'paystack',name:'Paystack',code:'paystack',isActive:true});if(flutterwaveSecret)gateways.push({id:'flutterwave',name:'Flutterwave',code:'flutterwave',isActive:true});
   return json(request,{gateways});
  }

  if(action==='create-payment'){
   const gateway=String(body.gateway||'');if(!['paystack','flutterwave'].includes(gateway))return json(request,{error:'Unsupported gateway'},400);
   let purpose='general',purposeId:string|null=null,amount=Number(body.amount||0),currency=String(body.currency||'NGN').toUpperCase();
   if(uuid(body.planId)){const {data:plan,error}=await admin.from('subscription_plans').select('id,price,currency,is_active').eq('id',body.planId).eq('is_active',true).maybeSingle();if(error||!plan)return json(request,{error:'Plan not found'},404);purpose='subscription';purposeId=plan.id;amount=Number(plan.price||0);currency=String(plan.currency||'NGN').toUpperCase();}
   if(!Number.isFinite(amount)||amount<=0)return json(request,{error:'Invalid payment amount'},400);
   const reference=ref();const redirectUrl=String(body.redirectUrl||'').slice(0,500);const metadata={...(typeof body.metadata==='object'&&body.metadata?body.metadata:{}),planId:uuid(body.planId)?body.planId:null,purpose,purposeId};
   let authorizationUrl='';let gatewayReference=reference;let accessCode:string|null=null;
   if(gateway==='paystack'){
    if(!paystackSecret)return json(request,{error:'Paystack is not configured'},503);
    const response=await fetch('https://api.paystack.co/transaction/initialize',{method:'POST',headers:{Authorization:`Bearer ${paystackSecret}`,'Content-Type':'application/json'},body:JSON.stringify({amount:Math.round(amount*100),currency,email:user.email,reference,metadata,callback_url:redirectUrl||undefined})});const result=await response.json();if(!response.ok||!result?.status||!result?.data?.authorization_url)return json(request,{error:result?.message||'Unable to initialize Paystack payment'},400);authorizationUrl=result.data.authorization_url;gatewayReference=result.data.reference||reference;accessCode=result.data.access_code||null;
   }else{
    if(!flutterwaveSecret)return json(request,{error:'Flutterwave is not configured'},503);
    const response=await fetch('https://api.flutterwave.com/v3/payments',{method:'POST',headers:{Authorization:`Bearer ${flutterwaveSecret}`,'Content-Type':'application/json'},body:JSON.stringify({tx_ref:reference,amount,currency,redirect_url:redirectUrl,customer:{email:user.email},customizations:{title:'THE GUIDE',description:'Educational subscription'},meta:metadata})});const result=await response.json();if(!response.ok||result?.status!=='success'||!result?.data?.link)return json(request,{error:result?.message||'Unable to initialize Flutterwave payment'},400);authorizationUrl=result.data.link;
   }
   const {data:payment,error:insertError}=await admin.from('payments').insert({reference,user_id:user.id,amount,currency,gateway,gateway_reference:gatewayReference,status:'pending',purpose,purpose_id:purposeId,metadata}).select().single();if(insertError)return json(request,{error:'Unable to create payment record'},500);
   return json(request,{success:true,data:{payment,authorizationUrl,accessCode,reference}});
  }

  if(action==='verify-payment'){
   const reference=String(body.reference||'').trim().slice(0,200);if(!reference)return json(request,{error:'Payment reference is required'},400);
   const {data:payment,error:readError}=await admin.from('payments').select('*').eq('reference',reference).eq('user_id',user.id).maybeSingle();if(readError||!payment)return json(request,{error:'Payment not found'},404);if(payment.status==='completed')return json(request,{success:true,payment,verified:true});
   let verified=false;let gatewayReference=payment.gateway_reference;
   if(payment.gateway==='paystack'){
    if(!paystackSecret)return json(request,{error:'Paystack is not configured'},503);const response=await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,{headers:{Authorization:`Bearer ${paystackSecret}`}});const result=await response.json();const d=result?.data;verified=Boolean(response.ok&&result?.status&&d?.status==='success'&&Number(d.amount)/100===Number(payment.amount)&&String(d.currency).toUpperCase()===String(payment.currency).toUpperCase());gatewayReference=d?.reference||gatewayReference;
   }else if(payment.gateway==='flutterwave'){
    if(!flutterwaveSecret)return json(request,{error:'Flutterwave is not configured'},503);const transactionId=String(body.transactionId||'');if(!transactionId)return json(request,{error:'Flutterwave transaction id is required'},400);const response=await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`,{headers:{Authorization:`Bearer ${flutterwaveSecret}`}});const result=await response.json();const d=result?.data;verified=Boolean(response.ok&&result?.status==='success'&&d?.status==='successful'&&String(d.tx_ref)===reference&&Number(d.amount)>=Number(payment.amount)&&String(d.currency).toUpperCase()===String(payment.currency).toUpperCase());gatewayReference=String(d?.id||gatewayReference);
   }
   if(!verified){await admin.from('payments').update({status:'failed',failed_at:new Date().toISOString(),failure_reason:'Gateway verification failed'}).eq('id',payment.id);return json(request,{error:'Payment could not be verified'},400);}
   const {data:completed,error:updateError}=await admin.from('payments').update({status:'completed',paid_at:new Date().toISOString(),gateway_reference:gatewayReference,failure_reason:null}).eq('id',payment.id).select().single();if(updateError)return json(request,{error:'Unable to finalize payment'},500);
   if(payment.purpose==='subscription'&&payment.purpose_id){const {data:plan}=await admin.from('subscription_plans').select('duration_days').eq('id',payment.purpose_id).maybeSingle();if(plan){const start=new Date();const end=new Date(start);end.setDate(end.getDate()+Number(plan.duration_days||30));const {data:existing}=await admin.from('subscriptions').select('id').eq('user_id',user.id).in('status',['active','trialing']).maybeSingle();if(!existing)await admin.from('subscriptions').insert({user_id:user.id,plan_id:payment.purpose_id,gateway:payment.gateway,gateway_subscription_id:gatewayReference,status:'active',current_period_start:start.toISOString(),current_period_end:end.toISOString(),cancel_at_period_end:false});}}
   return json(request,{success:true,payment:completed,verified:true});
  }

  if(action==='create-subscription'){
   if(!uuid(body.planId))return json(request,{error:'Invalid planId'},400);const {data:plan,error:planError}=await admin.from('subscription_plans').select('id,name,price,currency,duration_days,is_active').eq('id',body.planId).eq('is_active',true).maybeSingle();if(planError||!plan)return json(request,{error:'Subscription plan not found'},404);const {data:existing}=await admin.from('subscriptions').select('id,status').eq('user_id',user.id).in('status',['active','trialing']).maybeSingle();if(existing)return json(request,{error:'You already have an active subscription'},409);const price=Number(plan.price||0);if(price>0)return json(request,{paymentRequired:true,plan:{id:plan.id,name:plan.name,amount:price,currency:plan.currency||'NGN',durationDays:Number(plan.duration_days||0)}});const start=new Date();const end=new Date(start);end.setDate(end.getDate()+Number(plan.duration_days||0));const {data:subscription,error}=await admin.from('subscriptions').insert({user_id:user.id,plan_id:plan.id,gateway:'free',gateway_subscription_id:null,status:'active',current_period_start:start.toISOString(),current_period_end:end.toISOString(),cancel_at_period_end:false}).select().single();if(error)return json(request,{error:'Unable to create subscription'},400);return json(request,{subscription,paymentRequired:false});
  }
  if(action==='cancel-subscription'){if(!uuid(body.subscriptionId))return json(request,{error:'Invalid subscriptionId'},400);const {data,error}=await admin.from('subscriptions').update({cancel_at_period_end:true}).eq('id',body.subscriptionId).eq('user_id',user.id).in('status',['active','trialing']).select().maybeSingle();if(error||!data)return json(request,{error:error?.message||'Subscription not found'},404);return json(request,{subscription:data});}
  if(action==='resume-subscription'){if(!uuid(body.subscriptionId))return json(request,{error:'Invalid subscriptionId'},400);const {data:current,error:readError}=await admin.from('subscriptions').select('*').eq('id',body.subscriptionId).eq('user_id',user.id).maybeSingle();if(readError||!current)return json(request,{error:readError?.message||'Subscription not found'},404);if(!['active','trialing'].includes(current.status))return json(request,{error:'Only an active subscription can be resumed'},400);const {data,error}=await admin.from('subscriptions').update({cancel_at_period_end:false,canceled_at:null}).eq('id',current.id).select().single();if(error)return json(request,{error:'Unable to resume subscription'},400);return json(request,{subscription:data});}
  if(action==='validate-coupon'){const code=String(body.couponCode||'').trim().toUpperCase().slice(0,100);if(!code||!uuid(body.planId))return json(request,{error:'couponCode and planId are required'},400);const {data:coupon,error}=await admin.from('coupons').select('id,code,discount_type,discount_value,max_discount_amount,valid_from,valid_until,is_active').eq('code',code).eq('is_active',true).maybeSingle();if(error||!coupon)return json(request,{error:'Invalid coupon code'},400);const {data:plan}=await admin.from('subscription_plans').select('id,price,currency').eq('id',body.planId).eq('is_active',true).maybeSingle();if(!plan)return json(request,{error:'Plan not found'},404);const now=Date.now();if(coupon.valid_from&&now<new Date(coupon.valid_from).getTime())return json(request,{error:'Coupon is not yet valid'},400);if(coupon.valid_until&&now>new Date(coupon.valid_until).getTime())return json(request,{error:'Coupon has expired'},400);const price=Number(plan.price||0);let discount=coupon.discount_type==='percentage'?price*Number(coupon.discount_value||0)/100:Number(coupon.discount_value||0);if(coupon.max_discount_amount!=null)discount=Math.min(discount,Number(coupon.max_discount_amount));discount=Math.min(Math.max(discount,0),price);return json(request,{coupon:{id:coupon.id,code:coupon.code},discountAmount:discount,finalAmount:price-discount,currency:plan.currency||'NGN'});}
  return json(request,{error:'Unsupported payment action'},400);
 }catch(error){console.error('Payment operation failed:',error instanceof Error?error.message:'unknown error');return json(request,{error:'Payment operation failed'},500);}
});
