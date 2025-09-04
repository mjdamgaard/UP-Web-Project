
import {ScoredList} from "../ScoredList.js";



// A class to generate a list that is moderated by a single user group, using
// some quality to rate the users on the moderated list, a score handler to
// aggregate those scores, and a conversion function to turn these aggregated
// scores into user weights.
export class ModeratedList extends ScoredList {
  
  constructor(
    ownEntPath, userGroupIdent, qualIdent, scoreHandlerIdent, convert
  ) {
    super(ownEntPath, abs("./comb_lists.bbt"), abs("./comb_lists.sm.js"));

    // These attributes are used by the update SM.
    this.userGroupIdent = userGroupIdent;
    this.qualIdent = qualIdent;
    this.scoreHandlerIdent = scoreHandlerIdent;
    this.convert = convert;

    this["Documentation"] = <div>
      <h1>{"Moderated list"}</h1>
      <p>{
        "TODO: Make."
      }</p>
    </div>;
  }

}


export {ModeratedList as default};
