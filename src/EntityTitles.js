import {useState, createContext, useContext, useEffect} from "react";
import {useQuery} from "./DBRequests.js";
import {ColumnContext} from "./contexts/ColumnContext.js";



export const EntityTitle = ({entID, isLink, recLevel, maxRecLevel}) => {
  recLevel ??= 0;
  maxRecLevel ??= 3;

  const [results, setResults] = useState([]);
  useQuery(setResults, 0, {
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
    let tmplChildren = getTemplateChildren(defStr, recLevel, maxRecLevel);
    titleContent = (
      <TemplateInstance 
        tmplID={cxtID} tmplChildren={tmplChildren} isLinks={false} isCut={true}
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

function getTemplateChildren(defStr, recLevel, maxRecLevel) {
  return defStr
    .replaceAll("\\\\", "&bsol;")
    .replaceAll("\\|", "&#124;")
    .split("|")
    .map(val => (
      /^#[1-9][0-9]*$/.test(val) ? (
        <EntityTitle entID={val.substring(1)}
          isLink={false} recLevel={recLevel + 1} maxRecLevel={maxRecLevel}
        />
      ) : (
        <>
          {val}
        </>
      )
    ));
}

export const TemplateInstance = ({tmplID, tmplChildren, isLinks, isCut}) => {
  const [results, setResults] = useState([]);
  useQuery(setResults, 0, {
    req: "ent",
    id: tmplID,
  });

  // Before results is fetched, render this:
  if (typeof results[0] === "undefined") {
    return (
      <EntityTitlePlaceholder />
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
  placeholderNum = reducedCutAndSplitTmpl.reduce((acc, val) => (
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

  // Finally create the template instance by filling in the provided template
  // children into this structure and reduce it to a JSX element.
  let i = 0;
  return reducedCutAndSplitTmpl.map((val, ind) => (
    <span key={ind} style={{display: (isCut && ind % 2 === 0) ? "none" : ""}}>
      {val.map(val => (
        {...hm}
      ))}
    </span>
  ));
};


export function getTransformedTemplate(tmpl, defItemStrArr) {
  let ret = tmpl
    .replaceAll("&gt;", ">")
    .replaceAll("&lt;", "<")
    .replaceAll(/<[^<>]*>/g, '<>')
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  let regex = /&lt;&gt;/;
  let i = 0;
  while (regex.test(ret)) {
    ret = ret.replace('&lt;&gt;',
      '<span class="def-item">' +
        (defItemStrArr[i] ?? '<i>missing item</i>') +
      '</span>'
    );
    i++;
  }
  // append any extra def items that are not expected by the template.
  let len = defItemStrArr.length;
  if (i < len - 1) {
    ret += '&blacktriangleright; <span class="extra-def-items">'
      + defItemStrArr[i];
    i++;
    while (i < len - 1) {
      ret += '<span class="separator">; </span>' +
        '<span class="def-item">' + defItemStrArr[i] + '</span>'
      i++;
    }
    ret += '</span>'
  }
  return ret;
}
export function getTitle(tmpl, defItemStrArr) {
  return getTransformedTemplate(tmpl, defItemStrArr)
    .replace(/^[^\{]*\{/g, "")
    .replace(/\}[^\{]*$/g, "")
    .replaceAll(/\}[^\{]*\{/g, "");
}
export function getFullTitle(tmpl, defItemStrArr) {
  return getTransformedTemplate(tmpl, defItemStrArr)
    .replaceAll('{', "")
    .replaceAll('}', "");
}





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



export var entityTitleCL = new ContentLoader(
  "EntityTitle",
  /* Initial HTML template */
  '<span></span>',
  sdbInterfaceCL
);
entityTitleCL.addCallback("data", function(data) {
  data.copyFromAncestor([
    "entID",
    "maxRecLevel",
  ]);
  data.copyFromAncestor(["recLevel", "isLinkArr"], 1);
  data.recLevel ??= -1;;
  data.recLevel++;
  data.maxRecLevel ??= 3;;
  data.isLinkArr ??= [true];;
  data.isFullTitle = data.getFromAncestor("isFullTitle", 1) ?? false;
});
entityTitleCL.addCallback(function($ci, data) {
  if (data.recLevel > data.maxRecLevel) {
    data.linkContent = "#" + data.entID;
    let contentKey = data.isLinkArr[data.recLevel] ?
      "EntityLink" : "EntityText";
    entityTitleCL.loadAppended($ci, contentKey, data);
    return;
  }
  let reqData = {
    req: "ent",
    id: data.entID,
  };
  dbReqManager.query($ci, reqData, data, function($ci, result, data) {
    data.typeID = (result[0] ?? [])[0];
    data.cxtID = (result[0] ?? [])[1];
    data.defStr = (result[0] ?? [])[2];
    if (!data.defStr) {
      $ci.append('<i class="text-warning">missing entity<i>')
      return;
    }
    if (!data.cxtID) {
      loadEntityTitleHTML($ci, data);
      return;
    }
    let reqData = {
      req: "ent",
      id: data.cxtID,
    };
    dbReqManager.query($ci, reqData, data, function($ci, result, data) {
      data.cxtDefStr = (result[0] ?? [])[2];
      loadEntityTitleHTML($ci, data);
    });
    // parse the defItem string array from defStr, then prefetch all
    // enitities referenced by IDs (with syntax pattern /^#[1-9][0-9]*$/),
    // but only if the current recLevel is less than maxRecLevel.
    if (data.recLevel < data.maxRecLevel) {
      data.defItemStrArr = data.defStr
        .replaceAll("\\\\", "&bsol;")
        .replaceAll("\\|", "&#124;")
        .split("|");
      data.defItemStrArr.forEach(function(val) {
        if (/^#[1-9][0-9]*$/.test(val)) {
          let reqData = {
            req: "ent",
            id: val.substring(1),
          };
          dbReqManager.query($ci, reqData, function($ci, result) {});
        }
      });
    }
  });
});

export function loadEntityTitleHTML($ci, data) {
  if (!data.cxtID || data.typeID == 3) {
    if (!data.isFullTitle) {
      data.linkContent = data.defStr;
      let contentKey = data.isLinkArr[data.recLevel] ?
        "EntityLink" : "EntityText";
      entityTitleCL.loadAppended($ci, contentKey, data);
    } else {
      let reqData = {
        req: "ent",
        id: data.typeID,
      };
      dbReqManager.query($ci, reqData, data, true,
        function($ci, result, data) {
          let typeDefStr = (result[0] ?? [])[2];
          entityTitleCL.loadAppended($ci, "EntityLink", new DataNode(
            data, {entID: data.typeID, linkContent: typeDefStr}
          ));
          $ci.append(' &blacktriangleright; ');
          data.linkContent = data.defStr;
          let contentKey = data.isLinkArr[data.recLevel] ?
            "EntityLink" : "EntityText";
          entityTitleCL.loadAppended($ci, contentKey, data);
        }
      );
    }
  } else {
    let contentKey = data.isFullTitle ?
      "FullTemplateInstanceTitle" : "TemplateInstanceTitle";
    entityTitleCL.loadAppended($ci, contentKey, data);
  }
}

export var entityLinkCL = new ContentLoader(
  "EntityLink",
  /* Initial HTML template */
  '<span></span>',
  sdbInterfaceCL
);
entityLinkCL.addCallback("data", function(data) {
  data.copyFromAncestor([
    "entID",
    "linkContent",
  ]);
});
entityLinkCL.addCallback(function($ci, data) {
  $ci.addClass("clickable-text text-primary");
  $ci.append(data.linkContent);
  $ci.on("click", function() {
    $(this).trigger("open-column", ["AppColumn", data, "right"]);
    return false;
  });
});
export var entityTextCL = new ContentLoader(
  "EntityText",
  /* Initial HTML template */
  '<span></span>',
  sdbInterfaceCL
);
entityTextCL.addCallback("data", function(data) {
  data.copyFromAncestor("linkContent");
});
entityTextCL.addCallback(function($ci, data) {
  $ci.append(data.linkContent);
});

export var templateInstanceTitleCL = new ContentLoader(
  "TemplateInstanceTitle",
  /* Initial HTML template */
  '<span></span>',
  sdbInterfaceCL
);
templateInstanceTitleCL.addCallback("data", function(data) {
  data.copyFromAncestor([
    "cxtDefStr",
    "defItemStrArr",
    "recLevel", // used in order to hand this on to def item EntityTitles.
    "isLinkArr", // same.
  ]);
});
templateInstanceTitleCL.addCallback(function($ci, data) {
  data.linkContent = getTitle(data.cxtDefStr, data.defItemStrArr);
  let contentKey = data.isLinkArr[data.recLevel] ?
    "EntityLink" : "EntityText";
  templateInstanceTitleCL.loadAppended($ci, contentKey, data);
  $ci.find('.def-item').each(function() {
    let $this = $(this);
    let defItemStr = $this.html();
    if (/^#[1-9][0-9]*$/.test(defItemStr)) {
      $this.empty();
      templateInstanceTitleCL.loadAppended($this, "EntityTitle",
        new DataNode(data, {
          entID: defItemStr.substring(1),
          recLevel: data.recLevel,
          isLinkArr: data.isLinkArr,
        })
      );
    }
  });
});

export var fullTemplateInstanceTitleCL = new ContentLoader(
  "FullTemplateInstanceTitle",
  /* Initial HTML template */
  '<span></span>',
  sdbInterfaceCL
);
fullTemplateInstanceTitleCL.addCallback("data", function(data) {
  data.copyFromAncestor([
    "typeID",
    "defStr",
    "cxtDefStr",
    "defItemStrArr",
    "recLevel", // used in order to hand this on to def item EntityTitles.
    "isLinkArr", // same.
  ]);
});
fullTemplateInstanceTitleCL.addCallback(function($ci, data) {
  let reqData = {
    req: "ent",
    id: data.typeID,
  };
  dbReqManager.query($ci, reqData, data, true,
    function($ci, result, data) {
      let typeDefStr = (result[0] ?? [])[2];
      entityTitleCL.loadAppended($ci, "EntityLink", new DataNode(
        data, {entID: data.typeID, linkContent: typeDefStr}
      ));
      $ci.append('<span class="separator"> &blacktriangleright; </span>');
      data.linkContent = getFullTitle(data.cxtDefStr, data.defItemStrArr);
      let contentKey = data.isLinkArr[data.recLevel] ?
        "EntityLink" : "EntityText";
      fullTemplateInstanceTitleCL.loadAppended($ci, contentKey, data);
      $ci.find('.def-item').each(function() {
        let $this = $(this);
        let defItemStr = $this.html();
        if (/^#[1-9][0-9]*$/.test(defItemStr)) {
          $this.empty();
          templateInstanceTitleCL.loadAppended($this, "EntityTitle",
            new DataNode(data, {
              entID: defItemStr.substring(1),
              recLevel: data.recLevel,
              isLinkArr: data.isLinkArr,
            })
          );
        } else {
          if (defItemStr.substring(0, 2) === "\\#") {
            $this.html("#" + defItemStr.substring(2));
          }
        }
      });
    }
  );
});

export function getTransformedTemplate(tmpl, defItemStrArr) {
  let ret = tmpl
    .replaceAll("&gt;", ">")
    .replaceAll("&lt;", "<")
    .replaceAll(/<[^<>]*>/g, '<>')
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  let regex = /&lt;&gt;/;
  let i = 0;
  while (regex.test(ret)) {
    ret = ret.replace('&lt;&gt;',
      '<span class="def-item">' +
        (defItemStrArr[i] ?? '<i>missing item</i>') +
      '</span>'
    );
    i++;
  }
  // append any extra def items that are not expected by the template.
  let len = defItemStrArr.length;
  if (i < len - 1) {
    ret += '&blacktriangleright; <span class="extra-def-items">'
      + defItemStrArr[i];
    i++;
    while (i < len - 1) {
      ret += '<span class="separator">; </span>' +
        '<span class="def-item">' + defItemStrArr[i] + '</span>'
      i++;
    }
    ret += '</span>'
  }
  return ret;
}
export function getTitle(tmpl, defItemStrArr) {
  return getTransformedTemplate(tmpl, defItemStrArr)
    .replace(/^[^\{]*\{/g, "")
    .replace(/\}[^\{]*$/g, "")
    .replaceAll(/\}[^\{]*\{/g, "");
}
export function getFullTitle(tmpl, defItemStrArr) {
  return getTransformedTemplate(tmpl, defItemStrArr)
    .replaceAll('{', "")
    .replaceAll('}', "");
}



export var fullEntityTitleCL = new ContentLoader(
  "FullEntityTitle",
  /* Initial HTML template */
  '<<EntityTitle>>', // TODO: change to look up the username.
  sdbInterfaceCL
);
fullEntityTitleCL.addCallback("data", function(data) {
  data.isFullTitle = true;
  data.isLinkArr = [false, true];
});

export var contextDisplayCL = new ContentLoader(
  "ContextDisplay",
  /* Initial HTML template */
  '<span></span>',
  sdbInterfaceCL
);
contextDisplayCL.addCallback("data", function(data) {
  data.copyFromAncestor("entID");
});
contextDisplayCL.addCallback(function($ci, data) {
  let reqData = {
    req: "ent",
    id: data.entID,
  };
  dbReqManager.query($ci, reqData, data, function($ci, result, data) {
    let typeID = (result[0] ?? [])[0];
    let cxtID = (result[0] ?? [])[1];
    if (typeID == 1 || 4 <= typeID && typeID <= 8) {
      return;
    } else if (typeID == 3) {
      $ci.append('Type of derived entities: ');
    } else {
      $ci.append('Template: ');
    }
    if (cxtID) {
      contextDisplayCL.loadAppended($ci, "EntityTitle", new DataNode(
        data, {entID: cxtID}
      ));
    } else {
      $ci.append('<i>none</i>');
    }
  });
});
