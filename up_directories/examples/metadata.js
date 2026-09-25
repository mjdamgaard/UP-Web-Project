

import {getHomeDirID} from 'route';
const homeDirID = getHomeDirID();


const appName = "Write your app's name here..."

export default {
  "Name": appName,
  "Is ready for use": false,
  "apiDefiningAppDirID": homeDirID,
  "Public repository": "INSERT_URL_TO_PUBLIC_REPOSITORY_HERE",
  "Description": <div>
    <h2>{appName}</h2>
    <p>
      <i>Write the description of your app here...</i>
    </p>
    <h2>Permission to remove directory</h2>
    <p>
      This app is meant for testing purposes only. The creator of this
      app directory gives free permission for the directory and its contents
      to be removed at any point. (Remove this section if you want this app to
      remain online.) 
    </p>
  </div>,
};