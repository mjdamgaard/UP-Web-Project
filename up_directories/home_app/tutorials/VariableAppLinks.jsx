
import {hasType} from 'type';
import * as InputText from 'InputText.jsx';
import * as Label from 'Label.jsx';
import * as ILink from 'ILink.jsx';


export function initialize() {
  return {idKey: Symbol("home-dir-id-input")};
}

export function render() {
  let {idKey, homeDirID = ""} = this.state;

  let linkChildren = !homeDirID ? <i>
    Insert the HOME_DIR_ID in the field above to get a list of useful links.
  </i> : <ol>
    <li>
      Link to home directory: {" "}
      <ILink key="link-home-dir" href={"/f/1/" + homeDirID}>
        up-web.org/f/1/{homeDirID}
      </ILink>
    </li>
    <li>
      Link to app entity definition: {" "}
      <ILink key="link-comp-ent" href={"/f/1/" + homeDirID + "/em.js;get/app"}>
        up-web.org/f/1/{homeDirID}/em.js;get/app
      </ILink>
    </li>
    {/* <li>
      Link to component entity module: {" "}
      <ILink key="link-comp-em" href={"/f/1/" + homeDirID + "/em.js"}>
        up-web.org/f/1/{homeDirID}/em.js
      </ILink>
    </li> */}
  </ol>;

  return (
    <div className="variable-app-links">
      <div className="form">
        <Label key="l" forKey={idKey}>
          <b>Insert your home directory ID here:</b>
        </Label>
        {" "}
        <InputText key="i" idKey={idKey} size={5} onInput={({value}) => {
          if (hasType(value, "hex-string")) {
            this.setState(state => ({...state, homeDirID: value}))
          }
        }}/>
      </div>
      <div className="link list">
        {linkChildren}
      </div>
    </div>
  );
}