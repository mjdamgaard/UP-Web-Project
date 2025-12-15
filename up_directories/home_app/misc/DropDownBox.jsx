



export function render({children, keepAlive = true}) {
  let {isOpen, isLoaded} = this.state;
  if (isOpen) {
    return <div className="drop-down-box">
      <div className="content">{children}</div>
      <div className="collapse-expand-button expanded" onClick={() => {
        this.setState(state => ({...state, isOpen: false, isLoaded: true}));
      }}></div>
    </div>;
  } else {
    return <div className="drop-down-box">
      <div className="content collapsed">
        {keepAlive && isLoaded ? children : undefined}
      </div>
      <div className="collapse-expand-button collapsed" onClick={() => {
        this.setState(state => ({...state, isOpen: true}));
      }}></div>
    </div>;
  }
}


export function initialize({startOpen}) {
  return {isOpen: startOpen ? true : false};
}



export const styleSheets = [
  abs("./DropDownBox.css"),
];