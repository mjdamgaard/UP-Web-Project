
import {getHomeDirID} from 'route';
const fileBrowserDirID = getHomeDirID();

export default {
  "Name": "File browser",
  "Is ready for use": true,
  "apiDefiningAppDirID": fileBrowserDirID,
  "Description": <div>
    <h2>File browser</h2>
    <p>
      A file browser is used to browse the files that have been uploaded to the
      server(s). It can be used in particular to view the source code of the
      apps that are available in the network.
    </p>
    {/* TODO: Add section about the API. */}
  </div>,
};