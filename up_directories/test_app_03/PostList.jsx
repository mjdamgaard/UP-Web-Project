
import {fetch} from 'query';


export function initialize({isAscending = true}) {
  return {isAscending: isAscending};
}


export function render() {
  let {postList} = this.state;

  if (!postList) {
    fetchPostListAndUpdate(this);
    return <div></div>;
  }

  let retChildren = postList.map(([, message], ind) => (
    <div>
      <span>{ind + 1}{"\t"}</span>
      <span>{message}</span>
    </div>
  ));
  return (
    <div>
      {(retChildren)}
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
    "~/posts.att/list/n/50/d/" + (inst.state.isAscending ? "0" : "1")
  ).then(res => {
    if (res) {
      inst.setState({...inst.state, postList: res});
    }
    else throw "No list returned from server";
  });
}
