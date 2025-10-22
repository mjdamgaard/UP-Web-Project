



export function fetchIsFriendOrSelf(friendUserID) {
  return new Promise(resolve => {
    let reqUserID = getRequestingUserID();
    if (!reqUserID) return resolve(false);
    if (friendUserID === reqUserID) return resolve(true);

    // TODO: Implement, instead of this placeholder:
    resolve(true);
  });

}