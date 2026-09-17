
import {hasType} from 'type';
import * as InputText from 'InputText';
import * as Label from 'Label';
import * as ILink from 'ILink';

import dependencies from "~/dependencies.js";

const {this: {
  directories: {
    "file_browser": fileBrowserDirID,
  },
}} = dependencies;

export function initialize() {
  let homeDirID = this.getHistoryState(homeDirID => 
    this.setState(state => ({...state, homeDirID: homeDirID || ""}))
  );
  return {
    idKey: Symbol("home-dir-id-input"),
    homeDirID: homeDirID || "",
  };
}

export function render() {
  let {idKey, homeDirID} = this.state;

  let linkChildren = !homeDirID ? <i>
    Insert the HOME_DIR_ID to get a list of useful links.
  </i> : <ol>
    <li>
      Link to app: {" "}
      <ILink key="link-app" href={"/o-" + homeDirID}>
        up-web.org/o-{homeDirID}
      </ILink>
    </li>
    <li>
      Link to server-side files: {" "}
      <ILink key="link-home-dir"
        href={"/" + fileBrowserDirID + "/files/1/" + homeDirID}
      >
        up-web.org/{fileBrowserDirID}/files/1/{homeDirID}
      </ILink>
    </li>
  </ol>;

  return (
    <div className="variable-app-links">
      <div className="form">
        <Label key="l" forKey={idKey}>
          <b>Insert your home directory ID here:</b>
        </Label>
        {" "}
        <InputText key="i" idKey={idKey} size={5} value={homeDirID}
          onInput={({value}) => {
            if (hasType(value, "hex-string")) {
              this.setState(state => ({...state, homeDirID: value}));
              this.setHistoryState(value);
            }
          }}
        />
      </div>
      <div className="link list">
        {(linkChildren)}
      </div>
    </div>
  );
}