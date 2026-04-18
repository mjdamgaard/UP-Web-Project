
import * as TabbedPages from "/1/2/misc/TabbedPages.jsx";
import * as MembersPage from "./subpages/MembersPage.jsx";




export function render({entID, name, qualKey = undefined}) {
  return <div className="class-page">
    <h1>{name}</h1>
    <TabbedPages key="0"
      initTabKey={"members"} tabs={{
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
    />
  </div>
}