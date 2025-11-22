

export function render(props) {
  let {children, ExpandedComponent} = props;
  let {isOpen, isLoaded} = this.state;
  return <div className="expandable-element">
    <div
      className={
        "collapse-expand-button " + (isOpen ? "expanded" : "collapsed")
      }
      onClick={() => {
        this.setState(state => ({...state, isOpen: !isOpen, isLoaded: true}));
      }}
    ></div>
    <div className="content">
      <div className={"initial-content" + (isOpen ? " hidden" : "")}>{
        children
      }</div>
      <div className={"expanded-content" + (isOpen ? "" : " hidden")}>{
        isLoaded ? <ExpandedComponent {...props} key="expanded" /> : undefined
      }</div>
    </div>
  </div>;
}


export function getInitialState({startOpen}) {
  return {isOpen: startOpen ? true : false};
}



export const styleSheetPaths = [
  abs("../style.css"),
  abs("./ExpandableElement.css"),
];