import {useEffect,useState} from 'react'
import * as XLSX from 'xlsx'
import {supabase} from '../lib/supabase'
const COLS=['code','mid','pid','sid','psid','fmi','description','vehicle','engine','module','system','activation','causes','components_location','tests','measurements','diagrams','tools','repair_procedure','post_checks','related_codes','source','source_doc','source_page']
export default function Admin(){
 const [u,setU]=useState([]),[n,setN]=useState({email:'',password:'',name:'',role:'tecnico'}),[m,setM]=useState(''),[rows,setRows]=useState([]),[pend,setPend]=useState([])
 const load=async()=>{setU((await supabase.from('profiles').select('*').order('created_at')).data||[]);setPend((await supabase.from('dtc_codes').select('id,code,vehicle,engine,source_doc').eq('status','pendiente').limit(200)).data||[])}
 useEffect(()=>{load()},[])
 const create=async()=>{const {error}=await supabase.rpc('admin_create_user',{p_email:n.email,p_password:n.password,p_name:n.name,p_role:n.role});
  setM(error?error.message:'Usuario creado');if(!error)setN({email:'',password:'',name:'',role:'tecnico'});load()}
 const toggle=async x=>{await supabase.from('profiles').update({active:!x.active}).eq('id',x.id);load()}
 const file=async e=>{const f=e.target.files[0];if(!f)return;const wb=XLSX.read(await f.arrayBuffer());
  const raw=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''});
  const seen=new Set(),out=[];raw.forEach(r=>{const o={};Object.keys(r).forEach(k=>{const kk=k.trim().toLowerCase();if(COLS.includes(kk))o[kk]=String(r[k]).trim()});
   o.vehicle=o.vehicle||'';o.engine=o.engine||'';const key=[o.code,o.vehicle,o.engine].join('|');
   if(!o.code){return}if(seen.has(key))return;seen.add(key);o.status='pendiente';out.push(o)});
  setRows(out);setM(`${raw.length} filas leídas, ${out.length} válidas (sin código vacío ni duplicados en el archivo)`)}
 const imp=async()=>{const {error}=await supabase.from('dtc_codes').upsert(rows,{onConflict:'code,vehicle,engine'});setM(error?error.message:rows.length+' códigos importados como PENDIENTES de validación');setRows([]);load()}
 const val=async id=>{const {data:{user}}=await supabase.auth.getUser();await supabase.from('dtc_codes').update({status:'validado',reviewed_by:user.id,updated_at:new Date().toISOString()}).eq('id',id);load()}
 return <><h1>Administración</h1><div className="card"><h3>Crear usuario</h3>
  <input placeholder="Nombre" value={n.name} onChange={e=>setN({...n,name:e.target.value})}/><input placeholder="Correo" value={n.email} onChange={e=>setN({...n,email:e.target.value})}/>
  <input type="password" placeholder="Contraseña (8+)" value={n.password} onChange={e=>setN({...n,password:e.target.value})}/>
  <select value={n.role} onChange={e=>setN({...n,role:e.target.value})}><option value="tecnico">Técnico</option><option value="admin">Administrador</option></select>
  <button onClick={create}>Crear usuario</button><p>{m}</p></div>
  <div className="card"><h3>Usuarios</h3>{u.map(x=><p key={x.id}>{x.email} <span className="tag">{x.role}</span><button className="sec" onClick={()=>toggle(x)}>{x.active?'Desactivar':'Activar'}</button></p>)}</div>
  <div className="card"><h3>Importar Excel (.xlsx/.xls)</h3><p><small>Encabezados de columna: {COLS.join(', ')}</small></p>
   <input type="file" accept=".xlsx,.xls" onChange={file}/>
   {rows.length>0&&<><p>Vista previa:</p>{rows.slice(0,5).map((r,i)=><p key={i}><b>{r.code}</b> {r.description}</p>)}<button onClick={imp}>Confirmar importación</button></>}</div>
  <div className="card"><h3>Pendientes de validar ({pend.length})</h3>{pend.map(p=><p key={p.id}>{p.code} {p.vehicle} <button className="sec" onClick={()=>val(p.id)}>Validar y publicar</button></p>)}</div></>}
