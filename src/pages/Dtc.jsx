import {useEffect,useState} from 'react'
import {supabase} from '../lib/supabase'
import {localAll} from '../lib/offline'
export const COLS=[['modulo','Módulo electrónico'],['dtc','DTC ISO'],['componente','Nombre del componente'],['evento_falla','Evento de falla'],['tipo_falla','Tipo de falla'],['comportamiento','Comportamiento funcional'],['posibles_causas','Posibles causas (no confirmadas)'],['procedimiento_borrar','Procedimiento para borrar el DTC confirmado'],['accion_taller','Acción propuesta para el taller']]
const ND=<span className="nd">Información no disponible</span>
export async function consultar(q,campos,mod){
 const s=q.trim().toLowerCase();if(!s)return {rows:[],src:''}
 const loc=await localAll('dtc');let rows,src
 if(loc.length||!navigator.onLine){src='datos locales';rows=loc.filter(d=>campos.some(c=>(d[c]||'').toLowerCase().includes(s)))}
 else{src='en línea';const e=s.replace(/[%,()]/g,'')
  const {data}=await supabase.from('dtc_obd').select('*').eq('status','validado').or(campos.map(c=>`${c}.ilike.%${e}%`).join(',')).limit(400);rows=data||[]}
 if(mod)rows=rows.filter(d=>d.modulo===mod)
 return {rows,src}}
export function Detalle({dtc,rows}){return <>
 <h2>{dtc} <small>({rows.length} registro{rows.length>1?'s':''})</small></h2>
 {rows.map((r,i)=><div className="card" key={r.id}>
  {rows.length>1&&<p><span className="tag">Registro {i+1} de {rows.length}</span></p>}
  {COLS.map(([k,l])=><div key={k} style={{marginBottom:12}}><b>{l}</b><div style={{whiteSpace:'pre-wrap'}}>{r[k]?r[k]:ND}</div></div>)}
 </div>)}</>}
export function Resultados({rows,q}){
 const [sel,setSel]=useState(null),g={}
 rows.forEach(r=>(g[r.dtc]=g[r.dtc]||[]).push(r))
 const keys=Object.keys(g).sort(),ex=keys.filter(k=>k.toLowerCase()===q.trim().toLowerCase())
 useEffect(()=>setSel(null),[q])
 if(sel)return <><button className="sec" onClick={()=>setSel(null)}>← Volver a resultados</button><Detalle dtc={sel} rows={g[sel]||[]}/></>
 if(ex.length)return ex.map(k=><Detalle key={k} dtc={k} rows={g[k]}/>)
 return <>{keys.slice(0,60).map(k=>{const r=g[k][0];const mods=[...new Set(g[k].map(x=>x.modulo))].join(', ')
  return <div className="card" key={k} onClick={()=>setSel(k)}><b>{k}</b> <span className="tag">{mods}</span>
   <p>{r.componente||''}</p><small>{(r.evento_falla||r.tipo_falla||'').slice(0,140)}</small></div>})}
  {keys.length>60&&<p>Mostrando 60 de {keys.length} códigos. Afina la búsqueda.</p>}
  {q&&!keys.length&&<p>Sin resultados documentados para esta búsqueda.</p>}</>}
export default function Dtc(){
 const [q,setQ]=useState(''),[mod,setMod]=useState(''),[mods,setMods]=useState([]),[r,setR]=useState({rows:[],src:''})
 useEffect(()=>{localAll('dtc').then(l=>setMods([...new Set(l.map(x=>x.modulo))].sort()))},[])
 useEffect(()=>{const t=setTimeout(async()=>setR(await consultar(q,['dtc','modulo','componente','evento_falla','tipo_falla'],mod)),250);return()=>clearTimeout(t)},[q,mod])
 return <><h1>Buscar DTC</h1>
  <input autoFocus placeholder="Código DTC (ej. C100001), módulo, componente o texto" value={q} onChange={e=>setQ(e.target.value)}/>
  {mods.length>0&&<select value={mod} onChange={e=>setMod(e.target.value)}><option value="">Todos los módulos</option>{mods.map(m=><option key={m}>{m}</option>)}</select>}
  <small>{r.src&&'Fuente: '+r.src}</small><Resultados rows={r.rows} q={q}/></>}
