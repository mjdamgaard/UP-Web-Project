
import * as ILink from 'ILink.jsx';
import * as EntityMetadataPage from "./EntityMetadataPage.jsx";
import {fetchEntityID} from "/1/1/entities.js";


export function render({entKey}) {
  let {entID, isFetching} = this.state;
  let link;

  if (!isFetching) {
    this.setState(state => ({...state, isFetching: true}));
    fetchEntityID(entKey).then(entID => {
      this.setState(state => ({...state, entID: entID ?? false}));
    });
  }

  if (entID === undefined) {
    link = <ILink key="l">{"..."}</ILink>;
  }

  else if (!entID) {
    link = <ILink key="l">{"missing"}</ILink>;
  }

  else {
    link = <ILink key="l" href={"~/c/" + entID}>{"View component"}</ILink>;
  }

  return <div className={
    "component-metadata-page" + (entID ? "" : " fetching")
  }>
    <h2>{link}</h2>
    <hr/>
    <EntityMetadataPage key="m" entKey={entKey} />
  </div>;
}
