import {useEffect,useState} from 'react'
import {Link} from 'react-router-dom'
import {syncDtc,lastSync} from '../lib/offline'
export default function Home(){
 const [l,setL]=useState(''),[m,setM]=useState('')
 useEffect(()=>{lastSync().then(x=>setL(x||''))},[])
 const dl=async()=>{setM('Descargando…');try{const n=await syncDtc();setM(n+' códigos guardados para uso offline');setL(await lastSync())}catch(e){setM('Error: '+e.message)}}
 return <><h1>Inicio</h1>
  <Link to="/dtc"><div className="card big">🔎 BUSCAR CÓDIGO DTC</div></Link>
  <Link to="/sintomas"><div className="card big">🛠️ DIAGNOSTICAR POR SÍNTOMAS</div></Link>
  <div className="card"><button className="sec" onClick={dl}>Descargar datos para uso offline</button>
   <small>Última descarga: {l?new Date(l).toLocaleString():'nunca (requiere Internet)'}</small><p>{m}</p></div></>}
