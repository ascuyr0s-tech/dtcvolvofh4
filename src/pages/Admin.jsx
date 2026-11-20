import {useEffect,useState} from 'react'
import * as XLSX from 'xlsx'
import {supabase} from '../lib/supabase'
const MAP={'modo (módulo electrónico)':'modulo','modulo':'modulo','dtc iso':'dtc','dtc':'dtc','evento de falla':'evento_falla','tipo de falla':'tipo_falla','comportamiento funcional':'comportamiento','posibles causas':'posibles_causas','procedimiento para borrar el dtc confirmado':'procedimiento_borrar','acción propuesta para el taller':'accion_taller','nombre del componente':'componente'}
const F=['modulo','dtc','evento_falla','tipo_falla','comportamiento','posibles_causas','procedimiento_borrar','accion_taller','componente']
const sha=async t=>[...new Uint8Array(await crypto.subtle.digest('SHA-1',new TextEncoder().encode(t)))].map(b=>b.toString(16).padStart(2,'0')).join('')
export default function Admin(){
 const [u,setU]=useState([]),[n,setN]=useState({email:'',password:'',name:'',role:'tecnico'}),[m,setM]=useState(''),[rows,setRows]=useState([]),[pend,setPend]=useState(0),[busy,setBusy]=useState(false)
 const load=async()=>{setU((await supabase.from('profiles').select('*').order('created_at')).data||[])
  const {count}=await supabase.from('dtc_obd').select('id',{count:'exact',head:true}).eq('status','pendiente');setPend(count||0)}
 useEffect(()=>{load()},[])
 const create=async()=>{const {error}=await supabase.rpc('admin_create_user',{p_email:n.email,p_password:n.password,p_name:n.name,p_role:n.role})
  setM(error?error.message:'Usuario creado');if(!error)setN({email:'',password:'',name:'',role:'tecnico'});load()}
 const toggle=async x=>{await supabase.from('profiles').update({active:!x.active}).eq('id',x.id);load()}
 const file=async e=>{const f=e.target.files[0];if(!f)return;setM('Leyendo archivo…')
  const wb=XLSX.read(await f.arrayBuffer());const raw=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''})
  const seen=new Set(),out=[];let sinCodigo=0
  for(const r of raw){const o={};F.forEach(k=>o[k]='')
   Object.keys(r).forEach(k=>{const c=MAP[k.trim().toLowerCase()];if(c)o[c]=String(r[k]).trim()})
   if(!o.dtc||!o.modulo){sinCodigo++;continue}
   o.dtc=o.dtc.toUpperCase();o.hash=await sha(F.map(k=>o[k]).join('|'))
   if(seen.has(o.hash))continue;seen.add(o.hash);o.status='pendiente';out.push(o)}
  setRows(out);setM(`${raw.length} filas leídas · ${raw.length-out.length-sinCodigo} duplicadas exactas omitidas · ${sinCodigo} sin código/módulo · ${out.length} a importar`)}
 const imp=async()=>{setBusy(true)
  for(let i=0;i<rows.length;i+=500){setM(`Importando ${Math.min(i+500,rows.length)} de ${rows.length}…`)
   const {error}=await supabase.from('dtc_obd').upsert(rows.slice(i,i+500),{onConflict:'hash',ignoreDuplicates:true})
   if(error){setM('Error: '+error.message);setBusy(false);return}}
  setM(rows.length+' registros importados como PENDIENTES. Revisa y valida abajo.');setRows([]);setBusy(false);load()}
 const val=async()=>{if(!confirm('¿Publicar todos los registros pendientes para los técnicos?'))return
  const {data:{user}}=await supabase.auth.getUser()
  const {error}=await supabase.from('dtc_obd').update({status:'validado',updated_at:new Date().toISOString()}).eq('status','pendiente')
  setM(error?error.message:'Registros publicados');load()}
 return <><h1>Administración</h1>
  <div className="card"><h3>Importar Excel (.xlsx/.xls)</h3>
   <p><small>Formato: Modo (módulo electrónico), DTC ISO, Evento de falla, Tipo de falla, Comportamiento funcional, Posibles causas, Procedimiento para borrar el DTC confirmado, Acción propuesta para el taller, Nombre del componente.</small></p>
   <input type="file" accept=".xlsx,.xls" onChange={file}/>
   {rows.length>0&&<><p>Vista previa:</p>{rows.slice(0,5).map((r,i)=><p key={i}><b>{r.dtc}</b> [{r.modulo}] {r.componente}</p>)}<button disabled={busy} onClick={imp}>Confirmar importación</button></>}
   <p>{m}</p></div>
  <div className="card"><h3>Pendientes de publicar: {pend}</h3><button disabled={!pend} onClick={val}>Validar y publicar todos</button></div>
  <div className="card"><h3>Crear usuario</h3>
   <input placeholder="Nombre" value={n.name} onChange={e=>setN({...n,name:e.target.value})}/><input placeholder="Correo" value={n.email} onChange={e=>setN({...n,email:e.target.value})}/>
   <input type="password" placeholder="Contraseña (8+)" value={n.password} onChange={e=>setN({...n,password:e.target.value})}/>
   <select value={n.role} onChange={e=>setN({...n,role:e.target.value})}><option value="tecnico">Técnico</option><option value="admin">Administrador</option></select>
   <button onClick={create}>Crear usuario</button></div>
  <div className="card"><h3>Usuarios</h3>{u.map(x=><p key={x.id}>{x.email} <span className="tag">{x.role}</span><button className="sec" onClick={()=>toggle(x)}>{x.active?'Desactivar':'Activar'}</button></p>)}</div></>}
