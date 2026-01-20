
import {map, slice} from 'array';
import MeanAggregator from "../mean/MeanAggregator.js";


export class BiasedMeanAggregator extends MeanAggregator {
  constructor(biasScore, biasWeight) {
    super();
    this.biasScore = biasScore;
    this.biasWeight = biasWeight;
  }


  fetchScore(userGroupKey, qualKey, subjKey) {
    return new Promise(resolve => {
      this.fetchScoreData(userGroupKey, qualKey, subjKey).then(
        scoreData => resolve(scoreData[1])
      );
    });
  }

  fetchScoreData(userGroupKey, qualKey, subjKey) {
    return new Promise(resolve => {
      super.fetchScoreData(userGroupKey, qualKey, subjKey).then(scoreData => {
        if (!scoreData || scoreData[2] <= 0) {
          resolve(scoreData);
        }
        else {
          resolve(transformScoreData(scoreData, this));
        }
      });
    });
  }


  fetchList(userGroupKey, qualKey, options) {
    return new Promise(resolve => {
      super.fetchList(userGroupKey, qualKey, options).then(list => {
        let newList = map(list, scoreData => {
          return transformScoreData(scoreData, this);
        });
        resolve(newList);
      });
    });
  }

}


function transformScoreData(scoreData, {biasScore, biasWeight}) {
  let newScore = (
    scoreData[1] * scoreData[2] + biasScore * biasWeight
  ) / (scoreData[2] + biasWeight);
  return [scoreData[0], newScore, scoreData[2], ...slice(scoreData, 3)];
}


export {BiasedMeanAggregator as default};
