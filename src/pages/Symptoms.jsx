import {useEffect,useState} from 'react'
import {consultar,Resultados} from './Dtc'
const SUG=['potencia','arranque','combustible','DPF','AdBlue','cambio','presión de aire','freno','testigo','batería']
export default function Symptoms(){
 const [q,setQ]=useState(''),[r,setR]=useState({rows:[],src:''})
 useEffect(()=>{const t=setTimeout(async()=>setR(await consultar(q,['comportamiento','evento_falla','posibles_causas','componente'],'')),300);return()=>clearTimeout(t)},[q])
 return <><h1>Diagnóstico por síntomas</h1>
  <input placeholder="Describe el síntoma (ej. pérdida de potencia, AdBlue…)" value={q} onChange={e=>setQ(e.target.value)}/>
  <div>{SUG.map(s=><button key={s} className="sec" style={{width:'auto',display:'inline-block',margin:3,padding:'8px 12px',minHeight:0}} onClick={()=>setQ(s)}>{s}</button>)}</div>
  <p><small>Busca en comportamiento funcional, evento de falla, causas y componente. Los resultados son códigos <b>relacionados</b>: un síntoma por sí solo no confirma una causa.</small></p>
  <Resultados rows={r.rows} q={q}/></>}
