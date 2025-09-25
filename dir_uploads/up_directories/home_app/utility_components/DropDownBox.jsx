



export function render({children, keepAlive}) {
  let {isOpen, isLoaded} = this.state;
  if (isOpen) {
    return <div className="drop-down-box">
      <div className="content">{children}</div>
      <div className="collapse-expand-button expanded" onClick={() => {
        this.setState({...this.state, isOpen: false, isLoaded: true});
      }}></div>
    </div>;
  } else {
    return <div className="drop-down-box">
      <div className="content collapsed">
        {keepAlive && isLoaded ? children : undefined}
      </div>
      <div className="collapse-expand-button collapsed" onClick={() => {
        this.setState({...this.state, isOpen: true});
      }}></div>
    </div>;
  }
}


export function getInitState({isOpenInitially}) {
  return {isOpen: isOpenInitially ? true : false};
}
