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



const initColKey = {entID: 10, n: 0};
export function openColumn(callerKey, newEntID, isToTheLeft);
export function closeColumn(callerKey);

const AppColumnContainer = () => {
  const [colKeys, setColKeys] = useState([initColKey]);

  openColumn = (callerKey, newEntID, isToTheLeft) => {
    // find caller column's index.
    let ind = colKeys.findIndex(
      val => JSON.stringify(val) == JSON.stringify(callerKey)
    )
    // get the new n for the new key if one or more columns with the same entID
    // already exists.
    let newN = colKeys.reduce(
      (acc, val) => val.entID != newEntID ? acc : (val.n > acc ? val.n : acc),
      0
    );
    // create and insert the new column key in colKeys.
    let r = isToTheLeft ? 0 : 1;
    setColKeys(
      colKeys.slice(0, ind + r).concat(
        [{entID: newEntID, n: newN}],
        colKeys.slice(ind + r)
      )
    );
  }

  closeColumn = (callerKey) => {
    // find caller column's index.
    let ind = colKeys.findIndex(
      val => JSON.stringify(val) == JSON.stringify(callerKey)
    )
    // remove the column key in colKeys.
    setColKeys(
      colKeys.slice(0, ind).concat(
        colKeys.slice(ind + 1)
      )
    );
  }

  const appColumns = colKeys.map((val) => 
    <AppColumn key={val}/>
  );
  return (
    <div>
        {appColumns}
    </div>
  );
};

/* Events to open new app columns and to cycle between them etc. */

appColumnCL.addCallback(function($ci) {
  $ci.on("open-column", function(event, contentKey, data, dir) {
    let $this = $(this);
    if (dir === "right") {
      sdbInterfaceCL.loadAfter($this, contentKey, data);
      $this.trigger("adjust-right");
    } else if (dir === "left") {
      sdbInterfaceCL.loadBefore($this, contentKey, data);
      $this.trigger("adjust-left");
    }
    return false;
  });
  $ci.on("close", function() {
    let $this = $(this);
    let $parent = $this.parent();
    $this.remove();
    $parent.trigger("adjust-left").trigger("adjust-right");
    return false;
  });
});

// TODO: Make the columns move smoothly sideways in a future implementation.
appColumnContainerCL.addCallback(function($ci, data) {
  data.activeColumnNum = 1;
  $ci.on("cycle-left", function() {
    let $columns = $(this).children();
    let $colBefore = $columns.filter(':visible').first().prev();
    if ($colBefore.length == 1) {
      let $colLast = $columns.filter(':visible').last();
      $colBefore.show(30);
      $colLast.hide(30);
    }
    return false;
  });
  $ci.on("cycle-right", function() {
    let $columns = $(this).children();
    let $colAfter = $columns.filter(':visible').last().next();
    if ($colAfter.length == 1) {
      let $colFirst = $columns.filter(':visible').first();
      $colAfter.show(30);
      $colFirst.hide(30);
    }
    return false;
  });
  $ci.on("adjust-left", function() {
    let $columns = $(this).children();
    let len = $columns.filter(':visible').length;
    while (len > data.activeColumnNum) {
      let $colLast = $columns.filter(':visible').last();
      $colLast.hide(); // (Setting a delay time here will cause bugs.)
      len--;
    }
    while (len < data.activeColumnNum) {
      let $visibleColumns = $columns.filter(':visible');
      if ($visibleColumns.length == 0) {
        $columns.first().show();
      }
      let $colBefore = $visibleColumns.first().prev();
      if ($colBefore.length != 1) {
        break;
      }
      $colBefore.show(); // (Setting a delay time here will cause bugs.)
      len++;
    }
    return false;
  });
  $ci.on("adjust-right", function() {
    let $columns = $(this).children();
    let len = $columns.filter(':visible').length;
    while (len > data.activeColumnNum) {
      let $colFirst = $columns.filter(':visible').first();
      $colFirst.hide(); // (Setting a delay time here will cause bugs.)
      len--;
    }
    while (len < data.activeColumnNum) {
      let $visibleColumns = $columns.filter(':visible');
      if ($visibleColumns.length == 0) {
        $columns.last().show();
      }
      let $colAfter = $visibleColumns.last().next();
      if ($colAfter.length != 1) {
        break;
      }
      $colAfter.show(); // (Setting a delay time here will cause bugs.)
      len++;
    }
    return false;
  });
  $ci.on("increase-column-number", function() {
    let $this = $(this);
    let data = $this.data("data");
    if (data.activeColumnNum < 3) {
      data.activeColumnNum++;
    }
    $this.css(
      'grid-template-columns',
      '1fr '.repeat(data.activeColumnNum)
    );
    $this.trigger("adjust-left").trigger("adjust-right");
    return false;
  });
  $ci.on("decrease-column-number", function() {
    let $this = $(this);
    let data = $this.data("data");
    if (data.activeColumnNum > 1) {
      data.activeColumnNum--;
    }
    $this.css(
      'grid-template-columns', '1fr '.repeat(data.activeColumnNum)
    );
    $this.trigger("adjust-left").trigger("adjust-right");
    return false;
  });
  $ci.on("prepend-home-column", function() {
    let $this = $(this);
    let data = $this.data("data");
    let $visibleColumns = $this.children().filter(':visible');
    let newData = new DataNode(data, {entID: 10});
    if ($visibleColumns.length > 0) {
      $visibleColumns.first().trigger(
        "open-column", ["AppColumn", newData, "left"]
      );
    } else {
      appColumnContainerCL.loadPrepended($this, "AppColumn", newData);
    }
    return false;
  });
});
sdbInterfaceCL.addCallback(function($ci, data) {
  $ci.children('main').children('.left-margin').on("click", function() {
    $(this).next().trigger("cycle-left");
    return false;
  });
  $ci.children('main').children('.right-margin').on("click", function() {
    $(this).prev().trigger("cycle-right");
    return false;
  });
});
headerButtonsContainerCL.addCallback(function($ci, data) {
  $ci.children('.minus').on("click", function() {
    $(this).closest('.CI.ColumnBasedSDBInterface')
      .find('.CI.AppColumnContainer')
      .trigger("decrease-column-number");
    return false;
  });
  $ci.children('.plus').on("click", function() {
    $(this).closest('.CI.ColumnBasedSDBInterface')
      .find('.CI.AppColumnContainer')
      .trigger("increase-column-number");
    return false;
  });
});











const AppColumn = ({children}) => {
  return (
    <div>
      <ColumnButtonContainer />
      {children}
    </div>
  );
};
appColumnCL.addCallback("data", function(data) {
  data.copyFromAncestor("cl", 1);
  data.cl ??= appColumnCL.getRelatedCL("EntityPage");;
  data.recLevel = null;
  data.maxRecLevel = null;
});



const ColumnButtonContainer = () => {
  return (
    <div>
      {/* <PinButton /> */}
      <CloseButton />
    </div>
  );
};
const CloseButton = () => {
  return (
    <button type="button" class="close">
      <span>&times;</span>
    </button>
  );
};
closeButtonCL.addCallback(function($ci) {
  $ci.on("click", function() {
    $(this).trigger("close");
    return false;
  });
});






const SuperCoolLogoTBD = () => {
  return (
    <span class="navbar-brand">openSDB</span>
  );
};
superCoolLogoCL.addCallback(function($ci, data) {
  $ci.on("click", function() {
    let $obj = $(this).closest('.CI.ColumnBasedSDBInterface')
      .find('.CI.AppColumnContainer');
    if ($obj.filter(':visible').length > 0) {
      $obj.trigger("prepend-home-column");
    } else {
      $obj.trigger("back-to-main");
    }
    return false;
  });
});




/* A List CL that automatically loads a list of child CIs */

const List = () => {
  return (
    <div>
      {/* <SelfReplacer data.listElemDataArr[...] /> */}
      <SelfReplacer />
    </div>
  );
};
listCL.addCallback("data", function(data) {
  data.copyFromAncestor("listElemDataArr");
});

const SelfReplacer = () => {
  return (
    <template></template>
  );
};
selfReplacerCL.addCallback("data", function(data) {
  data.copyFromAncestor("cl");
});
selfReplacerCL.addCallback(function($ci, data, childReturnData, returnData) {
  data.cl.loadReplaced($ci, "self", data.data ?? data, returnData);
});
