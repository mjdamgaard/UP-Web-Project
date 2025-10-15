
import {toPrecision, parseFloat, isNaN} from 'number';
import {fetchMetric, fetchUserScore} from "/1/1/scores.js";
import {scoreHandler01} from "/1/1/score_handling/ScoreHandler01/em.js";

import * as InputRangeAndValue
from "../utility_components/InputRangeAndValue.jsx";
import * as QualityVariableReference from "./QualityVariableReference.jsx";
import * as AggregatedScoreDisplay from "./AggregatedScoreDisplay.jsx";



export function render({subjKey, qualKey}) {
  // TODO: Refactor this ScoreInterface component that uses a constant score
  // handler into a component with a prop/context-defined score handler, and
  // then a decorating component which can be used for a request origin
  // whitelist.
  let scoreHandler = scoreHandler01;
  let userEntID = this.subscribeToContext("userEntID");
  let {hasBegunFetching, metric, prevScore, msg} = this.state;
  let content;

  // If the metric and the previous user score are not yet fetched, do so.
  if (!hasBegunFetching) {
    this.setState(state => ({...state, hasBegunFetching: true}));
    fetchMetric(qualKey).then(metric => {
      this.setState(state => ({...state, metric: metric ?? false}));
    });
    if (userEntID) {
      fetchUserScore(qualKey, subjKey, userEntID).then(score => {
        this.setState(state => ({...state, prevScore: score ?? false}));
      });
    } else {
      this.setState(state => ({...state, prevScore: false}));
    }
    content = <div className="fetching">{"..."}</div>;
  }

  else if (metric === undefined || prevScore === undefined) {
    content = <div className="fetching">{"..."}</div>;
  }

  // TODO: Check here against a missing or ill-formed metric.


  // And if the metric is ready, render the score interface.
  else {
    let hasPrevScore = typeof prevScore === "number";
    let min = metric["Lower limit"] ?? -10;
    let max = metric["Upper limit"] ?? 10;
    let step = parseFloat(toPrecision((max - min) / 100, 3));
    content = [
      <div className="score-bar">
      <QualityVariableReference key="qvr"
        qualKey={qualKey} subjKey={subjKey}
      />
        <InputRangeAndValue key="ir"
          value={hasPrevScore ? prevScore : undefined}
          placeholder={hasPrevScore ? undefined : "N/A"}
          min={min} max={max} step={step}
        />
        <div className="todo-impl-interval-labels">{/*
          TODO: Implement showing interval labels matching the current value.
        */}</div>
        <button className="submit" onClick={() => {
          this.do("submitScore");
        }}>{
          "Submit"
        }</button>
        <button className="clear" onClick={() => {
          this.do("deleteScore");
        }}>{
          "Clear"
        }</button>
        <div className="response">{msg}</div>
      </div>,
      <div className="score-display">
        <div className="user-score">{hasPrevScore ? prevScore : undefined}</div>
        <AggregatedScoreDisplay key="as" qualKey={qualKey} subjKey={subjKey} />
      </div>
    ];
  }

  return (
    <div className="score-interface">{content}</div>
  );
}



export const actions = {
  "submitScore": function() {
    // Check that the scoring interface is fully visible before allowing any
    // posts. (This hinders other components tricking the user by showing only
    // a small part of the interface.)
    if (!this.getIsVisible()) {
      this.setState(state => ({...state,
        msg: <span className="warning">{
          "Please scroll fully into view before submitting a score"
        }</span>,
      }));
      return;
    }

    this.setState(state => ({...state,
      msg: <span className="working">{"Submitting score..."}</span>,
    }));
    let userEntID = this.subscribeToContext("userEntID");
    return new Promise(resolve => {
      if (userEntID) {
        this.do("submitScoreWithUserEntID", userEntID).then(
          result => resolve(result)
        );
      } else {
        this.trigger("postUserEntity").then(userEntID => {
          if (userEntID) {
            this.do("submitScoreWithUserEntID", userEntID).then(
              result => resolve(result)
            );
          } else {
            this.setState(state => ({...state,
              msg: <span className="warning">{"User is not logged in."}</span>,
            }));
            resolve(false);
          }
        });
      }
    });
  },
  "submitScoreWithUserEntID": function(userEntID) {
    let {qualKey, subjKey} = this.props;
    let score = parseFloat(this.call("ir", "getValue"));
    return new Promise(resolve => {
      if (isNaN(score)) {
        this.setState(state => ({...state,
          msg: <span className="warning">{"Ill-formed score value."}</span>,
        }));
        resolve(false);
      }
      else {
        scoreHandler01.postScore(
          qualKey, subjKey, userEntID, score
        ).then(wasUpdated => {
          if (wasUpdated) {
            this.setState(state => ({...state,
              prevScore: score,
              msg: <span className="success">{"Score was submitted."}</span>,
            }));
            resolve(true);
          }
          else {
            this.setState(state => ({...state,
              msg: <span className="error">{"Something went wrong."}</span>,
            }));
            resolve(false);
          }
        });
      }
    });
  },
  "deleteScore": function() {
    // Check that the scoring interface is fully visible before allowing any
    // posts.
    if (!this.getIsVisible()) {
      this.setState(state => ({...state,
        msg: <span className="warning">{
          "Please scroll fully into view before submitting or deleting a score"
        }</span>,
      }));
      return;
    }

    this.setState(state => ({...state,
      msg: <span className="working">{"Deleting score..."}</span>,
    }));
    let userEntID = this.subscribeToContext("userEntID");
    return new Promise(resolve => {
      if (userEntID) {
        this.do("deleteScoreWithUserEntID", userEntID).then(
          result => resolve(result)
        );
      } else {
        this.trigger("postUserEntity").then(userEntID => {
          if (userEntID) {
            this.do("deleteScoreWithUserEntID", userEntID).then(
              result => resolve(result)
            );
          } else {
            this.setState(state => ({...state,
              msg: <span className="warning">{"User is not logged in."}</span>,
            }));
            resolve(false);
          }
        });
      }
    });
  },
  "deleteScoreWithUserEntID": function(userEntID) {
    let {qualKey, subjKey} = this.props;
    return new Promise(resolve => {
      scoreHandler01.deleteScore(
        qualKey, subjKey, userEntID
      ).then(wasDeleted => {
        if (wasDeleted) {
          this.setState(state => ({...state,
            prevScore: false,
            msg: <span className="success">{"Score was deleted."}</span>,
          }));
          resolve(true);
        }
        else {
          this.setState(state => ({...state,
            msg: <span className="error">{"Something went wrong."}</span>,
          }));
          resolve(false);
        }
      });
    });
  },
};