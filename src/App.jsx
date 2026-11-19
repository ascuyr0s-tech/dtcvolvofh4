import {useEffect,useState} from 'react'
import {Routes,Route,NavLink,Navigate} from 'react-router-dom'
import {supabase} from './lib/supabase'
import {flush,pending} from './lib/offline'
import Login from './pages/Login'
import Home from './pages/Home'
import Dtc from './pages/Dtc'
import Symptoms from './pages/Symptoms'
import Repairs from './pages/Repairs'
import Admin from './pages/Admin'
export default function App(){
 const [s,setS]=useState(undefined),[prof,setProf]=useState(null),[on,setOn]=useState(navigator.onLine),[pend,setPend]=useState(0)
 useEffect(()=>{supabase.auth.getSession().then(({data})=>setS(data.session));
  const {data:l}=supabase.auth.onAuthStateChange((_,x)=>setS(x));return()=>l.subscription.unsubscribe()},[])
 useEffect(()=>{if(!s){setProf(null);return}
  supabase.from('profiles').select('*').eq('id',s.user.id).single().then(({data})=>{
   if(data&&!data.active){supabase.auth.signOut();alert('Usuario desactivado')}else setProf(data)})},[s])
 useEffect(()=>{const u=async()=>{setOn(navigator.onLine);if(navigator.onLine&&s)setPend(await flush())};
  addEventListener('online',u);addEventListener('offline',u);u();pending().then(setPend);
  return()=>{removeEventListener('online',u);removeEventListener('offline',u)}},[s])
 if(s===undefined)return <p>Cargando…</p>
 if(!s)return <Login/>
 const admin=prof?.role==='admin'
 return <>
  <div className={'bar '+(on?'':'off')}><span>{on?'● En línea':'● Sin conexión (offline)'}</span><span>{pend?pend+' pendiente(s) de sincronizar':'Sincronizado'}</span></div>
  <main><Routes>
   <Route path="/" element={<Home/>}/><Route path="/dtc" element={<Dtc/>}/>
   <Route path="/sintomas" element={<Symptoms/>}/><Route path="/historial" element={<Repairs onSaved={()=>pending().then(setPend)}/>}/>
   <Route path="/admin" element={admin?<Admin/>:<Navigate to="/"/>}/><Route path="*" element={<Navigate to="/"/>}/>
  </Routes></main>
  <nav><NavLink to="/">Inicio</NavLink><NavLink to="/dtc">DTC</NavLink><NavLink to="/sintomas">Síntomas</NavLink><NavLink to="/historial">Historial</NavLink>
   {admin&&<NavLink to="/admin">Admin</NavLink>}<a href="#" onClick={e=>{e.preventDefault();supabase.auth.signOut()}}>Salir</a></nav></>}
