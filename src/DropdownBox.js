import {useState, useEffect, useMemo, useContext} from "react";



export const DropdownBox = ({children, startAsExpanded}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExpanded, setIsExpanded] = useState(startAsExpanded);
  
  if(!isLoaded && isExpanded) {
    setIsLoaded(true);
  }

  if (!isLoaded) {
    return (
      <div className="dropdown-box">
        <div style={{display: "none"}}></div>
        <DropdownButtonBar
          isExpanded={isExpanded} setIsExpanded={setIsExpanded}
        />
      </div>
    );
  }

  if (!isExpanded) {
    return (
      <div className="dropdown-box">
        <div style={{display: "none"}}>
          {children}
        </div>
        <DropdownButtonBar
          isExpanded={isExpanded} setIsExpanded={setIsExpanded}
        />
      </div>
    );
  }

  return (
    <div className="dropdown-box">
      <div>
        {children}
      </div>
      <DropdownButtonBar
        isExpanded={isExpanded} setIsExpanded={setIsExpanded}
      />
    </div>
  );
};

export const DropdownButtonBar = ({isExpanded, setIsExpanded}) => {
  return (
    <div className="dropdown-button-bar" onClick={() => {
      setIsExpanded(prev => !prev);
    }}>
      <span className="dropdown-button">
        <span className={isExpanded ? "caret caret-up dropup" : "caret"}></span>
      </span>
    </div>
  );
};




export const DropdownMenu = ({title, children, startAsExpanded}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExpanded, setIsExpanded] = useState(startAsExpanded);
  
  if(!isLoaded && isExpanded) {
    setIsLoaded(true);
  }

  if (!isLoaded) {
    return (
      <div>
        <h4 className="dropdown-menu-title clickable" onClick={() => {
          setIsExpanded(prev => !prev);
        }}>
          <span className="dropdown-button">
            <span className="caret"></span>{' '}
            {title}
          </span>
        </h4>
        <div style={{display: "none"}}></div>
      </div>
    );
  }

  if (!isExpanded) {
    return (
      <div>
        <h4 className="dropdown-menu-title clickable" onClick={() => {
          setIsExpanded(prev => !prev);
        }}>
          <span className="dropdown-button">
            <span className="caret"></span>{' '}
            {title}
          </span>
        </h4>
        <div style={{display: "none"}}>{children}</div>
      </div>
    );
  }

  return (
    <div>
      <h4 className="dropdown-menu-title clickable" onClick={() => {
        setIsExpanded(prev => !prev);
      }}>
        <span className="dropdown-button">
          <span className="caret caret-up dropup"></span>{' '}
          {title}
        </span>
      </h4>
      <div>{children}</div>
    </div>
  );
};
