
import * as AppHeader from "./AppHeader.jsx";
import * as AppMain from "./AppMain.jsx";



export function render() {
  return (
    <div className="app">
      <AppHeader key="h" />
      <AppMain key="m" />
    </div>
  );
}


export const actions = {
  "goToPage": function(pageIdent) {
    this.call("m", "pageIdent", pageIdent);
  },
};

export const events = [
  "goToPage",
];


export const stylePath = "./style.css";
