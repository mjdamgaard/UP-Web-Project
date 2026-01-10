
import {map, slice} from 'array';
import MeanAggregator from "../mean/MeanAggregator";


export class BiasedMeanAggregator extends MeanAggregator {
  constructor(biasScore, biasWeight) {
    super();
    this.biasScore = biasScore;
    this.biasWeight = biasWeight;
  }


  fetchScore(userGroupKey, qualKey, subjKey) {
    return new Promise(resolve => {
      this.fetchScoreData(userGroupKey, qualKey, subjKey).then(
        scoreData => resolve(scoreData[0])
      );
    });
  }

  fetchScoreData(userGroupKey, qualKey, subjKey) {
    return new Promise(resolve => {
      super.fetchScoreData(userGroupKey, qualKey, subjKey).then(scoreData => {
        if (!scoreData || scoreData[1] <= 0) {
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
  let newWeight = scoreData[1] + biasWeight;
  let newScore = (
    scoreData[0] * scoreData[1] + biasScore * biasWeight
  ) / newWeight;
  return [newScore, newWeight, ...slice(scoreData, 2)];
}


export {BiasedMeanAggregator as default};
