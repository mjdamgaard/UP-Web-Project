
import {fetch} from 'query';
import {hexToValue} from 'hex';
import {verifyType} from 'type';



export function fetchUserTag(userID) {
  verifyType(userID, "hex-string");
  return new Promise(resolve => {
    fetch(
      "./tags.bt/entry/k/" + userID
    ).then(userTagHex => {
      let userTag = userTagHex ?
        hexToValue(userTagHex, "string") : undefined;
      resolve(userTag);
    });
  });
}

export function fetchUserID(userTagHex) {
  return new Promise(resolve => {
    fetch(
      "./ids.ct/entry/k/" + userTagHex
    ).then(
      userID => resolve(userID)
    );
  });
}


// A function to fetch user's bio.
export function fetchUserBio(userID) {
  verifyType(userID, "hex-string");
  return new Promise(resolve => {
    fetch(
      "./bios.att/entry/k/" + userID
    ).then(
      bioText => resolve(bioText)
    );
  });
}