
import {map, slice, join} from 'array';
import {fetchEntityProperty} from "/1/1/entities.js";
import * as ILink from 'ILink.jsx';



export function initialize({urlEntIDs}) {
  let linkArrProm = getILinks(urlEntIDs);
  linkArrProm.then(links => {
    this.setState(state => ({...state, links: links}));
  });
  return {links: false};
}


export function render({urlEntIDs}) {
  let {links} = this.state;
  if (!links) {
    return <div className="nav-path fetching">{"..."}</div>;
  }
  return <div className="nav-path">{
    map(links, link => [" / ", link])
  }</div>;
}



// getILinks() resolves an array of ILinks based on the urlEntIDs.
async function getILinks(urlEntIDs) {
  // Construct and return the array of ILinks.
  let ret = new MutableArray();
  let len = urlEntIDs.length;
  for (let i = 0; i < len; i++) {
    let href = "~/" + join(slice(urlEntIDs, 0, i + 1), "/");
    let entID = urlEntIDs[i];
    let name = await fetchEntityProperty(entID, "Name");
    ret[i] = <ILink key={"l-" + i} href={href} >{name}</ILink>;
  }

  return [...ret];
}

