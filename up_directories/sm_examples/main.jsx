
import {fetchPrivate} from 'query';


export function render() {
  let {error, text} = this.state;
  return <div>
    <h2>Click to fetch private file</h2>
    <p>
      Click this button to fetch and display the contents of the private file
      located at ~/server/_prv_file.txt.
    </p>
    <p>
      <button onClick={() => this.do("fetchFile")}>
        Click me!
      </button>
    </p>
    <div className="error-display text-warning">
      {error}
    </div>
    <div className={"contents-display" + (text ? "" : " hidden")}>
      <h3>File contents</h3>
      <div>{text}</div>
    </div>
  </div>;
}


export const actions = {
  "fetchFile": async function() {
    let userID = this.getContext("userID");

    // If the user is not logged in, fail immediately.
    if (!userID) {
      this.setState(state => ({
        ...state, text: undefined,
        error: "You must be logged in in order to fetch private file.",
      }));
      return;
    }

    // Else query the readFile() SMF in ./server/example.sm.js, and display
    // the result.
    let {text, error} = await fetchPrivate(
      "./server/example.sm.js/callSMF/readFile"
    );
    this.setState(state => ({...state, text: text, error: error}));
  }
};