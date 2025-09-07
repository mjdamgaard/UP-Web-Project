
import * as TutorialIndexPage from "./tutorials/index.jsx";
import * as TutorialIntroPage from "./tutorials/intro.jsx";
import * as AboutPage from "./about.jsx";
import * as HomePage from "./home.jsx";


export function render(url, history) {
  let {pageIdent} = this.state;

  // TODO: Reimplement such that the home page isn't erased when when clicking
  // to the other pages, and also vice versa, and probably do it by turning
  // most of the menu items into ILinks, which if clicked normally will
  // replaceState() the current browser history item with the overall outer
  // state if the given page. But for now, I will just implement this for the
  // "home" page alone.  
  let pageContent;
  if (!pageIdent || pageIdent === "home") {
    pageContent = <HomePage key="home" url={url} history={history} />;
  }
  else if (pageIdent === "about") {
    pageContent = <AboutPage key="about" history={history} />;
  }
  else if (pageIdent === "tutorials") {
    pageContent = <TutorialIndexPage key="idx" history={history} />;
  }
  else if (pageIdent === "intro-tutorial") {
    pageContent = <TutorialIntroPage key="intro" history={history} />;
  }
  else {
    pageContent = <h3>{"Error: Unknown page: \"" + pageIdent + '"'}</h3>;
  } 

  return (
    <main className="app-main">
      {pageContent}
    </main>
  );
}


export const actions = {
  "goToPage": function(pageIdent) {
    this.setState({...this.state, pageIdent: pageIdent});
  },
};


export const methods = [
  "goToPage",
];