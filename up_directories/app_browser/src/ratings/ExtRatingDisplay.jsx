
import {post} from 'query';
import {fetchEntityDefinition} from "../../../semantic_entities/entities.js";
import * as RatingDisplay from "./RatingDisplay.jsx";
import * as FavButton from "./FavButton.jsx";



export function render({entID, entDef, type, objID, relID, ancAppIDs = []}) {
  let userID = this.getContext("userID");
  return <div className="extended-rating-display">
    <RatingDisplay key="r"
      userID={userID} objID={objID} relID={relID} subjID={entID}
    />
    {(type !== "app" || !ancAppIDs[0] ? undefined :
      <FavButton key="f" userID={userID} appDirID={objID}
        subAppDirID={entDef["App directory ID"]}
      />
    )}
  </div>;
}


export const actions = {
  "rating-changed": async function() {
    let {ancAppIDs = []} = this.props;
    // For now we will only go through the first couple of ancAppIDs and
    // call updateBestSubApp() for these.
    let len = ancAppIDs.length;
    for (let i = 0; i < len && i < 3; i++) {
      await updateBestSubApp(ancAppIDs[len - 1 - i]);
    }
  },
};

export const events = [
  "rating-changed",
];



export async function updateBestSubApp(appEntID) {
  let entDef = await fetchEntityDefinition(appEntID);
  let appDirID = entDef["App directory ID"];
  if (appDirID) {
    await post(abs(
      "~/../home_app/server/apps/apps.sm.js/callSMF/updateBestSubApp/" +
      appDirID
    ));
  }
}