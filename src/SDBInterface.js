import {useState, createContext, useContext } from "react";


import {DBRequestManager } from "/src/DBRequestManager.js";
import {AccountManager } from "/src/AccountManager.js";
import {ContentLoader, DataNode } from "/src/ContentLoader.js";



export const dbReqManager = new DBRequestManager();
// export const accountManager = new AccountManager();
// const IOContext = createContext();

export const AppPageContext = createContext();
var appPage;
export var setAppPage;
export const SessionContext = createContext();
export var accountManager;


export const SDBInterface = () => {
  [appPage, setAppPage] = useState("main");
  const [session, setSession] = useState(localStorage.session ?? false);

  accountManager = new AccountManager(setSession);

  if (typeof(Storage) === "undefined") {
    alert(
      "This web application requires browser support for local storage " +
      "in order to function correctly. It seems that your browser does " +
      "not support local storage."
    );
  }

  return (
    <SessionContext.Provider value={session}>
    <AppPageContext.Provider value={appPage}>
      <div>
        <MainPage     style={appPage == "main" ? {} : {display: none}} />
        <TutorialPage style={appPage == "tutorial" ? {} : {display: none}} />
        <LoginPage    style={appPage == "login" ? {} : {display: none}} />
        <SignupPage   style={appPage == "signup" ? {} : {display: none}} />
      </div>
    </AppPageContext.Provider>
    </SessionContext.Provider>
  );
};

const MainPage = () => {
  return (
    <div>
      <InterfaceHeader />
      <main>
        <div class="left-margin"><br/><span>&#10094;</span><br/></div>
        <AppColumnContainer />
        <div class="right-margin"><br/><span>&#10095;</span><br/></div>
      </main>
      {/* <div class="overlay-page-container"></div> */}
    </div>
  );
};



// TODO: There is a style bug with the sign-in etc. buttons when the width of
// the screen gets small enough (they jump down from the bar). I can see that
// it has to do with how BS displays columns as rows instead of there is limited
// space. Fix this bug.

//TODO: Display the username next to the Log Out button when logged in.



const InterfaceHeader = () => {
  return (
    <header class="navbar navbar-default">
    <div class="container-fluid">
      <div class="navbar-header">
        <SuperCoolLogoTBD />
      </div>
      <HeaderButtonsContainer />
      <AccountButtonsContainer />
    </div>
  </header>
  );
};

const HeaderButtonsContainer = () => {
  return (
    <ul class="nav navbar-nav">
      <li class="tutorial"
        onClick={() => setAppPage("tutorial")}
        style={localStorage.hasAcceptedStorage ? {} : {
          fontSize: "17pt",
          textShadow: "0px 0px 5px #afa, 0px 0px 13px #3f2",
          // TODO: Try .focus() instead and see if that is better.
        }}
      >
        <a href="#">Tutorial</a>
      </li>
      <li class="minus">
        <a href="#"><span style="font-size: 18pt;">-</span></a>
      </li>
      <li class="plus">
        <a href="#"><span style="font-size: 18pt;">+</span></a>
      </li>
      {/* TODO: Add one or a few more. */}
    </ul>
  );
};

const AccountButtonsContainer = () => {
  const session = useContext(SessionContext);

  return (
  <ul class="nav navbar-nav navbar-right">
    <li class="log-in"
      onClick={() => setAppPage("login")}
      style={!session || session.expTime > Date.now() ? {display: none} : {}} 
    >
      <a href="#"><span class="glyphicon glyphicon-log-in"></span> Sing in</a>
    </li>
    <li class="new-account"
      onClick={() => setAppPage("signup")}
      style={!session || session.expTime > Date.now() ?{} : {display: none}} 
    >
      <a href="#"><span class="glyphicon glyphicon-user"></span> Sign up</a>
    </li>
    <li class="log-out"
      onClick={() => accountManager.logout()}
      style={!session || session.expTime > Date.now() ?{} : {display: none}} 
    >
      <a href="#"><span class="glyphicon glyphicon-log-out"></span> Log out</a>
    </li>
  </ul>
  );
};
// accountButtonsContainerCL.addCallback(function($ci, data) {
//   if (typeof(Storage) === "undefined") {
//     alert(
//       "This web application requires browser support for local storage " +
//       "in order to function correctly. It seems that your browser does " +
//       "not support local storage."
//     );
//     return;
//   }
//   if (!localStorage.session) {
//     $ci.children('.log-out').hide();
//   } else {
//     if (localStorage.session.expTime > Date.now()) {
//       $ci.children('.log-out').hide();
//     } else {
//       $ci.children('.log-in, .new-account').hide();
//     }
//   }
//   $ci.children('.log-in').on("click", function() {
//     $(this).trigger("log-in");
//     return false;
//   });
//   $ci.children('.new-account').on("click", function() {
//     $(this).trigger("new-account");
//     return false;
//   });
//   $ci.children('.log-out').on("click", function() {
//     accountManager.logout();
//     let $ci = $(this).closest('.CI.AccountButtonsContainer');
//     $ci.children('.log-out').hide();
//     $ci.children('.log-in, .new-account').show();
//     return false;
//   });
//   $ci.on("logged-in", function() {
//   let $ci = $(this).closest('.CI.AccountButtonsContainer');
//     $ci.children('.log-in, .new-account').hide();
//     $ci.children('.log-out').show();
//     return false;
//   });
// });

