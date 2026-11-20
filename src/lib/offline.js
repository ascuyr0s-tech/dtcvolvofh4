import {supabase} from './supabase'
const open=()=>new Promise((res,rej)=>{const r=indexedDB.open('dtc',1);
 r.onupgradeneeded=()=>{const d=r.result;d.createObjectStore('dtc',{keyPath:'id'});d.createObjectStore('queue',{keyPath:'client_id'});d.createObjectStore('meta',{keyPath:'k'})};
 r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
const tx=async(s,m,f)=>{const d=await open();return new Promise((res,rej)=>{const t=d.transaction(s,m);const o=t.objectStore(s);const q=f(o);t.oncomplete=()=>res(q&&q.result);t.onerror=()=>rej(t.error)})};
export const localAll=s=>tx(s,'readonly',o=>o.getAll());
export async function syncDtc(){
 let all=[],from=0;
 for(;;){const {data,error}=await supabase.from('dtc_obd').select('*').eq('status','validado').order('id').range(from,from+999);
  if(error)throw error;all=all.concat(data);if(data.length<1000)break;from+=1000}
 await tx('dtc','readwrite',o=>{o.clear();all.forEach(x=>o.put(x))});
 await tx('meta','readwrite',o=>o.put({k:'last',v:new Date().toISOString()}));return all.length}
export const lastSync=async()=>(await tx('meta','readonly',o=>o.get('last')))?.v;
export async function saveRepair(rep){
 rep.client_id=crypto.randomUUID();
 const {data:{user}}=await supabase.auth.getUser();rep.technician_id=user?.id;
 if(navigator.onLine){const {error}=await supabase.from('repair_history').insert(rep);if(!error)return 'synced'}
 await tx('queue','readwrite',o=>o.put(rep));return 'queued'}
export const pending=async()=>(await localAll('queue')).length;
export async function flush(){
 const q=await localAll('queue');
 for(const r of q){const {error}=await supabase.from('repair_history').upsert(r,{onConflict:'client_id',ignoreDuplicates:true});
  if(!error)await tx('queue','readwrite',o=>o.delete(r.client_id))}
 return pending()}
