
import {parseFloat, isNaN} from 'number';
import {trim} from 'string';
import * as AddEntityMenu from "./AddEntityMenu.jsx";
import * as InputText from 'InputText.jsx';



export function render({qualKeyArr}) {
  let {menuExtension} = this.state;

  return (
    <div className="entity-list-menu">
      <div>
        <button onClick={() => {
          this.setState(state => ({
            ...state, menuExtension: <AddEntityMenu key="add"
              qualKeyArr={qualKeyArr}
            />
          }));
        }}>{"Add new"}</button>
        <div>
          <span>{"Minimum score:"}</span>
          <InputText key="msi" onChange={() => this.do("updateListLimits")} />
        </div>
        <div>
          <span>{"Minimum weight:"}</span>
          <InputText key="mwi" onChange={() => this.do("updateListLimits")} />
        </div>
      </div>
      <div className="menu-extension">{menuExtension}</div>
    </div>
  );
}


export const actions = {
  "updateListLimits": function() {
    let minScoreTextVal = this.call("msi", "getValue");
    let minWeightTextVal = this.call("mwi", "getValue");
    let minScore = (minScoreTextVal !== undefined) ?
      parseFloat(minScoreTextVal) : undefined;
    let minWeight = (minScoreTextVal !== undefined) ?
      parseFloat(minWeightTextVal) : undefined;
    
    // Do nothing if neither texts are defined, or if one of them is defined
    // but ill-formed as a number.
    if (
      minScore === undefined && minWeight === undefined ||
      minScore !== undefined &&
        (isNaN(minScore) || minScore != trim(minScoreTextVal)) ||
      minWeight !== undefined &&
        (isNaN(minWeight) || minWeight != trim(minWeightTextVal))
    ) {
      return;
    }
    
    // Else trigger 'updateListLimits' in the parent EntityList.
    this.trigger("updateListLimits", [minScore, minWeight]);
  }
};