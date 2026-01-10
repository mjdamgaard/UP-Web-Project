

import {Aggregator} from "../Aggregator.js";

const updatesSMPath = abs("./updates.sm.js");
const aggrPath = abs("./aggregates.bbt");



export class MeanAggregator extends Aggregator {
  constructor() {
    super(updatesSMPath, aggrPath);
  }
}

export {MeanAggregator as default};
