
import {fetchEntityID} from "../../../semantic_entities/entities.js";
import * as InputText from 'InputText';
import * as TextArea from 'TextArea';
import * as Label from 'Label';


export function render() {
  let {response, hasSubmitted} = this.state;
  let nameKey = Symbol("name");
  let descKey = Symbol("description");

  return <div>
    <h2>Submit app category</h2>
    <div>
      Insert the name and description of the app category.
    </div>
    <div className="form-group">
      <Label key="l-name" forKey={nameKey}>Name</Label>
      <InputText key="i-name" idKey={nameKey} />
    </div>
    <div className="form-group">
      <Label key="l-desc" forKey={descKey}>Description</Label>
      <TextArea key="i-desc" idKey={descKey} />
    </div>
    <button onClick={() => !hasSubmitted && this.do("submit")}>Submit</button>
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

    let name = this.call("i-name", "getValue").trim();
    let desc = this.call("i-desc", "getValue").trim();
    if (!name || !desc) {
      return this.setState({response: <span className="text-warning">
        Insert name and description before submitting.
      </span>});
    }

    let relIDProm = fetchEntityID(relKey);
    let [catID] = await post(
      abs("./server/submissions.sm.js/callSMF/submitAppCategory"),
      [name, desc]
    );
    let relID = await relIDProm;
    await post(abs(
      "~/../base_app/server/rates/rates.sm.js/callSMF/updateUpOrDownRate/" +
      objID + "/" + relID + "/" + catID + "/1"
    ));
    return this.setState({
      response: <span className="text-success">
        App category was successfully submitted.
      </span>,
      hasSubmitted: true,
    });
  },
};