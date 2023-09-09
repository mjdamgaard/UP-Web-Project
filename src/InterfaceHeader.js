import {useState, createContext, useContext} from "react";
import {SessionContext, AccountManagerContext}
  from "./contexts/AccountContext.js";
import {ColumnListContext} from "./contexts/ColumnContext.js";



// TODO: There is a style bug with the sign-in etc. buttons when the width of
// the screen gets small enough (they jump down from the bar). I can see that
// it has to do with how BS displays columns as rows instead of there is limited
// space. Fix this bug.

//TODO: Display the username next to the Log Out button when logged in.



export const InterfaceHeader = ({setAppPage, setColNum}) => {
  return (
    <header className="interface-header navbar navbar-default">
    <div className="container-fluid">
      <div className="navbar-header">
        <SuperCoolLogoTBD />
      </div>
      <HeaderButtonsContainer setAppPage={setAppPage} setColNum={setColNum} />
      <AccountButtonsContainer setAppPage={setAppPage} />
    </div>
  </header>
  );
};

const SuperCoolLogoTBD = ({setAppPage, setColNum}) => {
  const [columns, columnListManager] = useContext(ColumnListContext);

  return (
    <span className="navbar-brand" onClick={() => {
      columnListManager.openColumn(columns.keys[columns.fst], 10, true);
    }}>
      openSDB
    </span>
  );
};


const HeaderButtonsContainer = ({setAppPage, setColNum}) => {
  return (
    <ul className="nav navbar-nav">
      <li className="tutorial"
        onClick={() => setAppPage("tutorial")}
        style={localStorage.hasAcceptedStorage ? {} : {
          fontSize: "17pt",
          textShadow: "0px 0px 5px #afa, 0px 0px 13px #3f2",
          // TODO: Try .focus() instead and see if that is better.
        }}
      >
        <a href="#">Tutorial</a>
      </li>
      <li className="minus" onClick={() => setColNum(
        prev => prev <= 0 ? 0 : prev - 1
      )}>
        <a href="#"><span style={{fontSize: "18pt"}}>-</span></a>
      </li>
      <li className="plus" onClick={() => setColNum(
        prev => prev >= 3 ? 3 : prev + 1
      )}>
        <a href="#"><span style={{fontSize: "18pt"}}>+</span></a>
      </li>
      {/* TODO: Add one or a few more. */}
    </ul>
  );
};

const AccountButtonsContainer = ({setAppPage}) => {
  const session = useContext(SessionContext);
  const accountManager = useContext(AccountManagerContext);

  return (
  <ul className="nav navbar-nav navbar-right">
    <li className="log-in"
      onClick={() => setAppPage("login")}
      style={!session || session.expTime > Date.now() ? {} : {display: "none"}} 
    >
      <a href="#">
        <span className="glyphicon glyphicon-log-in"></span> Sing in
      </a>
    </li>
    <li className="new-account"
      onClick={() => setAppPage("signup")}
      style={!session || session.expTime > Date.now() ? {} : {display: "none"}} 
    >
      <a href="#">
        <span className="glyphicon glyphicon-user"></span> Sign up
      </a>
    </li>
    <li className="log-out"
      onClick={() => accountManager.logout()}
      style={!session || session.expTime > Date.now() ? {display: "none"} : {}} 
    >
      <a href="#">
        <span className="glyphicon glyphicon-log-out"></span> Log out
      </a>
    </li>
  </ul>
  );
};
