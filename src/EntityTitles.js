import {useState, createContext, useContext, useEffect} from "react";
import {useQuery} from "./DBRequests.js";
import {ColumnContext} from "./contexts/ColumnContext.js";
import {ExpandableSpan} from "./DropdownBox.js";

const ConcatenatedEntityTitle = () => <template></template>;
// const TemplateInstanceEntityTitle = () => <template></template>;
// const InvalidEntityTitle = () => <template></template>;


export const EntityTitle = ({entID, isLink, isFull}) => {
  isLink ??= true;
  isFull ??= false;

  const [results, setResults] = useState([]);
  useQuery(results, setResults, {
    req: "ent",
    id: entID,
  });

  // Before results is fetched, render this:
  if (!results.isFetched) {
    return (
      <EntityTitlePlaceholder entID={entID} isLink={isLink} />
    );
  }
  
  // Afterwards, first extract the needed data from results.data[0].
  const [def] = (results.data[0] ?? []);
  

  // If def codes for a concatenated string (starting with an unescaped '#'),
  // return a ConcatenatedEntityTitle.
  if (def[0] === "#") {
    return (
      <ConcatenatedEntityTitle def={def} entID={entID}
        isLink={isLink} isFull={isFull}
      />
    );
  }
  
  // Else encode the definition such that "\\"-->"\\0", "\|"-->"\\1",
  // "\#"-->"\\2".
  const defF2 = convertFromF1toF2(def);

  // And return EntityTitleFromFullDef directly.
  return (
    <EntityTitleFromDefF2 defF2={defF2} entID={entID}
      isLink={isLink} isFull={isFull}
    />
  );
}

function convertFromF1toF2(def) {
  return def
    .replaceAll("\\\\", "\\\\0")
    .replaceAll("\\|", "\\\\1")
    .replaceAll("\\#", "\\\\2");
}

function convertFromF2toF1(defF2) {
  return defF2
    .replaceAll("\\\\2", "\\#")
    .replaceAll("\\\\1", "\\|")
    .replaceAll("\\\\0", "\\\\");
}

function convertFromF2toF0(defF2) {
  return defF2
    .replaceAll("\\\\2", "#")
    .replaceAll("\\\\1", "|")
    .replaceAll("\\\\0", "\\");
}

const EntityTitleFromDefF2 = ({defF2, entID, isLink, isFull}) => {

  // Split defF2 up along '|' into the full title, the
  // specification position code, the capitalization (and accenting) code,
  // and the link code.
  const [fullTitleF2, specPosCode, capCode, linkCode, excessCode] = defF2
    .split("|");


  // If excessCode is not undefined, return an InvalidEntityTitle.
  if (typeof excessCode !== "undefined") {
    return (
      <InvalidEntityTitle entID={entID} isLink={isLink} >
        {convertFromF2toF1(defF2)}
      </InvalidEntityTitle>
    );
  }

  // If def has single backslashes that does not escape a special character,
  // or if contains unescaped '#'s (which should only be part of concatenated
  // strings), return an InvalidEntityTitle.
  const defHasInvalidEscapes = defF2.replaceAll("\\\\", "").includes("\\");
  const defHasUnescapedNumberSigns = defF2.includes("#");
  if (defHasInvalidEscapes || defHasUnescapedNumberSigns) {
    return (
      <InvalidEntityTitle entID={entID} isLink={isLink} >
        {convertFromF2toF1(defF2)}
      </InvalidEntityTitle>
    );
  }

  // Interpret the specPosCode by inserting a delimiter ('\\\\3') where the
  // divide should be. (Call this format F2D, where D stands for 'delimiter' or
  // 'divided'.)
  const fullTitleF2D = getDividedString(fullTitleF2, specPosCode);

  // Get the capitalized and accented (when implemented) fullTitleF2D. (Here
  // we'll add a C to denote 'capitalized (and accented).')
  const fullTitleF2DC = getCapitalizedAndAccentedString(fullTitleF2D, capCode);

  // If !isFull, we simply need to return a span containing fullTitleF2DC,
  // but only after removing the specification, and after converting from F2
  // to F0, which is the WYSIWYG format
  if (!isFull) {
    const shortTitleF2DC = fullTitleF2DC.split('\\\\3')[0];
    const shortTitleF0DC = convertFromF2toF0(shortTitleF2DC);
    if (isLink) {
      return (
        <span className="entity-title">
          <EntityLink entID={entID} >
            {shortTitleF0DC}
          </EntityLink>
        </span>
      );
    } else {
      return (
        <span className="entity-title">
          {shortTitleF0DC}
        </span>
      );
    }
  }

  // Else, if isLink, we don't need to insert child links. All we need to do
  // is to remove the spec delimiter ('\\\\3'), then render the whole thing
  // as a link, without rendering the spec any differently from the short title.

  // Else return title as a link iff isLink, followed by a button to expand
  // the specification.
  if (isLink) {
    const fullTitleF0C = convertFromF2toF0(fullTitleF2DC.replace('\\\\3', ''));
    return (
      <span className="entity-title">
        <EntityLink entID={entID} >
          {fullTitleF0C}
        </EntityLink>
      </span>
    );
  }

  // Else return the full title, with child links inserted (if linkCode is not
  // undefined).
  return (
    <FullEntityTitleFromFullTitleF2DC entID={entID}
      fullTitleF2DC={fullTitleF2DC} linkCode={linkCode}
    />
  );
};



const FullEntityTitleFromFullTitleF2DC = ({
  entID, fullTitleF2DC, linkCode
}) => {

  const [results, setResults] = useState([]);
  useQuery(results, setResults, {
    req: "ent",
    id: entID,
  });

  const referenceArr = modDef.match(/@[^.]*./g) ?? [];

  const referencesAreWellFormed = referenceArr.reduce((acc, val) => 
    acc && /@[1-9[0-9]*]/.test(val), true
  );
  if (!referencesAreWellFormed) {
    return (
      <InvalidEntityTitle entID={entID} isLink={false} >
        {referenceArr.join()}
      </InvalidEntityTitle>
    );
  }

  const encodedBoilerplateArr = modDef.split(/@[^.]*./g);

  const boilerplateIsWellFormed = boilerplateArr.reduce((acc, val) => 
    acc && /^[^#@]+$/.test(val), true
  );
  if (!boilerplateIsWellFormed) {
    return (
      <InvalidEntityTitle entID={entID} isLink={false} >
        {boilerplateArr.join("@[...]")}
      </InvalidEntityTitle>
    );
  }

  const boilerplateArr = modDef.split(/@[^.]*./g).map(val => val
    .replaceAll("\\\\0", "\\")
    .replaceAll("\\\\1", "|")
    .replaceAll("\\\\2", "@")
    .replaceAll("\\\\3", "#")
    // .replaceAll("\\\\4", "%")
  );


  // // If there are no references, return the decoded modDef contained in
  // // boilerplateArr[0].
  // if (referenceArr.length == 0) {
  //   return (
  //     <EntityLink entID={entID} >
  //       {boilerplateArr[0]}
  //     </EntityLink>
  //   );
  // }

  // Compute the HTML for the links based on the references. If maxRecLevel
  // is reached, these are EntityID elements, which only shows the entity ID.
  const linkArr = (recLevel >= maxRecLevel) ?
    referenceArr.map((val, ind) => (
      <EntityID key={2 * ind + 1} entID={val.slice(1, -1)} />
    )) :
    referenceArr.map((val, ind) => (
      <EntityTitle key={2 * ind  + 1} entID={val.slice(1, -1)}
        isLink={!isLink && recLevel == 1}
        recLevel={recLevel + 1} maxRecLevel={maxRecLevel}
      />
    ));
  
  const children = boilerplateArr.map((val, ind) => (
    <>
      <span key={2 * ind} >{val}</span>
      {linkArr[ind] ?? ""}
    </>
  ));
  

  // Return a link if isLink, or else just return a span of these children.
  if (isLink) {
    return (
      <EntityLink entID={entID}>
        {children}
      </EntityLink>
    );
  } else {
    return (
      <span>
        {children}
      </span>
    );
  }
};





const TemplateInstanceEntityTitle = ({
  def, entID, isLink, isFull, recLevel, maxRecLevel
}) => {
  const [reqData, setReqData] = useState({});
  const [results, setResults] = useState({});
  useQuery(results, setResults, reqData);

  // Check if template closure isn't well-formed.
  if (!/^@[1-9][0-9]*(\.[1-9][0-9])+$/.test(def)) {
    return (
      <InvalidEntityTitle entID={entID} isLink={isLink} >
        {def}
      </InvalidEntityTitle>
    );
  }

  // Else, parse the ID array and fetch the template's definition.
  const idArr = def.match(/[1-9][0-9]*/g);
  setReqData(idArr.map(val => ({
    req: "ent",
    id: val,
  })));


  // Before results[0] is fetched, render a placeholder
  if (!results[0].isFetched) {
    return (
      <EntityTitlePlaceholder entID={entID} isLink={isLink} />
    );
  }
  
  // Afterwards, first extract the needed data from results[0].data[0].
  const [templateDef] = (results[0].data[0] ?? []);

  // ..Then encode and modify the templateDef, substitute the '%'-placeholders
  // for '@'-references and give it to a EntityTitleFromModDef, and if
  // isFull, also insert a symbol with a link to the template at the
  // beginning... (TODO...)
};







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



export function getCapitalizedAndAccentedString(str, capCode) {
  return str; // TODO: Implement.
}


const EntityTitlePlaceholder = ({entID, isLink}) => <span></span>;

const InvalidEntityTitle = ({entID, isLink, children}) => {
  if (isLink) {
    return (
      <span className="invalid-title">
        <EntityLink entID={entID}>
          {children}
        </EntityLink>
      </span>
    );
  } else {
    return (
      <span className="invalid-title">
        {children}
      </span>
    );
  }
};


















// TODO: Continue remaking:

function getTemplateChildren(defStr, isLinks, recLevel, maxRecLevel) {
  return defStr
    .replaceAll("\\\\", "\\\\1")
    .replaceAll("\\|", "\\\\2")
    .split("|")
    .map(val => (
      val
      .replaceAll("\\\\2", "|")
      .replaceAll("\\\\", "\\")
    ))
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
  useQuery(results, setResults, {
    req: "ent",
    id: tmplID,
  });

  // Before results is fetched, render this:
  if (!results.isFetched) {
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
  const [, , tmplDefStr] = (results.data[0] ?? []);

  // Transform the template into an array of arrays, first by "reducing" the
  // string by removing the unused template placeholder names, then by "cutting"
  // it up along each '{' or '}' character such that only every second entry in
  // the resulting array is rendered if isCut == true, and finally by
  // "splitting" it up further along each occurrence of '&lt;&gt;' ('<>').
  const reducedTmpl = tmplDefStr
    // .replaceAll("&gt;", ">")
    // .replaceAll("&lt;", "<")
    .replaceAll(/<[^<>]*>/g, '<>')
    // .replaceAll("<", "&lt;")
    // .replaceAll(">", "&gt;");
  const reducedAndCutTmpl = /[\{\}]/.test(reducedTmpl) ?
    reducedTmpl.split(/[\{\}]/) :
    ['', reducedTmpl]
  const reducedCutAndSplitTmpl = reducedAndCutTmpl.map(val => (
    // val.split('&lt;&gt;')
    val.split('<>')
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







export const FullEntityTitle = ({entID, maxRecLevel}) => {
  maxRecLevel ??= 4;

  const [results, setResults] = useState([]);
  useQuery(results, setResults, {
    req: "ent",
    id: entID,
  });

  // Before results is fetched, render this:
  if (!results.isFetched) {
    return (
      <EntityTitlePlaceholder entID={entID} />
    );
  }

  // Afterwards, first extract the needed data from results[0].
  const [typeID, cxtID, defStr] = (results.data[0] ?? []);

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
  useQuery(results, setResults, {
    req: "ent",
    id: entID,
  });
  
  // Before results is fetched, render this:
  if (!results.isFetched) {
    return (
      <></>
    );
  }
  
  // Afterwards, first extract the needed data from results[0].
  const [typeID, cxtID, defStr] = (results.data[0] ?? []);
  
  // If the type can have no context, return an empty context display.
  if (typeID == 1 || 4 <= typeID && typeID <= 8) {
    return (
      <></>
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
      <span>
        {label}
        <EntityTitle entID={cxtID} isLink={true}/>
      </span>
    );
  } else {
    return (
      <span>
        {label}
        <i>none</i>
      </span>
    );
  }
};
