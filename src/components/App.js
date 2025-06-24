
import {useState, useLayoutEffect, createContext, useCallback} from "react";
import {
  ScriptInterpreter, getExtendedErrorMsg
} from "../interpreting/ScriptInterpreter.js";
import {ServerQueryHandler} from "../server/ajax_io/ServerQueryHandler.js";
import {CAN_CREATE_APP_FLAG} from "../dev_lib/jsx/jsx_components.js";

/* Tests */

import {runTests} from "../testing/parsing_interpreting_tests.js";


/* Static developer libraries */

import * as queryMod from "../dev_lib/query/query.js";
import * as basicGetSettingsMod from "../dev_lib/jsx/settings/basic.js";
import * as jsxMod from "../dev_lib/jsx/jsx_components.js";
import * as textareaCompMod from "../dev_lib/jsx/dev_components/Textarea1.js";

const staticDevLibs = new Map();
staticDevLibs.set("query", queryMod);
staticDevLibs.set("settings1", basicGetSettingsMod);
staticDevLibs.set("jsx", jsxMod);
staticDevLibs.set("Textarea1.jsx", textareaCompMod);



if (typeof(Storage) === "undefined") {
  alert(
    "This web application requires browser support for local " +
    "storage in order to function correctly. Please turn on local storage, " +
    "or use a different browser."
  );
}


// TODO: Remove this and require a login instead to get a real auth. token.
localStorage.setItem("userID", "1");
localStorage.setItem("authToken", "test_token");


const serverQueryHandler = new ServerQueryHandler();

const scriptInterpreter = new ScriptInterpreter(
  false, serverQueryHandler, undefined, staticDevLibs, undefined
);


// Initialize a continuously self-refilling gas object for the app.
const FRESH_APP_GAS = {
  comp: 100000,
  import: 100,
  fetch: 100,
  time: Infinity,
};
const appGas = Object.assign({}, FRESH_APP_GAS);
setInterval(
  () => Object.assign(appGas, FRESH_APP_GAS),
  10000
);

// The script the initializes the UP app.
const TEST_APP_ID = 3;
const appScript = `
  import {createJSXApp} from 'jsx';
  import {getSettings} from 'settings1';
  import * as testApp from "/1/${TEST_APP_ID}/main.jsx";

  export function main() {
    createJSXApp(testApp, {}, getSettings);
  }
`;
const renderNumMonad = [0];

const flags = [CAN_CREATE_APP_FLAG];



export const App = (props) => {

  useLayoutEffect(() => {
    if (renderNumMonad[0]++ === 0) {
      // runTests();
      scriptInterpreter.interpretScript(
        appGas, appScript, undefined, [], flags,
      ).then(
        ([output, log]) => {
          console.log("UP app script exited with output and log:");
          console.log(output);
          console.log(log);
          if (log?.error) {
            console.error(getExtendedErrorMsg(log.error));
          }
        }
      ).catch(err => console.error(err));
    }
  }, [])

  return (
    <div className="app">
      <div id="up-app-root"></div>
    </div>
  );
};









// export const ProfileContext = createContext();


// export const App = (props) => {
  // const pathname = window.location.pathname;
  // const hasPath = pathname !== "/";
  // // const [state, setState] = useRestorableState("app", {
  // const [state, setState] = useState({
  //   profileState: {
  //     userID: localStorage.session && localStorage.session.userID,
  //     sesIDHex: localStorage.session && localStorage.session.sesIDHex,
  //   },
  //   pagesState: {
  //     pageKeyArr: hasPath ? [0, 1] : [0],
  //     pagePathStore: {
  //       0: "/e" + HOME_ENTITY_ID,
  //       1: hasPath ? pathname : undefined,
  //     },
  //     nonce: 1,
  //     curInd: hasPath ? 1 : 0,
  //     prevInd: hasPath ? 0 : null,
  //   },
  //   // scrollLeft: 0, scrollVelocity: 0, lastScrollAt: 0,

  // });
  // const {pagePathStore, pageKeyArr, curInd} = state.pagesState;

  // TODO: See below.
  // const [isReady, refCallback2] = useRestore("root", state, prevState => {
  //   setState(prevState);
  // });

  // const [dispatch, refCallback] = useDispatch(
  //   appActions, setState, state, props
  // );


  // const getProfileData = useCallback((propName) => {
  //   return state.profileState[propName];
  // }, Object.values(state.profileState))


  // useLayoutEffect(() => {
  //   let curPagePath = pagePathStore[pageKeyArr[curInd]];
  //   let newPath = curPagePath.entID ? "e" + curPagePath.entID : "";
  //   window.history.pushState(null, "", newPath);
  //   // TODO: Refactor:
  //   appActions["SCROLL_INTO_VIEW"](curInd);
  //   window.onresize = (event) => {
  //     appActions["SCROLL_INTO_VIEW"](curInd);
  //   };
  // }, [curInd])



  // const appPages = pageKeyArr.map((pageKey, ind) => {
  //   let pagePath = pagePathStore[pageKey];
  //   return (
  //     <div key={pageKey} className={
  //       "page-container" + ((curInd === ind) ? " active" : "")
  //     }
  //       onClick={(e) => {
  //         if (curInd === ind) {
  //           appActions["SCROLL_INTO_VIEW"](ind);
  //         } else {
  //           dispatch(e.target, "GO_TO_PAGE", ind);
  //         }
  //       }}
  //     >
  //       <AppPage pageKey={pageKey} pagePath={pagePath} />
  //     </div>
  //   );
  // });

  // TODO: comment-in and debug useRestore(). ..(And also make a combined
  // hook to that we can combine the two refCallbacks instead.)
  // Well, maybe I don't actually want to use it after all. But I'll still
  // debug it at some point..
  // if (!isReady) {
  //   return <></>
  // }
//   return (
//     <div className="app" // ref={refCallback}
//       // ref={(node) => {
//       //   refCallback(node);
//       //   refCallback2(node);
//       // }}
//     >
//       {/* <ProfileContext.Provider value={getProfileData}> */}
//         <AppHeader
//           // setAppPage={void(0)}
//           // pageKeyArr={pageKeyArr} pagePathStore={pagePathStore}
//           // curInd={curInd}
//         />
//         {/* <div className="page-list-container">
//           {appPages}
//         </div> */}
//       {/* </ProfileContext.Provider> */}
//     </div>
//   );
// };







const PAGE_LIST_CONTAINER_SELECTOR = ".page-list-container";
const PAGE_CONTAINER_SELECTOR = ".page-container";



const appActions = {
  "OPEN_PAGE": function([pagePath, callerPageKey], setState, {state}) {
    const pagesState = state.pagesState;
    const {pageKeyArr, pagePathStore, nonce} = state.pagesState;
    let callerColInd = pageKeyArr.indexOf(callerPageKey);
    let newNonce = nonce + 1;
    let newPageKeyArr = (callerColInd === -1) ?
      pageKeyArr.concat([newNonce]) :
      pageKeyArr.slice(0, callerColInd + 1).concat(
        [newNonce], pageKeyArr.slice(callerColInd + 1)
      )
    let newSpecStore = {...pagePathStore, [newNonce]: pagePath};
    let newCurInd = callerColInd + 1;

    if (newCurInd == pagesState.prevInd) {
      // window.history.popState()...
    }

    this["GO_TO_PAGE"](newCurInd, setState, {state});
    setState({
      ...state,
      pagesState: {
        ...state.pagesState,
        pageKeyArr: newPageKeyArr,
        pagePathStore: newSpecStore,
        nonce: newNonce,
      }
    });
  },

  "GO_TO_PAGE": function(pageInd, setState, {state}) {
    const pagesState = state.pagesState;
    setState ({
      ...state,
      pagesState: {
        ...state.pagesState,
        curInd: pageInd,
        prevInd: pagesState.curInd,
      }
    });
  },

  "CLOSE_PAGE": (setState, {state}, callerPageKey) => {
    // TODO: Implement.
    alert("CLOSE_PAGE not implemented yet.");
  },

  getPageListContainerAndPositions: function () {
    const pageListContainer = document.querySelector(
      PAGE_LIST_CONTAINER_SELECTOR
    );

    const {left, right} = pageListContainer.getBoundingClientRect();
    const pos = {left: left, center: (right - left) / 2, right: right};

    // Get the center position of the page container.
    const pageContainers = pageListContainer.querySelectorAll(
      PAGE_CONTAINER_SELECTOR
    );
    const childPosArr = [];
    pageContainers.forEach((element, ind) => {
      let {left, right} = element.getBoundingClientRect();
      childPosArr[ind] = {
        left: left, center: left + (right - left) / 2, right: right
      };
    });

    return [pageListContainer, pos, childPosArr];
  },

  "SCROLL_INTO_VIEW": function(colInd) {
    // Get the page container and the positions.
    const [pageListContainer, pos, childPosArr] =
      this.getPageListContainerAndPositions();
    // And get the center position of the page container.
    const center = pos.center;

    // Get the amount to scroll to the new page.
    const centerDiff = childPosArr[colInd].center - center;
    
    // Now scroll by that amount.
    pageListContainer.scrollBy({left: centerDiff, behavior: "smooth"});

    return;
  },

  /* Profile reducers */

  "LOG_IN": (input, setState, {state, props}, node, dispatch) => {
    // TODO: Implement.
    alert("LOG_IN not implemented yet.");
  },
}


















// export const App = () => {
//   // On first render of the app, get the page from the URL and use it to set
//   // the initial state.
//   const initialPage = useMemo(() => getPageFromTop(), []);
//   const [{appPage}, setState] = useState({appPage: initialPage})

//   const [refCallback, dispatch] = useDispatch(appReducers, "app", setState);

//   return (
//     <div className="sdb-interface" ref={refCallback}>
//       <AccountContextProvider>{/* yields: session, accountManager.*/}
//         {/* <AppHeader setAppPage={void(0)} /> */}
//         <MainPage
//           isHidden={appPage !== "main"}
//         />
//         <LoginPage // Todo: Make sure that the LoginPage is refreshed
//         // when it is hidden.
//           isHidden={appPage !== "login"}
//         />
//         <SignupPage
//           isHidden={appPage !== "signup"}
//         />
//         {/* <TutorialPage
//           setAppPage={setAppPage}
//           isHidden={appPage !== "tutorial"}
//         /> */}
//         {/* TODO: Remove the following test page */}
//         <InsertPage
//           isHidden={appPage !== "insert"}
//         />
//       </AccountContextProvider>
//     </div>
//   );
// };


















// const Layout = (props) => {
//   const {children} = props;
//   return (
//     <AccountContextProvider> {/* yields: session, accountManager.*/}
//       <AppHeader setAppPage={void(0)} />
//       {children}
//       {/* <Outlet /> */}
//     </AccountContextProvider>
//   );
// };

// const IndexPage = ({}) => {
//   return (
//     <Navigate replace to={"/e" + HOME_ENTITY_ID} />
//   );
// };





// <AccountContextProvider> {/* yields: session, accountManager.*/}
// <div className="sdb-interface">
//   <AppPage
//     // initColSpec={{entID: 1}}
//     // initColSpec={{entID: 40}}
//     initColSpec={{entID: entID}} 
//     setAppPage={setAppPage}
//     isHidden={appPage !== "home"}
//   />
//   <LoginPage // Todo: Make sure that the LoginPage is refreshed when it is
//   // hidden.
//     setAppPage={setAppPage}
//     isHidden={appPage !== "login"}
//   />
//   <SignupPage
//     setAppPage={setAppPage}
//     isHidden={appPage !== "signup"}
//   />
//   {/* <TutorialPage
//     setAppPage={setAppPage}
//     isHidden={appPage !== "tutorial"}
//   /> */}
//   {/* TODO: Remove the following test page */}
//   <InsertPage
//     setAppPage={setAppPage}
//     isHidden={appPage !== "insert"}
//   />
// </div>
// {/* </AppPageContext.Provider> */}
// </AccountContextProvider>





    // <BrowserRouter>
    //   <Routes>
    //     <Route path="/" element={<Layout />}>
    //       <Route index element={<IndexPage />} />
    //       <Route path="login" element={<LoginPage />} />
    //       {/* Todo: Make sure that the LoginPage is refreshed when it is
    //       hidden. */}
    //       <Route path="signup" element={<SignupPage />} />
    //       {/* <Route path="tutorial" element={<TutorialPage />} /> */}
    //       <Route path="insert" element={<InsertPage />} />
    //       <Route key={"m"} path="*" element={<MainPage key={"m"} />} />
    //       {/* Wrong paths are handled in MainPage instead of here */}
    //     </Route>
    //   </Routes>
    // </BrowserRouter>



    // <Layout>
    //   <MainPage />
    //   <LoginPage />
    //   {/* Todo: Make sure that the LoginPage is refreshed when it is
    //   hidden. */}
    //   <SignupPage />
    //   {/* <TutorialPage /> */}
    //   <InsertPage />
    // </Layout>