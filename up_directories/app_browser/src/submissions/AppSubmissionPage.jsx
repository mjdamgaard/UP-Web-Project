
import {hasType} from 'type';
import {fetchEntityID} from "../../../semantic_entities/entities.js";
import * as InputText from 'InputText';
import * as Label from 'Label';


export function render() {
  let {response} = this.state;
  let inputKey = Symbol("app-dir-id");

  return <div>
    <h2>Submit app</h2>
    <div>
      Insert the ID of the home directory that defines the app.
    </div>
    <div className="form-group">
      <Label key="l" forKey={inputKey}>App directory ID</Label>
      <InputText key="i" idKey={inputKey} />
    </div>
    <button onClick={() => this.do("submit")}>Submit</button>
    <div className="response-display">{(response)}</div>
  </div>
}

export const actions = {
  "submit": async function() {
    let {objID, relKey} = this.props;
    if (!this.getContext("userID")) {
      return this.setState({response: <span className="text-warning">
        You must be logged in to submit an app.
      </span>});
    }

    let appDirID = this.call("i", "getValue").trim();
    if (!appDirID) {
      return this.setState({response: <span className="text-warning">
        Insert app directory ID in the field before submitting.
      </span>});
    }
    if (!hasType(appDirID, "hex")) {
      return this.setState({response: <span className="text-warning">
        App directory ID must be a hexadecimal string.
      </span>});
    }
    let [mainRenderFun, metadata] = Promise.all([
      import("~/../" + appDirID + "/main.jsx;get/render"),
      import("~/../" + appDirID + "/metadata.js;get/default"),
    ]).catch(err => {
      console.error(err);
      return [];
    });
    if (!mainRenderFun) {
      return this.setState({response: <span className="text-warning">
        Something went wrong when fetching
        {abs("~/../" + appDirID + "/main.jsx;get/render")}.
      </span>});
    }
    if (!metadata) {
      return this.setState({response: <span className="text-warning">
        Something went wrong when fetching
        {abs("~/../" + appDirID + "/metadata.js;get/default")}.
      </span>});
    }
    if (!metadata["Name"]) {
      return this.setState({response: <span className="text-warning">
        This app's metadata is missing a "Name" property.
      </span>});
    }
    if (!metadata["Is ready for use"]) {
      return this.setState({response: <span className="text-warning">
        This app's metadata has a falsy "Is ready for use" property.
      </span>});
    }
    if (!metadata["Description"]) {
      return this.setState({response: <span className="text-warning">
        This app's metadata is missing a "Description" property.
      </span>});
    }

    // If these checks succeeded, submit the app to the list, and give it an
    // up rate as well by default.
    let relID = await fetchEntityID(relKey);
    await post(abs(
      "~/../home_app/server/rates/rates.sm.js/callSMF/updateUpOrDownRate/" +
      objID + "/" + relID + "/" + subjID + "/1"
    ));
    return this.setState({response: <span className="text-success">
      App was successfully submitted.
    </span>});
  },
};