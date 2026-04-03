
import * as TabbedPages from "/1/1/misc/TabbedPages.jsx";
import * as MembersPage from "./subpages/MembersPage.jsx";




export function render({entID, name, qualKey = undefined}) {
  return <div className="class-page">
    <h3>{name}</h3>
    <TabbedPages key="0"
      initTabKey={"all"} isNested={isNested} tabs={{
        members: {
          title: "Members",
          Component: MembersPage,
          props: {
            classKey: entID,
            qualKey: qualKey,
          },
        },
        subclasses: {
          title: "Subclasses",
          Component: MembersPage,
          props: {
            entID: entID,
          },
        },
        add: {
          title: "Add member",
          Component: MembersPage,
          props: {
            entID: entID,
          },
        },
      }}
    />;
  </div>
}