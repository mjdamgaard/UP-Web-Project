
import {getHomeDirID} from 'route';
const appBrowserDirID = getHomeDirID();

export default {
  "Name": "App browser",
  "Is ready for use": true,
  "apiDefiningAppDirID": appBrowserDirID,
  "Description": <div>
    <h2>App browser</h2>
    <p>
      An app browser is used to browse and choose between the selection of apps
      that have been uploaded to the network.
    </p>
    {/* TODO: Add section about the API. */}
  </div>,
};