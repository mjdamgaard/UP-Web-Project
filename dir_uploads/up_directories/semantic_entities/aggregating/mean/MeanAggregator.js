

import {Aggregator} from "../Aggregator.js";

const updatesSMPath = abs("./updates.sm.js");
const aggrPath = abs("./aggregates.btt");


// TODO: This aggregator has some faults as of yet, as stated in
// ./updates.sm.js.


export class MeanAggregator extends Aggregator {
  constructor() {
    super(updatesSMPath, aggrPath);
  }
}

export {MeanAggregator as default};
