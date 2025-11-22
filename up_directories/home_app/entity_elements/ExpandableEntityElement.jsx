
import * as EntityPage from "../variable_components/EntityPage.jsx";



export function render({children, ExpandedComponent = EntityPage}) {
  let {isOpen, isLoaded} = this.state;
  let contentDiv = <div className="content">{children}</div>;
  if (isOpen) {
    return <div className="expandable-element">
      <div className="content">{children}</div>
      <div className="collapse-expand-button expanded" onClick={() => {
        this.setState(state => ({...state, isOpen: false, isLoaded: true}));
      }}></div>
    </div>;
  } else {
    return <div className="expandable-element">
      <div className="content collapsed">
        {keepAlive && isLoaded ? children : undefined}
      </div>
      <div className="collapse-expand-button collapsed" onClick={() => {
        this.setState(state => ({...state, isOpen: true}));
      }}></div>
    </div>;
  }
}


export function getInitialState({startOpen}) {
  return {isOpen: startOpen ? true : false};
}



export const styleSheetPaths = [
  abs("./DropDownBox.css"),
];