
import {post} from 'query';
import {getRequestingUserID, checkRequestOrigin} from 'request';
import {substring, indexOf} from 'string';
import {verifyType} from 'type';
import {stringify} from 'json';
import {
  fetchEntityDefinition, fetchEntityPath, getUserEntPath, postEntity,
} from "../entities.js";

const commentPathPrefix = abs("./comments.att") + "./entry/k/";



export function postComment(
  text, targetEntKey, isSingular = false, returnID = false,
) {
  checkRequestOrigin(true, [
    "/1/2/entity_lists/AddEntityMenu.jsx",
  ]);
  verifyType(text, "string");
  let authorID = getRequestingUserID();
  return new Promise(resolve => {
    // Construct the new comment entity definition and insert it in the
    // comments.att table.
    let newCommentEMSource =
      'import {fetchEntityID} from "/1/1/entities.js";\n' +
      'export const comment = {\n' +
      '  "Class": "/1/1/em1.js;get/commentClass",\n' +
      '  "Name": () => new Promise(resolve => {\n' +
      '    fetchEntityID(abs("./;get/comment")).then(\n' +
      '      entID => resolve("Comment " + entID)\n' +
      '    );\n' +
      '  }),\n' +
      '  "Author": ' + stringify(getUserEntPath("1", authorID)) + ",\n" +
      '  "Target entity": ' +
            (targetEntKey ? stringify(targetEntKey) : "undefined") + ",\n" +
      '  "Content": ' + stringify(text) + ",\n" +
      '  "Is a singular statement": ' +
            (isSingular ? "true" : "false") + ",\n" +
      "};";
    post(
      abs("./comments.att") + "./_insert", newCommentEMSource
    ).then(textID => {
      let newEntPath = commentPathPrefix + textID + ";.js;get/comment";
      postEntity(newEntPath).then(
        newEntID => resolve(returnID ? newEntID : newEntPath)
      );
    });
  });
}


export function editComment(commentEntKey, text, targetEntKey = undefined) {
  checkRequestOrigin(true, [
    "/1/2/... TODO: Insert a path to a component for editing comments",
  ]);
  verifyType(text, "string");
  let authorID = getRequestingUserID();
  return new Promise(resolve => {
    fetchEntityPath(commentEntKey).then(commentEntPath => {
      // Extract the textID from commentEntPath and validate the latter.
      let textID = substring(
        commentEntPath, commentPathPrefix.length, indexOf(commentEntPath, ";")
      );
      verifyType(textID, "hex-string");
      if (commentEntPath !== commentPathPrefix + textID + ";.js;get/comment") {
        throw "Invalid comment entity path: " + commentEntPath;
      }

      fetchEntityDefinition(commentEntPath, false).then(commentDef => {
        // Authenticate the requesting user as the author.
        let authorPath = commentDef["Author"];
        if (authorPath !== getUserEntPath("1", authorID)) {
          throw "User is not permitted to edit this comment";
        }

        // If targetEntKey is undefined, do not overwrite the existing "Target
        // entity" property, but if it is otherwise falsy, set it to undefined.
        if (targetEntKey === undefined) {
          targetEntKey = commentDef["Target entity"];
        }
        else if (!targetEntKey) {
          targetEntKey === undefined;
        }

        // Then construct the new comment entity definition and insert it in
        // the comments.att table, using textID as the entry key.
        let newCommentDef = {
          "Class": "/1/1/em1.js;get/commentClass",
          "Author": authorPath,
          "Target entity": targetEntKey,
          "Content": text,
        };
        let newCommentEMSource = 'export const comment = ' +
          stringify(newCommentDef) +
          ';';
        post(
          abs("./comments.att") + "./_insertEntry/k/" + textID,
          newCommentEMSource
        ).then(
          wasUpdated => resolve(!!wasUpdated)
        );
      });
    });
  });
}