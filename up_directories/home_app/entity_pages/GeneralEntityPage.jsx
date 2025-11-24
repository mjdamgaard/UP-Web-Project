
import * as EntityPageWithTabs
from "../misc/EntityPageWithTabs.jsx";
import * as EntityMetadataPage from "./EntityMetadataPage.jsx";


export function render({entKey, isNested}) {
  return <EntityPageWithTabs key="0"
    entKey={entKey} initTabKey={"qualities"} isNested={isNested} tabs={{
      about: {
        title: "About",
        Component: EntityMetadataPage,
        props: {entKey: entKey}
      },
      qualities: {
        title: "Qualities",
        Component: EntityMetadataPage,
        props: {entKey: entKey}
      },
    }}
  />;
}


export const styleSheetPaths = [
  abs("../misc/TabbedPages.css"),
];