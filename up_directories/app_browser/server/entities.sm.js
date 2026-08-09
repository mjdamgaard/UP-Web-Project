
import {post} from 'query';
import {verifyTypes} from 'json';
import {stringify} from 'json';
import {postEntity} from "../../semantic_entities/entities.js";

export async function submitAppCategory(nameAndDescriptionArr) {
  verifyTypes(nameAndDescriptionArr, ["string", "string"]);
  let jsonData = stringify(nameAndDescriptionArr);
  let id = await post(abs("./appCatData.att/_insert"), jsonData);
  let entPath = abs("./em.js;call/AppCat/" + id);
  let entID = await postEntity(entPath)
  return [entID, entPath];
}

