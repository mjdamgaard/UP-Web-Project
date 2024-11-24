import {useState, useLayoutEffect, createContext, useCallback} from "react";

import {useDispatch} from "../../hooks/useDispatch.js";
import {useRestore} from "../../hooks/useRestore.js";
import {basicEntIDs} from "../../entity_ids/basic_entity_ids.js";

// import {appReducers} from "./appReducers.js";

import {AppHeader} from "./AppHeader.js";
import {AppPage} from "../app_pages/AppPage.js";


export const HOME_ENTITY_ID = basicEntIDs["entities"];



const PAGE_LIST_CONTAINER_SELECTOR = ".page-list-container";
const PAGE_CONTAINER_SELECTOR = ".page-container";


// if (typeof(Storage) === "undefined") {
//   alert(
//     "This web application requires browser support for local " +
//     "storage in order to function correctly. It seems that your " +
//     "browser does not support local storage."
//   );
//   return;
// }


export const AccountContext = createContext();




export const App = (props) => {
  const pathname = window.location.pathname;
  const hasPath = pathname !== "/";
  // const [state, setState] = useRestorableState("app", {
  const [state, setState] = useState({
    accountState: {
      userID: localStorage.session && localStorage.session.userID,
      sesIDHex: localStorage.session && localStorage.session.sesIDHex,
    },
    pagesState: {
      pageKeyArr: hasPath ? [0, 1] : [0],
      pagePathStore: {
        0: "/e" + HOME_ENTITY_ID,
        1: hasPath ? pathname : undefined,
      },
      nonce: 1,
      curInd: hasPath ? 1 : 0,
      prevInd: hasPath ? 0 : null,
    },
    // scrollLeft: 0, scrollVelocity: 0, lastScrollAt: 0,

  });
  const {pagePathStore, pageKeyArr, curInd} = state.pagesState;

  // TODO: See below.
  // const [isReady, refCallback2] = useRestore("root", state, prevState => {
  //   setState(prevState);
  // });

  const [dispatch, refCallback] = useDispatch(
    appActions, setState, state, props
  );


  const getAccountData = useCallback((propName) => {
    return state.accountState[propName];
  }, Object.values(state.accountState))


  useLayoutEffect(() => {
    let curPagePath = pagePathStore[pageKeyArr[curInd]];
    let newPath = curPagePath.entID ? "e" + curPagePath.entID : "";
    window.history.pushState(null, "", newPath);
    // TODO: Refactor:
    appActions["SCROLL_INTO_VIEW"](curInd);
    window.onresize = (event) => {
      appActions["SCROLL_INTO_VIEW"](curInd);
    };
  }, [curInd])



  const appPages = pageKeyArr.map((pageKey, ind) => {
    let pagePath = pagePathStore[pageKey];
    return (
      <div key={pageKey} className={
        "page-container" + ((curInd === ind) ? " active" : "")
      }
        onClick={(e) => {
          if (curInd === ind) {
            appActions["SCROLL_INTO_VIEW"](ind);
          } else {
            dispatch(e.target, "GO_TO_PAGE", ind);
          }
        }}
      >
        <AppPage pageKey={pageKey} pagePath={pagePath} />
      </div>
    );
  });

  // TODO: comment-in and debug useRestore(). ..(And also make a combined
  // hook to that we can combine the two refCallbacks instead.)
  // Well, maybe I don't actually want to use it after all. But I'll still
  // debug it at some point..
  // if (!isReady) {
  //   return <></>
  // }

  return (
    <div className="app" ref={refCallback}
      // ref={(node) => {
      //   refCallback(node);
      //   refCallback2(node);
      // }}
    >
      <AccountContext.Provider value={getAccountData}>
        <AppHeader
          setAppPage={void(0)}
          pageKeyArr={pageKeyArr} pagePathStore={pagePathStore}
          curInd={curInd}
        />
        <div className="page-list-container">
          {appPages}
        </div>
      </AccountContext.Provider>
    </div>
  );
};





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

  /* Account reducers */

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