import {useState, createContext, useContext, useEffect} from "react";
import {useQuery} from "./DBRequests.js";
import {ColumnContext} from "./contexts/ColumnContext.js";



export const EntityTitle = ({entID, isLink, recLevel, maxRecLevel}) => {
  recLevel ??= 0;
  maxRecLevel ??= 3;

  const [results, setResults] = useState([]);
  useQuery(setResults, {
    req: "ent",
    id: entID,
  });

  // Before results is fetched, render this:
  if (typeof results[0] === "undefined") {
    return (
      <EntityTitlePlaceholder entID={entID} isLink={isLink} />
    );
  }

  // Afterwards, first extract the needed data from results[0].
  const [typeID, cxtID, defStr] = (results[0][0] ?? []);

  // If the entity is a template entity (typeID == 3) or if it has no context,
  // we only need to to render the defining string:
  let titleContent;
  if (!cxtID || typeID == 3) {
    titleContent = defStr;
  
  // Else, the entity is derived from a template. But if the recursion level
  // has reached maxRecLevel, simply render the entity ID instead.
  } else if (recLevel >= maxRecLevel) {
    titleContent = (
      <EntityID entID={entID}/>
    );

  // And if not maxRecLevel is reached, render a TemplateInstanceTitle.
  } else {
    let tmplChildren = getTemplateChildren(
      defStr, false, recLevel, maxRecLevel
    );
    titleContent = (
      <TemplateInstance 
        tmplID={cxtID} tmplChildren={tmplChildren} isCut={true}
      />
    );
  }

  if (isLink) {
    return (
      <EntityLink entID={entID}>
        {titleContent}
      </EntityLink>
    );
  } else {
    return (
      <>
        {titleContent}
      </>
    );
  }
};

function getTemplateChildren(defStr, isLinks, recLevel, maxRecLevel) {
  return defStr
    .replaceAll("\\\\", "&bsol;")
    .replaceAll("\\|", "&#124;")
    .split("|")
    .map(val => (
      /^#[1-9][0-9]*$/.test(val) ? (
        <span className="template-child">
          <EntityTitle entID={val.substring(1)}
            isLink={isLinks} recLevel={recLevel + 1} maxRecLevel={maxRecLevel}
          />
        </span>
      ) : (
        <span className="template-child">
          {val}
        </span>
      )
    ));
}


export const TemplateInstance = ({tmplID, tmplChildren, isCut}) => {
  const [results, setResults] = useState([]);
  useQuery(setResults, 0, {
    req: "ent",
    id: tmplID,
  });

  // Before results is fetched, render this:
  if (typeof results[0] === "undefined") {
    return (
      <span style={{display: "none"}}>
        {tmplChildren.map((val, ind) => (
          <span key={-ind - 1}>
            {val}
          </span>
        ))}
      </span>
    );
  }

  // Afterwards, first extract the needed data from results[0].
  const [, , tmplDefStr] = (results[0][0] ?? []);

  // Tranform the template into an array of arrays, first by "reducing" the
  // string by removing the unused template placeholder names, then by "cutting"
  // it up along each '{' or '}' character such that only every second entry in
  // the resulting array is rendered if isCut == true, and finally by
  // "splitting" it up further along each occurance of '&lt;&gt;' ('<>').
  const reducedTmpl = tmplDefStr
    .replaceAll("&gt;", ">")
    .replaceAll("&lt;", "<")
    .replaceAll(/<[^<>]*>/g, '<>')
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  const reducedAndCutTmpl = /[\{\}]/.test(reducedTmpl) ?
    reducedTmpl.split(/[\{\}]/) :
    ['', reducedTmpl]
  const reducedCutAndSplitTmpl = reducedAndCutTmpl.map(val => (
    val.split('&lt;&gt;')
  ));

  // If we have more tmplChildren than there are template placeholders, extend
  // reducedCutAndSplitTmpl such that these children will be added at the end
  // of the template.
  let placeholderNum = reducedCutAndSplitTmpl.reduce((acc, val) => (
    acc + val.length - 1
  ), 0);
  let excess = placeholderNum - tmplChildren.length;
  if (excess > 0) {
    let len = reducedCutAndSplitTmpl.length
    let lastTmplPart = reducedCutAndSplitTmpl[len - 1];
    let prevEnd = lastTmplPart.pop();
    let separator = '<span class="extra-children-separator">, </span>'
    lastTmplPart.push(prevEnd + separator);
    while (excess > 1) {
      lastTmplPart.push(separator);
    }
    lastTmplPart.push('');
  }
  // TODO: Change the above so that this last step is done before "cutting,"
  // and also find a more clear representation and name for e.g. 
  // "reducedCutAndSplitTmpl."

  // Finally create the template instance by filling in the provided template
  // children into this structure and reduce it to a JSX element.
  let i = 0;
  let len = tmplChildren.length;
  return reducedCutAndSplitTmpl.map((val, ind) => (
    <span key={ind} style={{display: (isCut && ind % 2 === 0) ? "none" : ""}}>
      {val.map((val, ind) => {
        if (ind === 0) {
          return (
            <span key={ind}>
              {val}
            </span>
          );
        } else if (i >= len) {
          <span key={ind}>
            <i class="text-warning">missing entity</i>
          </span>
        } else {
          let ret = (
            <span key={ind}>
              {tmplChildren[i]}{val}
            </span>
          );
          i++;
          return ret;
        }
      })}
    </span>
  ));
};
// TODO: Consider doing something like this again:
// export function getTitle(tmpl, defItemStrArr) {
//   return getTransformedTemplate(tmpl, defItemStrArr)
//     .replace(/^[^\{]*\{/g, "")
//     .replace(/\}[^\{]*$/g, "")
//     .replaceAll(/\}[^\{]*\{/g, "");
// }
// export function getFullTitle(tmpl, defItemStrArr) {
//   return getTransformedTemplate(tmpl, defItemStrArr)
//     .replaceAll('{', "")
//     .replaceAll('}', "");
// }


const EntityTitlePlaceholder = ({entID, isLink}) => <span></span>;

const EntityLink = ({entID, children}) => {
  const [, columnManager] = useContext(ColumnContext);

  return (
    <span className="entity-link clickable-text" onClick={() => {
      columnManager.openColumn(entID);
    }}>
      {children}
    </span>
  );
};

export const EntityID = ({entID, isLink}) => {
  const entityID = (
    <span className="entity-id">#{entID}</span>
  );
  if (isLink) {
    return (
      <EntityLink entID={entID}>
        {entityID}
      </EntityLink>
    );
  } else {
    return (
      <>
        {entityID}
      </>
    );
  }
};





export const FullEntityTitle = ({entID, maxRecLevel}) => {
  maxRecLevel ??= 4;

  const [results, setResults] = useState([]);
  useQuery(setResults, 0, {
    req: "ent",
    id: entID,
  });

  // Before results is fetched, render this:
  if (typeof results[0] === "undefined") {
    return (
      <EntityTitlePlaceholder entID={entID} />
    );
  }

  // Afterwards, first extract the needed data from results[0].
  const [typeID, cxtID, defStr] = (results[0][0] ?? []);

  // If the entity is a template entity (typeID == 3) or if it has no context,
  // we only need to to render the type followed by a separator followed by the
  // defining string:
  let titleContent;
  if (!cxtID || typeID == 3) {
    titleContent = defStr;
  
  // Else, the entity is derived from a template. The full title should not be
  // "cut", meaning that all parts of it will be rendered despite the curly
  // braces (which will be removed), and each reference-type template child
  // should be a link on its own (isLinks = true).
  } else {
    let tmplChildren = getTemplateChildren(defStr, true, 0, maxRecLevel);
    titleContent = (
      <TemplateInstance 
        tmplID={cxtID} tmplChildren={tmplChildren} isCut={false}
      />
    );
  }

  return (
    <span className="full-entity-title">
      <EntityTitle entID={typeID} isLink={true} />
      <span className="type-separator"> &#9656; </span>
      {titleContent}
    </span>
  );
};





export const ContextDisplay = ({entID}) => {
  const [results, setResults] = useState([]);
  useQuery(setResults, 0, {
    req: "ent",
    id: entID,
  });

  // Before results is fetched, render this:
  if (typeof results[0] === "undefined") {
    return (
      <EntityTitlePlaceholder entID={entID} />
    );
  }

  // Afterwards, first extract the needed data from results[0].
  const [typeID, cxtID, defStr] = (results[0][0] ?? []);

  // If the type can have no context, return an empty context display.
  if (typeID == 1 || 4 <= typeID && typeID <= 8) {
    return (
      <span className="context-display"></span>
    );
  }

  // Else set the appropriate label and append the EntityTitle of context.
  let label;
  if (typeID == 3) {
    label = 'Type of derived entities: ';
  } else {
    label = 'Template: ';
  }
  if (cxtID) {
    return (
      <span className="context-display">
        {label}
        <EntityTitle entID={cxtID} isLink={true}/>
      </span>
    );
  } else {
    return (
      <span className="context-display">
        {label}
        <i>none</i>
      </span>
    );
  }
};
