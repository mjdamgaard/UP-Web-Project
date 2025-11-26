
import * as EntityReference from "./EntityReference.jsx";
import * as TabbedPages from "./TabbedPages.jsx";


export function render({entKey, tabs, initTabKey, isNested}) {
  return <div className="entity-page">
    <h1>
      <EntityReference key={"title"} entKey={entKey}
        hasLinks={!!isNested} linkLevel={isNested ? 0 : 1}
      />
    </h1>
    <TabbedPages key={"tp-" + entKey} initTabKey={initTabKey} tabs={tabs} />
  </div>;
}


export const styleSheetPaths = [
  abs("../misc/TabbedPages.css"),
];
