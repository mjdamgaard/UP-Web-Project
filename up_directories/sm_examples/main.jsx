
import {fetch, fetchPrivate} from 'query';


export function render() {
  let {response, text} = this.state;
  return <div>
    <h2>Click to fetch private file</h2>
    <p>
      Click this button to fetch and display the contents of the private file
      located at ~/server/_prv_file.txt.
    </p>
    <button onClick={() => this.do("fetchFile")}>
      Click me!
    </button>
    <div className="response-display">
      {response}
    </div>
    <div className={"text-display" + (text ? "" : " hidden")}>
      <h3>File contents</h3>
      <div>{text}</div>
    </div>
  </div>;
}


export const actions = {
  "fetchFile": async function() {
    let {userID} = this.props;
    let text;
    try {
      // If the user is logged in, use fetchPrivate() to try to fetch the file,
      // and if not, try to fetch the file anyway, and just catch the expected
      // error.
      if (userID) {
        text = await fetchPrivate("./server/_prv_file.txt");
      }
      else {
        text = await fetch("./server/_prv_file.txt");
      }
      this.setState(state => ({...state, text: text, response: undefined}));
    }
    catch (err) {
      console.error(err);
      this.setState(state => ({
        ...state, text: undefined,
        response: "Did not have permission to read the file.",
      }));
    }
  }
};