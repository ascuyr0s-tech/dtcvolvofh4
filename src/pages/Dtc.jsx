import {useEffect,useState} from 'react'
import {supabase} from '../lib/supabase'
import {localAll} from '../lib/offline'
const ND=<span className="nd">Información no disponible</span>
const F=[['mid','MID'],['pid','PID'],['sid','SID'],['psid','PSID'],['fmi','FMI'],['vehicle','Vehículo/Generación'],['engine','Motor'],['module','Módulo'],['system','Sistema afectado'],['activation','Condiciones de activación'],['causes','Posibles causas (no confirmadas)'],['components_location','Ubicación de componentes'],['tests','Pruebas de diagnóstico'],['measurements','Valores de medición'],['diagrams','Diagramas eléctricos'],['tools','Herramientas'],['repair_procedure','Procedimiento de reparación'],['post_checks','Verificaciones posteriores'],['related_codes','Códigos relacionados'],['source','Fuente'],['source_doc','Documento'],['source_page','Página/sección'],['updated_at','Actualizado']]
export function Ficha({d}){return <div className="card"><h3>{d.code}</h3><p>{d.description||ND}</p>
 {F.map(([k,l])=><p key={k}><b>{l}:</b> {d[k]?String(d[k]):ND}</p>)}
 <h4>Guía de diagnóstico</h4>{(d.steps||[]).length?d.steps.map((s,i)=><div key={i} className="card"><b>PASO {i+1}: {s.titulo}</b><p>{s.descripcion}</p>
  {['herramientas','valores','esperado','anormal','siguiente'].map(k=>s[k]&&<p key={k}><b>{k}:</b> {s[k]}</p>)}</div>):<p>{ND}</p>}</div>}
export default function Dtc(){
 const [q,setQ]=useState(''),[r,setR]=useState([]),[sel,setSel]=useState(null),[src,setSrc]=useState('')
 useEffect(()=>{const t=setTimeout(async()=>{
  const s=q.trim().toLowerCase();if(!s){setR([]);return}
  const loc=await localAll('dtc');let out;
  if(loc.length||!navigator.onLine){setSrc('datos locales');out=loc.filter(d=>[d.code,d.mid,d.pid,d.sid,d.psid,d.fmi,d.module,d.description].join(' ').toLowerCase().includes(s))}
  else{setSrc('en línea');const e=s.replace(/[%,()]/g,'');const {data}=await supabase.from('dtc_codes').select('*').eq('status','validado').or(`code.ilike.%${e}%,description.ilike.%${e}%,mid.ilike.%${e}%,pid.ilike.%${e}%,sid.ilike.%${e}%,psid.ilike.%${e}%,fmi.ilike.%${e}%,module.ilike.%${e}%`).limit(50);out=data||[]}
  setR(out.slice(0,50))},250);return()=>clearTimeout(t)},[q])
 if(sel)return <><button className="sec" onClick={()=>setSel(null)}>← Volver</button><Ficha d={sel}/></>
 return <><h1>Buscar DTC</h1><input autoFocus placeholder="Código, MID, PID, SID, PSID, FMI, módulo o descripción" value={q} onChange={e=>setQ(e.target.value)}/>
  <small>{src&&'Fuente: '+src}</small>
  {r.map(d=><div className="card" key={d.id} onClick={()=>setSel(d)}><b>{d.code}</b> <span className="tag">{d.module||'—'}</span><span className="tag">{d.vehicle||'—'}</span><p>{d.description||ND}</p></div>)}
  {q&&!r.length&&<p>Sin resultados documentados para esta búsqueda.</p>}</>}
