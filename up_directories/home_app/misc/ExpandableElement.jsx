

export function render(props) {
  let {children, ExpandedComponent, expCompProps = {}} = props;
  let {isOpen, isLoaded} = this.state;
  return <div className="expandable-element">
    <div
      className={
        "collapse-expand-button " + (isOpen ? "expanded" : "collapsed")
      }
      onClick={() => this.do("toggle")}
    ><span className="symbol"></span></div>
    <div className="content">
      <div className={"initial-content" + (isOpen ? " hidden" : "")}>{
        children
      }</div>
      <div className={"expanded-content" + (isOpen ? "" : " hidden")}>{
        isLoaded ? <ExpandedComponent {...expCompProps} key="expanded" /> :
          undefined
      }</div>
    </div>
  </div>;
}


export function getInitialState({startOpen}) {
  return {isOpen: startOpen ? true : false};
}


export const events = [
  "expand",
  "collapse",
  "toggle",
];

export const methods = events;

export const actions = {
  "expand": function() {
    this.setState(state => ({...state, isOpen: true, isLoaded: true}));
  },
  "collapse": function() {
    this.setState(state => ({...state, isOpen: false}));
  },
  "toggle": function() {
    let {isOpen} = this.state;
    this.setState(state => ({...state, isOpen: !isOpen, isLoaded: true}));
  },
};


export const styleSheetPaths = [
  abs("../style.css"),
  abs("./ExpandableElement.css"),
];