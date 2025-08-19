
import * as AppHeader from "./AppHeader.jsx";
import * as AppMain from "./AppMain.jsx";



export function render() {
  return <div className="app">
    <AppHeader key="h" />
    <AppMain key="m" />
  </div>;
}


export const actions = {
  "goToHomePage": function() {
    this.call("m", "goToHomePage");
  },
  "goToTutorialsPage": function() {
    this.call("m", "goToTutorialsPage");
  },
  "goToIntroTutorialPage": function() {
    this.call("m", "goToIntroTutorialPage");
  }
};

export const events = [
  "goToHomePage",
  "goToTutorialsPage",
  "goToIntroTutorialPage",
];