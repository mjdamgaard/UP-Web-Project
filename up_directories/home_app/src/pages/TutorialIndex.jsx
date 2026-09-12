
import * as ILink from 'ILink';
import * as MissingPage from "../MissingPage.jsx";
import * as ScrollHandler from "../ScrollHandler.jsx";

const subpages = {
  "getting-started": "getting_started.jsx",
  "jsx-components": "components.jsx",
  "useful-tips": "useful_tips.jsx",
  "server-modules": "server_modules.jsx",
  "db-tables": "db_tables.jsx",
};


export function initialize() {
  return {pageComponents: {}};
}

export function render() {
  let firstSegment = this.getSegment(0);
  if (firstSegment) {
    let {pageComponents} = this.state;
    let PageComponent = pageComponents[firstSegment];
    if (PageComponent) {
      return <ScrollHandler key={"p-" + firstSegment}>
        <PageComponent key="0" />
      </ScrollHandler>;
    }
    else if (PageComponent === null) {
      return <MissingPage />;
    }
    let filename = subpages[firstSegment];
    if (!filename) {
      return <MissingPage />;
    }
    else {
      import("./tutorials/" + filename).catch(
        err => console.error(err)
      ).then(component => {
        this.setState(state => ({...state,
          pageComponents: {...state.pageComponents,
            [firstSegment]: component || null,
          },
        }));
      });
      return <div className="page tutorials-page loading"></div>;
    }
  }

  return <div className="page tutorials-page">
    <h2>Tutorials</h2>
    <ol className="tutorial-list">
      <li>
        <ILink key="l-started" href="./getting-started" >
          Getting started
        </ILink>
      </li>
      <li>
        <ILink key="l-jsx" href="./jsx-components" >
          JSX components
        </ILink>
      </li>
      <li>
        <ILink key="l-useful" href="./useful-tips" >
          Useful tips
        </ILink>
      </li>
      <li>
        <ILink key="l-server-modules" href="./server-modules" >
          Server modules
        </ILink>
      </li>
      <li>
        <ILink key="l-db-tables" href="./db-tables" >
          Database tables
        </ILink>
      </li>
    </ol>
  </div>;
}





async function getSubpageComponent(filepath) {
  try {
    return await import(filepath);
  }
  catch (err) {
    console.error(err);
    return undefined;
  }
}