
import {fetch} from 'query';
import {verifyType} from 'type';
import {parse} from 'json';
import {AppClass} from "../semantic_entities/em3.js";


export async function AppCat(id) {
  verifyType(id, "hex");
  let jsonData =  await fetch(abs("./server/appCatData.att/entry/k/" + id));
  let nameAndDescriptionArr = parse(jsonData);
  return AppClass(...nameAndDescriptionArr);
}
