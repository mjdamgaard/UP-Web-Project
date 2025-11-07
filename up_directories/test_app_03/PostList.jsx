
import homePath from "./.id.js";
import {fetch} from 'query';
import {map} from 'array';


export function getInitialState({isAscending = true}) {
  return {isAscending: isAscending};
}


export function render() {
  let {postList} = this.state;

  if (!postList) {
    fetchPostListAndUpdate(this);
    return <div></div>;
  }

  let retChildren = map(postList, ([, message], ind) => (
    <div>
      <span>{ind + 1}{"\t"}</span>
      <span>{message}</span>
    </div>
  ));
  return (
    <div>
      {retChildren}
    </div>
  );
}


export const methods = [
  "refresh",
];

export const actions = {
  "refresh": function() {
    fetchPostListAndUpdate(this);
  }
};


function fetchPostListAndUpdate(inst) {
  fetch(
    homePath + "/posts.att/list/n/50/a/" + (inst.state.isAscending ? 1 : 0)
  ).then(res => {
    if (res) {
      inst.setState({...inst.state, postList: res});
    }
    else throw "No list returned from server";
  });
}
