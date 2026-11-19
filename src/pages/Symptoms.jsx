import {useEffect,useState} from 'react'
import {supabase} from '../lib/supabase'
import {Ficha} from './Dtc'
export default function Symptoms(){
 const [l,setL]=useState([]),[res,setRes]=useState(null),[sel,setSel]=useState(null),[n,setN]=useState('')
 useEffect(()=>{supabase.from('symptoms').select('*').order('name').then(({data})=>setL(data||[]))},[])
 const pick=async s=>{setN(s.name);const {data}=await supabase.from('dtc_symptoms').select('dtc_codes(*)').eq('symptom_id',s.id);
  setRes((data||[]).map(x=>x.dtc_codes).filter(Boolean))}
 if(sel)return <><button className="sec" onClick={()=>setSel(null)}>← Volver</button><Ficha d={sel}/></>
 return <><h1>Diagnóstico por síntomas</h1>
  {!res?l.map(s=><button className="sec" key={s.id} onClick={()=>pick(s)}>{s.name}</button>):<>
   <button className="sec" onClick={()=>setRes(null)}>← Otros síntomas</button><h3>{n}</h3>
   <p><small>Los códigos mostrados están <b>relacionados</b> con el síntoma; un síntoma por sí solo no confirma una causa.</small></p>
   {res.length?res.map(d=><div className="card" key={d.id} onClick={()=>setSel(d)}><b>{d.code}</b><p>{d.description}</p></div>):<p>No hay códigos documentados vinculados a este síntoma.</p>}</>}</>}
