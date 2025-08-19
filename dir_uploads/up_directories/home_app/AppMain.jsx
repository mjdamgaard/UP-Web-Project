
import * as TutorialIndexPage from "./tutorials/index.jsx";
import * as TutorialIntroPage from "./tutorials/intro.jsx";
import * as AboutPage from "./about.jsx";


export function render() {
  let {pageIdent} = this.state;

  let pageContent;
  if (!pageIdent || pageIdent === "home") {
    pageContent = <div>
      <h3>{"Home page not implemented yet."}</h3>
      <p>{"Try the About page or the Tutorials instead!"}</p>
    </div>;
  }
  else if (pageIdent === "about") {
    pageContent = <AboutPage key="about" />;
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
  "goToAboutPage": function() {
    this.setState({...this.state, pageIdent: "about"});
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
  "goToAboutPage",
  "goToTutorialsPage",
  "goToIntroTutorialPage",
];