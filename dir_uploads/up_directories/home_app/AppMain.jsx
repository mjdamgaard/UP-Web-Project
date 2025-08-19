
import * as TutorialIndexPage from "./tutorials/index.jsx";
import * as TutorialIntroPage from "./tutorials/intro.jsx";


export function render() {
  let {pageIdent} = this.state;

  let pageContent;
  if (!pageIdent || pageIdent === "home") {
    pageContent = <h3>{"Home page not implemented yet."}</h3>;
  }
  else if (pageIdent === "tutorials") {
    pageContent = <TutorialIndexPage key="idx" />;
  }
  else if (pageIdent === "intro-tutorial") {
    pageContent = <TutorialIntroPage key="intro" />;
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
  "goToHomePage": function() {
    this.setState({...this.state, pageIdent: "home"});
  },
  "goToTutorialsPage": function() {
    this.setState({...this.state, pageIdent: "tutorials"});
  },
  "goToIntroTutorialPage": function() {
    this.setState({...this.state, pageIdent: "intro-tutorial"});
  }
};


export const methods = [
  "goToHomePage",
  "goToTutorialsPage",
  "goToIntroTutorialPage",
];