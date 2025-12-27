


export function initialize({startOpen}) {
  return {isOpen: startOpen ? true : false};
}

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


export const actions = {
  "call": function([key, input]) {
    return this.call(key, input);
  }
};

export const methods = [
  "call",
];


export const styleSheets = [
  abs("./DropDownBox.css"),
];