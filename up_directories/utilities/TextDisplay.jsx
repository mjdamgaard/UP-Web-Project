
import {fetch} from 'query';

import * as textDisplayStyle from "./TextDisplay.css";
import * as mainStyle from "../root_app/style.css";


export function render({
  children = undefined, jsxElement = children, jsxLink = undefined
}) {
  if (jsxElement) {
    return <div innerStyle={[mainStyle, textDisplayStyle]}>
        <div className="text-display">
        {(jsxElement)}
      </div>
    </div>;
  }
  else if (!jsxLink) {
    throw "No JSX element or link provided";
  }
  
  let curJSXLink;
  ({jsxElement, curJSXLink} = this.state);
  let content;

  // If jsxLink changes reset the state.
  if (jsxLink !== curJSXLink) {
    this.setState(initialize(this.props));
  }

  // If jsxElement has not already been fetched, do so.
  if (jsxElement === undefined) {
    fetch(jsxLink).then(jsxElement => {
      this.setState(state => ({...state, jsxElement: jsxElement ?? false}));
    });
    content = <div className="fetching">{"..."}</div>;
  }
  else if (!jsxElement) {
    content = <div className="missing">{"missing"}</div>;
  }
  else {
    content = jsxElement;
  }

  return <div innerStyle={[mainStyle, textDisplayStyle]}>
    <div className="text-display">
      {(content)}
    </div>
  </div>;
}


export function initialize({jsxLink}) {
  return {curJSXLink: jsxLink};
}

