import {useState, useEffect, useMemo, useContext} from "react";
import {AccountManagerContext} from "./AccountContext.js";
import {useQuery} from "../hooks/DBRequests.js";

import {EntityTitle} from "./entity_titles/EntityTitles.js";
import {DropdownBox, DropdownMenu} from "./DropdownBox.js";
import {EntityIDDisplay} from "../components_02/app_pages/entity_pages/EntityPage.js";
// import {} from "./InstListDisplay.js";
import {RatingDisplay} from "./Ratings.js";
import {InstListDisplay} from "./InstListDisplay.js";
import {
  SimpleInstListGenerator, MaxRatingInstListCombiner
} from "../classes/InstListGenerator.js";

// const EntityTitle = () => <template></template>;
const TextDataDisplayElement = () => <template></template>;
const FullEntityTitle = () => <template></template>;
// const DefStrDisplayElement = () => <template></template>;



// Maybe we don't want all the elements to rerender, if the user changes the
// instance set structure (state), so let us, at least for this implementation,
// just let the "element rating display" show the value that was calculated by
// the combineProcedure.



export const GeneralEntityElement = ({entID, combScore, listGenerator}) => {
  return (
    <div className="general-entity-element">
      <div>
        <h4>
          <EntityTitle entID={entID} isLink={true} />
        </h4>
        {/* TODO: Make the score update when user logs in and out. */}
        <ElementRatingDisplay combScore={combScore} />
      </div>
      <DropdownBox>
        <div className="general-element-dropdown-page">
          <div>Full title: <FullEntityTitle entID={entID} /></div>
          <div><EntityIDDisplay entID={entID} /></div>
          <SetCategoriesRatingsDisplay
            entID={entID} listGenerator={listGenerator}
          />
        </div>
      </DropdownBox>
    </div>
  );
};



export const ElementRatingDisplay = ({combScore}) => {
  return (
    <div className="element-rating-display">
      {(combScore / 6553.5).toFixed(1)}
    </div>
  );
};



export const SetCategoriesRatingsDisplay = ({entID, listGenerator}) => {
  const catKeys = listGenerator.getCatKeys();
  const children = catKeys.map((val) => (
    <RatingDisplay key={JSON.stringify(val.catSK ?? val.catID)}
      catKey={val} instID={entID}
    />
  ));

  return (
    <div className="set-categories-ratings-display">
      {children}
    </div>
  );
};










export const SemanticPropertyElement = ({entID, ownerEntID}) => {
  return (
    <div>
      <DropdownMenu title={<EntityTitle entID={entID} />}>
        <SemanticProperty entID={entID} ownerEntID={ownerEntID} />
      </DropdownMenu>
    </div>
  );
};


export const SemanticProperty = ({entID, ownerEntID}) => {
  const [results, setResults] = useState({});
  useQuery(results, setResults, {
    req: "ent",
    id: entID,
  });

  if (!results.isFetched) {
    return (
      <div>
      </div>
    );
  }

  const [, , defStr] = (results.data[0] ?? []);
  
  return (
    <SemanticPropertyFetched
      entID={entID} ownerEntID={ownerEntID} defStr={defStr}
    />
  );
};

export const SemanticPropertyFetched = ({entID, ownerEntID, defStr}) => {
  const accountManager = useContext(AccountManagerContext);
  
  const [defItemStrArr, ] = useState(
    defStr
      .replaceAll("\\\\", "\\\\1")
      .replaceAll("\\|", "\\\\2")
      .split("|")
      .map(val => val
        .replaceAll("\\\\2", "|")
        .replaceAll("\\\\1", "\\")
      )
  );
  
  const type = defItemStrArr[1];
  const quantityWord = defItemStrArr[2];
  var elemContent, initialNum, incrementNum;
  switch (type) {
    case "#7": // the "Text data" type.
      elemContent = TextDataDisplayElement;
    break;
    case "#64": // the "Time" type.
      elemContent = DefStrDisplayElement;
    break;
    // TODO: Add more of these type--CL pairings when needed.
    default:
      elemContent = GeneralEntityElement;
  }
  switch (quantityWord) {
    case "one":
      initialNum = 1;
      incrementNum = 1;
    break;
    case "few":
      initialNum = 6;
      incrementNum = 6;
    break;
    case "many":
      initialNum = 50;
      incrementNum = 50;
    break;
    default:
      if (/^[1-9][0-9]{0,2}$/.test(quantityWord)) {
        initialNum = parseInt(quantityWord);
        incrementNum = parseInt(quantityWord);
      } else {
        initialNum = 50;
        incrementNum = 50;
      }
  }  
  const [lg, ] = useState(
    new SimpleInstListGenerator(
      {catSK: {cxtID: 21, defStr: "#" + entID + "|#" + ownerEntID}},
      accountManager,
      // null, // num.
      initialNum, //TODO: Implement button to increase InstListContainer, and
      // change so that initialNum is handed to the InstListContainer instead.
      36864, // ratingLo (= CONV("9000", 16, 10)).
    )
  );

  return (
    <div>
      <InstListDisplay
        listGenerator={lg}
        ElemComponent={elemContent}
      />
    </div>
  );
};




export const DefStrDisplayElement = ({entID}) => {
  return (
    <EntityTitle entID={entID} />
  );
};






// export var categoryForSortingElementCL = new ContentLoader(
//   "CategoryForSortingElement",
//   /* Initial HTML template */
//   '<div>' +
//     '<<EntityTitle>>' +
//   '</div>',
//   sdbInterfaceCL
// );
