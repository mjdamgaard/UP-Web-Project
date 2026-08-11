
import {fetchPrivate, post} from 'query';


export const keyProps = ["userID", "appDirID", "subAppDirID"];

export async function initialize({userID, appDirID, subAppDirID}) {
  let preferences;
  if (userID && appDirID) {
    preferences = await fetchPrivate(abs(
      "~/../base_app/server/apps/apps.sm.js/callSMF/fetchUserPreferences"
    ));
  }
  preferences ??= {};
  let isFavorite = preferences[appDirID] === subAppDirID;
  this.setState({isFavorite: isFavorite, isPostingRef: new MutableArray()});
}

export function render({userID, appDirID}) {
  let {isFavorite, isPostingRef} = this.state;
  let isActive = userID && appDirID && isFavorite !== undefined;
  let className = "fav-button" + (isActive ? "" : " inactive") +
    (isFavorite ? " pressed" : "");
  return <div className={className}
    onClick={() => isActive && !isPostingRef[0] && this.do("toggle")}
  ></div>;
}


export const actions = {
  "toggle": async function() {
    let {appDirID, subAppDirID} = this.props;
    let {isFavorite} = this.state;
    isPostingRef[0] = true;
    await post(abs(
      "~/../base_app/server/apps/apps.sm.js/callSMF/updateUserPreference/" +
      appDirID + (isFavorite ? "" : "/" + subAppDirID)
    ));
    this.reset();
    isPostingRef[0] = false;
  },
};