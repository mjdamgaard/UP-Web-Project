
import {fetch} from 'query';


export function getInitState({isAscending = true}) {
  return {isAscending: isAscending};
}


export function render() {
  let {postList} = this.state;

  if (!postList) {
    fetchPostListAndUpdate(this);
    return <div></div>;
  }

  let len = postList.length;
  let retChildren = [];
  for (let i = 0; i < len; i++) {
    retChildren[i] = (
      <div>
        <span>{i + 1}{"\t"}</span>
        <span>{postList[i][1]}</span>
      </div>
    );
  }
  return (
    <div>
      {retChildren}
    </div>
  );
}


export const methods = {
  "refresh": function() {
    fetchPostListAndUpdate(this);
  }
};


function fetchPostListAndUpdate(inst) {
  fetch(
    "/1/3/posts.att/list/n=50/a=" + (inst.state.isAscending ? 1 : 0)
  ).then(res => {
    if (res) {
      inst.setState({...inst.state, postList: res});
    }
    else throw "No list returned from server";
  });
}
