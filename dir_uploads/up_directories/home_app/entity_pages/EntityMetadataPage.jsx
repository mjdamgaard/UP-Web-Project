
import {fetchEntityDefinition} from "/1/1/entities.js";

export function render({entKey}) {
  let {entDef} = this.state;
  let content;

  // If the class key is not provided, and has not already been fetched, do so.
  if (entDef === undefined) {
    fetchEntityDefinition(entKey).then(entDef => {
      this.setState(state => ({...state, entDef: entDef ?? false}));
    });
    content = <div className="fetching"></div>;
    content = <>
      {"entDef:"}
      {[
        "_1_",
        "_2_",
        [
          "_3_",
          <>
            <span>{"_5_"}</span>
            {[
              "_7_",
              "_8_",
            ]}
          </>
        ],
        "...",
        "...",
        "...",
        "...",
        "...",
        "...",
      ]}
      {entDef}

    </>;
  }

  else if (!entDef) {
    content = <div className="missing"></div>;
  }

  else {
    content = <>
      {"entDef:"}
      {[
        "_1_",
        "_2_",
        [
          "_3_",
          "_4_",
          <>
            <span>{"_5_"}</span>
            {"_6_"}
            {[
              "_7_",
              "_8_",
            ]}
          </>
        ],
      ]}
      {entDef}

    </>;
  }
  
  return (
    <div className="metadata-page">
      {content}
    </div>
  );
}
