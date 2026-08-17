
import {getHomeDirID} from 'route';
import * as ILink from 'ILink';

import placeholders from "~/placeholders.js";
const {this: {
  nodeID,
  directories: {
    "app_browser": appBrowserDirID,
    "flip_game": flipGameDirID,
  },
}} = placeholders;

const homeDirID = getHomeDirID();
const flipGamePath = abs("~/../semantic_entities/em3.js;call/App") + "/" +
  nodeID + "/" + flipGameDirID;

export default {
  "Name": "Flip game - more game modes",
  "Is ready for use": true,
  "apiDefiningAppDirID": homeDirID,
  "Description": <div>
    <h2>Flip game - more game modes</h2>
    <h3>Summary</h3>
    <p>
      This app is an extension of the
      <ILink key="parent-link" href={
        `/${appBrowserDirID}/apps/app/path${flipGamePath}`
      }>
        Flip game app
      </ILink>.
      It introduces more game modes, namely by allowing you to select a row
      and column number yourself. It also records the number of moves, and
      shows when you have won the game.
    </p>
    <h3>Additional notes</h3>
    <p>
      This app is an early proof-of-concept app. It is worth noting that there
      is no established convention for naming new versions of existing apps at
      the moment of writing.
      So naming apps like "Flip game - more game modes" might not end up being
      the convention that we want to go.
    </p>
  </div>,
};