
import {post, fetch, fetchPrivate} from 'query';
import {getRequestingUserID, checkRequestOrigin} from 'request';
import {verifyType, verifyTypes} from 'type';
import {indexOf, substring} from 'string';
import {map} from 'array';




// postMessage() is a server module function (SMF) for posting a new message.
export async function postMessage(text) {
  // Check that the post request was sent from the ../main.jsx app component,
  // but allow the client's settings to potentially override this check (by
  // passing true as the the first argument of checkRequestOrigin()).
  checkRequestOrigin(true, [
    abs("../main.jsx"),
  ]);

  // Get the ID of the requesting user, i.e. the author of the message.
  let authorID = getRequestingUserID();

  // Store the authorID simply by prepending it to the stored text.
  let storedText = authorID + ";" + text;

  // Insert the massage in the messages.att table. 
  return await post(
    abs("./messages.att./_insert"),
    storedText
  );
}



// deleteMessage() is an SMF for deleting a message.
export async function deleteMessage(messageID) {
  verifyType(messageID, "hex-string");

  // Check that the post request was sent from the ../main.jsx app component,
  // but allow the client's settings to potentially override this check (by
  // passing true as the the first argument of checkRequestOrigin()).
  checkRequestOrigin(true, [
    abs("../main.jsx"),
  ]);

  // Get the ID of the requesting user.
  let userID = getRequestingUserID();

  // Fetch the message in order to authenticate the user as the author.
  let storedText = await fetch(
    abs("./messages.att./entry/k/" + messageID)
  );
  let indOfSemicolon = indexOf(storedText, ";");
  let authorID = substring(0, indOfSemicolon);

  // Authenticate.
  if (userID !== authorID) {
    throw "User " + userID + " was not authenticated as User " + authorID;
  }

  // Delete the massage. 
  return await post(
    abs("./messages.att./_deleteEntry/k/" + messageID)
  );
}




// fetchMessages() is an SMF for fetching a list of messages, returning an
// array with entries of the form [messageID, text, authorID].
export async function fetchMessages(maxNum = 1000, offset = 0) {
  verifyTypes([maxNum, offset], ["integer unsigned", "integer unsigned"]);

  // Check that the post request was sent from the ../main.jsx app component,
  // but allow the client's settings to potentially override this check (by
  // passing true as the the first argument of checkRequestOrigin()).
  checkRequestOrigin(true, [
    abs("../main.jsx"),
  ]);

  // Fetch the list of messages.
  let list = await fetch(
    abs("./messages.att./list/n/" + maxNum + "/o/" + offset)
  );

  // Return a transformed list where the entries are of the form
  // [messageID, text, authorID].
  return map(list, ([messageID, storedText]) => {
    let indOfSemicolon = indexOf(storedText, ";");
    let authorID = substring(0, indOfSemicolon);
    let text = substring(indOfSemicolon + 1);
    return [messageID, text, authorID];
  });
}
