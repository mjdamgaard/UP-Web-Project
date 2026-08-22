
import {getHomeDirID} from 'route';
const homeDirID = getHomeDirID();

export const description = <div>
  <h2>Untrusted app example</h2>
  <p>
    This app is an example of an app that has not been declared as trusted by
    the community. And since it is meant to serve as an example for showcasing
    how the such apps are rendered, in particular in terms of the warning
    displayed, it is meant to stay that way, even though the app is completely
    harmless. (Of course, a harmful app might claim this as well.) 
  </p>
  <p>
    For all other apps, the community will at some point have reviewed the app,
    and will then change its status from "untrusted" to either "trusted" or
    "semi-trusted," or "harmful" if it is either purposely or unintentionally
    harmful to its users.
  </p>
  <p>
    Note that due to the sandbox that encapsulates each app, the apps cannot
    hack the users' browser directly, or redirect the users directly to any
    malicious sites. However, the sandbox alone cannot guard against phishing
    attempts, or against trying to trick the users in other ways. And this
    is why we warn the users whenever they go to view an app that has not yet
    been declared as trusted, and prevent them from accessing apps that have
    been declared as harmful.
  </p>
  <p>
    So whenever you see a warning about an app being untrusted, like the one
    you see for this example app, know that the app cannot hack you directly,
    but be on guard for phishing attempts, etc.
  </p>
  <p>
    If you come across an app that any kind of malicious content, please report
    it. You can do so from the app's page in the app browser.
  </p>
</div>;


export default {
  "Name": "Untrusted app example",
  "Is ready for use": true,
  "apiDefiningAppDirID": homeDirID,
  "Description": description,
};