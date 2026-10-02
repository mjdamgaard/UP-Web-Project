
import {fetchPrivate} from 'query';
import {getRequestingUserID} from 'request';

export async function readFile() {
  let userID = getRequestingUserID();
  if (userID == "INSERT_YOUR_USER_ID_HERE") {
    let text = await fetchPrivate("./_prv_file.txt");
    return {text: text};
  } else {
    return {error: "You do not have permission to read this file."};
  }
}