
import {post, fetch, fetchPrivate} from 'query';
import {getRequestingUserID, checkRequestOrigin, checkAdminPrivileges} from
  'request';
import {getConnection} from 'connection';
import {verifyType} from 'type';
import {stringify} from 'json';
import {postEntity} from "../../../../semantic_entities/entities.js";


export async function submitAppCategory(nameAndDescriptionArr) {
  verifyTypes(nameAndDescriptionArr, ["string", "string"]);
  checkRequestOrigin(true, [
    abs("~/main.jsx"),
  ]);

  let userID = getRequestingUserID();
  let jsonData = stringify(nameAndDescriptionArr);

  let conn = await getConnection(10000, true, "cat");
  let options = {connection: conn};
  let id = await post(abs("./appCatData.att/_insert"), jsonData, options);
  await post(abs("./_appCatAuthors.bt/_insert/k/" + id), userID, options);
  await conn.end();

  let entPath = abs("../em.js;call/AppCat/" + id);
  let entID = await postEntity(entPath);
  return [entID, entPath];
}




export async function submitReport(text) {
  let userID = getRequestingUserID();
  verifyType(text, "string");
  checkRequestOrigin(true, [
    abs("~/main.jsx"),
  ]);

  let userID = getRequestingUserID();
  let jsonData = stringify([text, userID]);
  await post(abs("./_reports.att/_insert"), jsonData, options);
}


export async function fetchReports(maxNum = 1) {
  checkAdminPrivileges();
  return await fetchPrivate(abs("./_reports.att/list/n/" + maxNum));
}

export async function deleteReports(maxID) {
  checkAdminPrivileges();
  return await post(abs("./_reports.att/_deleteList/hi/" + maxID));
}

export async function deleteReport(id) {
  checkAdminPrivileges();
  return await post(abs("./_reports.att/_deleteEntry/k/" + id));
}


// (Before signing off as an admin, one should generally make sure to hand over
// admin privileges to a user group that one trusts (and whom the users of the
// app trusts). A procedure for doing this has yet to be implemented, but it
// involves creating an SMF where the members of the administrating user group
// can upload an vote on edit suggestions, which take the form of a route to a
// function, which if voted through, will be called with admin privileges,
// making it able to do anything, including editing the source code (including
// even the source code of said SMF, meaning that the user group can also hand
// over the privileges to a successor user group whenever they want). So if we
// for instance look at the report SMFs above, which currently only allow the
// admin of the directory to read and delete them, these will first of all
// likely be edited before the creator signs off as an admin. And in any case,
// the user group that is handed the admin privileges (in the procedure just
// describes) will be able to continue to edit them.
