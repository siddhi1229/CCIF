import api from "./api";
import { suspects as fallbackSuspects } from "../data/mockData.js";

export async function getSuspects() {

 try {

   const response = await api.get("/suspects");

   return response.data;

 } catch(error){

   console.log(error);

   return fallbackSuspects;

 }

}
