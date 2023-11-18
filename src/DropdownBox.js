import {useState, useEffect, useMemo, useContext} from "react";



export const DropdownBox = ({children}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
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
