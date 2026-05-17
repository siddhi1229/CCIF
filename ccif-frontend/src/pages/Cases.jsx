import { useEffect,useState } from "react";
import { getCases } from "../services/caseService";

export default function Cases(){

const [cases,setCases]=useState([]);

useEffect(()=>{

async function loadCases(){

const data=await getCases();

setCases(data);

}

loadCases();

},[])

return(

<div>

<h1>Cases</h1>

{cases.map(item=>(

<div key={item.id}>

<h2>{item.title}</h2>

<p>{item.location}</p>

<p>{item.status}</p>

</div>

))}

</div>

)

}