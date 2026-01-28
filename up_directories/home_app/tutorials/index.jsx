
import {substring} from 'string';

import * as ILink from 'ILink.jsx';
import {urlActions, urlEvents} from '../urlActions.js';
import * as EntityList from "../entity_lists/EntityList.jsx";
import * as GettingStartedPage from "./getting_started.jsx";
import * as ComponentsIntroPage from "./components.jsx";
import * as StylingIntroPage from "./styling.jsx";
import * as DifferencesPage from "./differences.jsx";
import * as ServerModulesPage from "./server_modules.jsx";
import * as DBQueriesPage from "./db_queries.jsx";
import * as ContributionsPage from "./contributions.jsx";


export function render({url, homeURL}) {
  this.provideContext("homeURL", homeURL);
  let tailURL = substring(url, homeURL.length);


  if (!tailURL) {
    return indexPage;
  }
  else if (tailURL === "/getting-started") {
    return <GettingStartedPage key="0" />;
  }
  else if (tailURL === "/jsx-components") {
    return <ComponentsIntroPage key="0" />;
  }
  else if (tailURL === "/styling") {
    return <StylingIntroPage key="0" />;
  }
  else if (tailURL === "/useful-things-to-know") {
    return <DifferencesPage key="0" />;
  }
  else if (tailURL === "/server-modules") {
    return <ServerModulesPage key="0" />;
  }
  else if (tailURL === "/db-queries") {
    return <DBQueriesPage key="0" />;
  }
  else if (tailURL === "/contributions") {
    return <ContributionsPage key="0" />;
  }
  else {
    return "404 Error: Missing page."
  }
}




const indexPage = <div className="text-page">
  <h1>{"Tutorials and introductions"}</h1>
  <section>
    <h2>{"Basic tutorials for getting started"}</h2>
    <p>{
      "Here is a list of tutorials and introductions to get you started with " +
      "creating and uploading new components, and server modules, etc."
    }</p>
    <ol className="tutorial-list">
      <li>
        <ILink key="getting-started" href="~/getting-started" >
          {"Getting started"}
        </ILink>
      </li>
      <li>
        <ILink key="jsx-components" href="~/jsx-components" >
          {"Front-end components"}
        </ILink>
      </li>
      <li>
        <ILink key="styling" href="~/styling" >
          {"Styling"}
        </ILink>
      </li>
      <li>
        <ILink key="differences" href="~/useful-things-to-know" >
          {"Useful things to know"}
        </ILink>
      </li>
      <li>
        <ILink key="SMs" href="~/server-modules" >
          {"Server modules"}
        </ILink>
      </li>
      <li>
        <ILink key="db-queries" href="~/db-queries" >
          {"Database queries"}
        </ILink>
      </li>
      <li>
        <ILink key="contributions" href="~/contributions" >
          {"Sharing your contributions"}
        </ILink>
      </li>
    </ol>
  </section>

  <section>
    <h2>{"User-made introductory tutorials"}</h2>
    <p>{
      "Here is a list of user-made tutorials that expands on on some of " +
      "the basic principles of the UP system."
    }</p>
    {/* TODO: Change the class. */}
    <div>
      <EntityList key="_basic-list" classKey="/1/1/em2.js;get/introTutorials"
        paginationLength={10}
      />
    </div>
  </section>

  <section>
    <h2>{"User-made advanced tutorials"}</h2>
    <p>{
      "And here is a list of user-made tutorials and introductions for more " +
      "advanced users."
    }</p>
    {/* TODO: Change the class. */}
    <div>
      <EntityList key="_advanced-list" classKey="/1/1/em2.js;get/advTutorials"
        paginationLength={10}
      />
    </div>
  </section>
</div>;



export const actions = urlActions;

export const events = urlEvents;