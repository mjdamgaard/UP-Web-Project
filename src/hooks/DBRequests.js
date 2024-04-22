import {useState, useEffect, useMemo} from "react";
import {DBRequestManager} from "../classes/DBRequestManager.js";

// reqData =
//   data |
//   {key1: data, key2: ...} |
//   {key1: [data1.1, data1.2, ...], key2: ...}.
//
// results =
//   {data, isFetched}.

export const useQuery = (results, setResults, reqData) => {
  useEffect(() => {
    if (reqData.req) {
      if (!results.isFetched && !results.isFetching) {
        setResults(prev => ({...prev, isFetching: true}));
        results.isFetching = true; // See useInput for why this line is here.
        DBRequestManager.queryAndSet(setResults, reqData);
      }
    } else {
      let keys = Object.keys(reqData);
      keys.forEach(key => {
        let data = reqData[key];
        if (data.req) {
          let result = results[key];
          if (!result.isFetched && !result.isFetching) {
            setResults(prev => {
              let ret = {...prev};
              ret[key].isFetching = true;
              return ret;
            });
            result.isFetching = true;
            DBRequestManager.queryAndSet(setResults, key, data);
          }
        // } else if (Array.isArray(data)) {
        //   results[key] ??= [];
        //   data.forEach((val, ind) => {
        //     if (val && !(results[key][ind] ?? {}).isFetched) {
        //       DBRequestManager.query(setResults, key, ind, val);
        //     }
        //   });
        } //else {
        //   throw "useQuery(): reqData is ill-formed.";
        // }
      });
    }
  }, [reqData]);
};

export const useInput = (results, setResults, reqData) => {
  useEffect(() => {
    if (reqData.req) {
      if (!results.isFetched && !results.isFetching) {
        setResults(prev => ({...prev, isFetching: true}));
        results.isFetching = true; // A hacky fix, but two inputs will be sent
        // if this line is out-commented!
        DBRequestManager.inputAndSet(setResults, reqData);
      }
    } else {
      let keys = Object.keys(reqData);
      keys.forEach(key => {
        let data = reqData[key];
        if (data.req) {
          let result = results[key];
          if (!result.isFetched && !result.isFetching) {
            setResults(prev => {
              let ret = {...prev};
              ret[key].isFetching = true;
              return ret;
            });
            result.isFetching = true;
            DBRequestManager.inputAndSet(setResults, key, data);
          }
        // } else if (Array.isArray(data)) {
        //   results[key] ??= [];
        //   data.forEach((val, ind) => {
        //     if (val && !(results[key][ind] ?? {}).isFetched) {
        //       DBRequestManager.inputAndSet(setResults, key, ind, val);
        //     }
        //   });
        } //else {
        //   throw "useInput(): reqData is ill-formed.";
        // }
      });
    }
  }, [reqData]);
};
