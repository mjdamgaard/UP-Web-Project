
import * as TextArea from 'TextArea';
import * as Label from 'Label';


export function render() {
  let {response, hasSubmitted} = this.state;
  let textKey = Symbol("text");

  return <div>
    <h2>Report this entity</h2>
    <div>
      Write a concise report of the problem with this entity.
    </div>
    <div className="form-group">
      <Label key="l" forKey={textKey}>Report</Label>
      <TextArea key="i" idKey={textKey} />
    </div>
    <button onClick={() => !hasSubmitted && this.do("submit")}>Submit</button>
    <div className="response-display">{(response)}</div>
  </div>
}

export const actions = {
  "submit": async function() {
    let {entID} = this.props;
    if (!this.getContext("userID")) {
      return this.setState({response: <span className="text-warning">
        You must be logged in to submit an app.
      </span>});
    }

    let text = this.call("i", "getValue").trim();
    if (!text) {
      return this.setState({response: <span className="text-warning">
        Write a report text before submitting.
      </span>});
    }

    await post(
      abs("./server/submissions.sm.js/callSMF/submitReport"), text
    );
    return this.setState({
      response: <span className="text-success">
        Report was successfully submitted.
      </span>,
      hasSubmitted: true,
    });
  },
};