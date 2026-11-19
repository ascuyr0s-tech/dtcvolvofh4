import {useState} from 'react'
import {supabase} from '../lib/supabase'
export default function Login(){
 const [e,setE]=useState(''),[p,setP]=useState(''),[m,setM]=useState('')
 const go=async()=>{const {error}=await supabase.auth.signInWithPassword({email:e,password:p});if(error)setM('Correo o contraseña incorrectos')}
 return <main><h1>VOLVO DTC DIAGNOSTIC</h1><div className="card">
  <input type="email" placeholder="Correo" value={e} onChange={x=>setE(x.target.value)}/>
  <input type="password" placeholder="Contraseña" value={p} onChange={x=>setP(x.target.value)}/>
  <button onClick={go}>Ingresar</button><p className="err">{m}</p></div></main>}
