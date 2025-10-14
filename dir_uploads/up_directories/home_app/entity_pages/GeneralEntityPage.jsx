
import * as EntityMetadataPage from "./EntityMetadataPage.jsx";
import * as EntityReference from "../utility_components/EntityReference.jsx";
import * as TabbedPages from "../utility_components/TabbedPages.jsx";

const subclassesRel = "/1/1/em1.js;get/subclasses";


export function render({entKey}) {
  return <div className="entity-page">
    <h1><EntityReference key="title" entKey={entKey} isLink={false} /></h1>
    <TabbedPages key="tp" initTabKey="about" tabs={{
      about: {
        title: "About", Component: EntityMetadataPage, props: {entKey: entKey}
      }
    }}/>
  </div>;
}



export const styleSheetPaths = [
  abs("../utility_components/TabbedPages.css"),
];