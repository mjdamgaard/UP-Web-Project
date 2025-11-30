
import * as EntityPageWithTabs
from "../misc/EntityPageWithTabs.jsx";
import * as EntityMetadataPage from "./EntityMetadataPage.jsx";
import * as QualitiesPage from "./QualitiesPage.jsx";


export function render({entKey, extQualKeyArr = undefined, isNested = false}) {
  return <EntityPageWithTabs key="0"
    entKey={entKey} initTabKey={"qualities"} isNested={isNested} tabs={{
      about: {
        title: "About",
        Component: EntityMetadataPage,
        props: {entKey: entKey}
      },
      qualities: {
        title: "Qualities",
        Component: QualitiesPage,
        props: {
          objKey: entKey,
          extQualKeyArr: extQualKeyArr,
        }
      },
    }}
  />;
}


export const styleSheetPaths = [
  abs("../misc/TabbedPages.css"),
  abs("../entity_lists/EntityList.css"),
];