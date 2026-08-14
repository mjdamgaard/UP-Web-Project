
import placeholders from "./placeholders.js";

const {this: {
  directories: {
    "base_app": baseAppDirID,
  },
}} = placeholders;

export default {
  "Name": "Base app v1.02",
  "Is ready for use": true,
  "apiDefiningAppDirID": baseAppDirID,
  "Description": <div>
    <h2>Base app v1.02</h2>
    <p>
      This is an example app that extends the original ("root") base app
      simply by redefining the style of the header and the margins. Its only
      purpose is to showcase how apps can be extended, and in particular by
      just restyling them.
    </p>
    <p>
      Note also that although we have here chosen the name "Base app v1.02" for
      this example app, there is no fixed convention in place yet about how to
      name new versions of existing apps. 
    </p>
  </div>,
};