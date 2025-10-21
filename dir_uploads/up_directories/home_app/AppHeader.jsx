
import * as ILink from 'ILink.jsx';


export function render() {
  return <header className="app-header">
    <ILink key="logo" href="~/">
      <span className="logo">{"UP-Web.org"}</span>
    </ILink>
    <ILink key="about" href="~/about">
      <span className="about">{"About"}</span>
    </ILink>
    <ILink key="tut" href="~/tutorials">
      <span className="tutorials">{"Tutorials"}</span>
    </ILink>
    <ILink key="comp" href="~/c">
      <span className="components">{"Components"}</span>
    </ILink>
  </header>;
}
