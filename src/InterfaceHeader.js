
import {useState, createContext, useContext} from "react";

import {SessionContext, AccountManagerContext} from "/src/AccountContext.js";
import {ColumnsContext} from "/src/contexts/ColumnsContext.js";



// TODO: There is a style bug with the sign-in etc. buttons when the width of
// the screen gets small enough (they jump down from the bar). I can see that
// it has to do with how BS displays columns as rows instead of there is limited
// space. Fix this bug.

//TODO: Display the username next to the Log Out button when logged in.



const InterfaceHeader = ({setAppPage, setColNum}) => {
  return (
    <header class="navbar navbar-default">
    <div class="container-fluid">
      <div class="navbar-header">
        <SuperCoolLogoTBD />
      </div>
      <HeaderButtonsContainer setAppPage={setAppPage} setColNum={setColNum} />
      <AccountButtonsContainer />
    </div>
  </header>
  );
};

const SuperCoolLogoTBD = ({setAppPage, setColNum}) => {
  const [columns, columnManager] = useContext(ColumnsContext);

  return (
    <span class="navbar-brand" onclick={() => {
      columnManager.openColumn(columns.keys[columns.fst], 10, true);
    }}>
      openSDB
    </span>
  );
};


const HeaderButtonsContainer = ({setAppPage, setColNum}) => {
  return (
    <ul class="nav navbar-nav">
      <li class="tutorial"
        onclick={() => setAppPage("tutorial")}
        style={localStorage.hasAcceptedStorage ? {} : {
          fontSize: "17pt",
          textShadow: "0px 0px 5px #afa, 0px 0px 13px #3f2",
          // TODO: Try .focus() instead and see if that is better.
        }}
      >
        <a href="#">Tutorial</a>
      </li>
      <li class="minus" onclick={() => setColNum(
        prev => prev <= 0 ? 0 : prev - 1
      )}>
        <a href="#"><span style="font-size: 18pt;">-</span></a>
      </li>
      <li class="plus" onclick={() => setColNum(
        prev => prev >= 3 ? 3 : prev + 1
      )}>
        <a href="#"><span style="font-size: 18pt;">+</span></a>
      </li>
      {/* TODO: Add one or a few more. */}
    </ul>
  );
};

const AccountButtonsContainer = () => {
  const session = useContext(SessionContext);
  const accountManager = useContext(AccountManagerContext);

  return (
  <ul class="nav navbar-nav navbar-right">
    <li class="log-in"
      onclick={() => setAppPage("login")}
      style={!session || session.expTime > Date.now() ? {display: none} : {}} 
    >
      <a href="#"><span class="glyphicon glyphicon-log-in"></span> Sing in</a>
    </li>
    <li class="new-account"
      onclick={() => setAppPage("signup")}
      style={!session || session.expTime > Date.now() ?{} : {display: none}} 
    >
      <a href="#"><span class="glyphicon glyphicon-user"></span> Sign up</a>
    </li>
    <li class="log-out"
      onclick={() => accountManager.logout()}
      style={!session || session.expTime > Date.now() ?{} : {display: none}} 
    >
      <a href="#"><span class="glyphicon glyphicon-log-out"></span> Log out</a>
    </li>
  </ul>
  );
};
