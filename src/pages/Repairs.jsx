import {useEffect,useState} from 'react'
import {supabase} from '../lib/supabase'
import {saveRepair} from '../lib/offline'
const E={dtc_code:'',vehicle:'',symptoms_found:'',diagnosis:'',cause:'',repair:'',parts:'',notes:'',result:''}
const L={dtc_code:'Código DTC *',vehicle:'Vehículo y modelo',symptoms_found:'Síntomas encontrados',diagnosis:'Diagnóstico realizado',cause:'Causa identificada',repair:'Reparación ejecutada',parts:'Repuestos utilizados',notes:'Observaciones',result:'Resultado'}
export default function Repairs({onSaved}){
 const [f,setF]=useState(E),[list,setList]=useState([]),[q,setQ]=useState(''),[m,setM]=useState(''),[file,setFile]=useState(null)
 const load=async()=>{if(!navigator.onLine)return;let s=supabase.from('repair_history').select('*').order('created_at',{ascending:false}).limit(50);
  if(q.trim())s=s.ilike('dtc_code','%'+q.trim()+'%');const {data}=await s;setList(data||[])}
 useEffect(()=>{load()},[q])
 const save=async()=>{if(!f.dtc_code.trim())return setM('El código DTC es obligatorio')
  const rep={...f,dtc_code:f.dtc_code.trim().toUpperCase()}
  if(file&&navigator.onLine){const p=crypto.randomUUID()+'-'+file.name;const {error}=await supabase.storage.from('reparaciones').upload(p,file);if(!error)rep.photo_path=p}
  const r=await saveRepair(rep);setM(r==='synced'?'Guardado':'Guardado sin conexión: se sincronizará al volver Internet');setF(E);setFile(null);onSaved&&onSaved();load()}
 return <><h1>Historial de reparaciones</h1><div className="card"><p><small>Registro del técnico: no es información técnica oficial.</small></p>
  {Object.keys(E).map(k=><input key={k} placeholder={L[k]} value={f[k]} onChange={e=>setF({...f,[k]:e.target.value})}/>)}
  <input type="file" accept="image/*" onChange={e=>setFile(e.target.files[0])}/><button onClick={save}>Guardar reparación</button><p>{m}</p></div>
  <input placeholder="Filtrar por código DTC" value={q} onChange={e=>setQ(e.target.value)}/>
  {list.map(r=><div className="card" key={r.id}><b>{r.dtc_code}</b> <span className="tag">{r.status==='solucion_verificada'?'Solución verificada':'Pendiente de confirmar'}</span>
   <p>{r.vehicle} — {r.repair_date}</p><p><b>Causa:</b> {r.cause}</p><p><b>Reparación:</b> {r.repair}</p><p><b>Resultado:</b> {r.result}</p></div>)}</>}
