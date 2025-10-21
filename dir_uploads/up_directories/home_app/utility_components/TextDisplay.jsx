
import {fetch} from 'query';


export function render({jsxElement = undefined, jsxLink = undefined}) {
  if (jsxElement) {
    return <div className="text-display">
      {jsxElement}
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
    this.setState(getInitialState(this.props));
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

  return <div className="text-display">
    {content}
  </div>;
}


export function getInitialState({jsxLink}) {
  return {curJSXLink: jsxLink};
}



export const styleSheetPaths = [
  abs("./TextDisplay.css"),
];