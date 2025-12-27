
import * as ILink from 'ILink.jsx';


export function render() {
  return <header className="app-header">
    <ILink key="logo" href="~/">
      <span className="logo">{"UP-Web.org"}</span>
    </ILink>
    <ILink key="about" href="~/about">
      <span className="menu-item">{"About"}</span>
    </ILink>
    <ILink key="tut" href="~/tutorials">
      <span className="menu-item">{"Tutorials"}</span>
    </ILink>
    <ILink key="comp" href="~/entPath/1/1/em1.js;get/components">
      <span className="menu-item">{"Components"}</span>
    </ILink>
    <ILink key="proj" href="~/entPath/1/1/em1.js;get/projects">
      <span className="menu-item">{"Projects"}</span>
    </ILink>
    <ILink key="disc" href="~/entPath/1/1/em1.js;get/discussionsClass">
      <span className="menu-item">{"Discussions"}</span>
    </ILink>
  </header>;
}
