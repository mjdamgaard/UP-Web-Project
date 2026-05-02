
import {post, fetch, fetchPrivate} from 'query';
import {getRequestingUserID, checkRequestOrigin} from 'request';
import {verifyTypes} from 'type';
import {parseInt} from 'number';
import {indexOf, substring} from 'string';
import {map} from 'array';




// postMessage() is a server module function (SMF) for posting a new message.
export async function postMessage(text) {
  // Check that the post request was sent from the ../main.jsx app component.
  checkRequestOrigin(true, [
    abs("../main.jsx"),
  ]);

  // Get the ID of the requesting user, i.e. the author of the message.
  let authorID = getRequestingUserID();

  // Store the authorID simply by prepending it to the stored text.
  let storedText = authorID + ";" + text;

  // Insert the massage in the _messages.att table.
  return await post(
    abs("./_messages.att./_insert/l/" + authorID),
    storedText
  );
}



// deleteMessage() is an SMF for deleting a message.
export async function deleteMessage(messageID) {
  // Check that the post request was sent from the ../main.jsx app component.
  checkRequestOrigin(true, [
    abs("../main.jsx"),
  ]);

  // Check that messageID is a hexadecimal string.
  verifyTypes([messageID], ["hex-string"]);

  // Get the ID of the requesting user.
  let userID = getRequestingUserID();

  // Fetch the message in order to authenticate the user as the author.
  let storedText = await fetchPrivate(
    abs("./_messages.att./entry/l/" + userID + "/k/" + messageID)
  );
  let indOfSemicolon = indexOf(storedText, ";");
  let authorID = substring(storedText, 0, indOfSemicolon);

  // Authenticate.
  if (userID !== authorID) {
    throw "User " + userID + " was not authenticated as User " + authorID;
  }

  // Delete the massage. 
  return await post(
    abs("./_messages.att./_deleteEntry/l/" + userID + "/k/" + messageID)
  );
}



// editMessage() is an SMF for editing a message.
export async function editMessage(messageID, newText) {
  // Check that the post request was sent from the ../main.jsx app component.
  checkRequestOrigin(true, [
    abs("../main.jsx"),
  ]);

  // Check that messageID is a hexadecimal string.
  verifyTypes([messageID], ["hex-string"]);

  // Get the ID of the requesting user.
  let userID = getRequestingUserID();

  // Fetch the message in order to authenticate the user as the author.
  let storedText = await fetchPrivate(
    abs("./_messages.att./entry/l/" + userID + "/k/" + messageID)
  );
  let indOfSemicolon = indexOf(storedText, ";");
  let authorID = substring(storedText, 0, indOfSemicolon);

  // Authenticate.
  if (userID !== authorID) {
    throw "User " + userID + " was not authenticated as User " + authorID;
  }

  // Create the new stored text, and overwrite the existing massage entry.
  // (The default behavior is to overwrite the existing entry on a duplicate
  // key for such insert queries.)
  let newStoredText = authorID + ";" + newText;
  return await post(
    abs("./_messages.att./_insert/l/" + userID + "/k/" + messageID),
    newStoredText
  );
}



// fetchMessages() is an SMF for fetching a list of messages, returning an
// array with entries of the form [messageID, text, authorID].
export async function fetchMessages(maxNum = "1000", offset = "0") {
  // Check that maxNum and offset are parsed as non-negative integers.
  maxNum = parseInt(maxNum);
  offset = parseInt(offset);
  verifyTypes([maxNum, offset], ["integer unsigned", "integer unsigned"]);

  // Get the ID of the requesting user.
  let userID = getRequestingUserID();

  // Fetch the list of messages.
  let list = await fetchPrivate(abs(
    "./_messages.att./list/l/" + userID + "/a/1/n/" + maxNum + "/o/" + offset
  ));

  // Return a transformed list where the entries are of the form
  // [messageID, text, authorID].
  return map(list, ([messageID, storedText]) => {
    let indOfSemicolon = indexOf(storedText, ";");
    let authorID = substring(storedText, 0, indOfSemicolon);
    let text = substring(storedText, indOfSemicolon + 1);
    return [messageID, text, authorID];
  });
}
