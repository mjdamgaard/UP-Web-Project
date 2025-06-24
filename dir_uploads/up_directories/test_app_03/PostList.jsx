
import {fetch} from 'query';

export function render({isAscending = true}) {
  let {postList} = this.state;

  if (!postList) {
    fetch(
      "/1/3/posts.att/list/n=50/a=" + (isAscending ? 1 : 0)
    ).then(res => {
      if (res) {
        this.setState({...this.state, postList: res});
      }
      else throw "No list returned from server";
    });
    return <div></div>;
  }
console.log("If I am reached...");debugger;
  // let len = 2;//postList.length;
  let retChildren = [];
  // for (let i = 0; i < len; i++) {
  //   retChildren[i] = <div>{postList[i]}</div>;
  // }
console.log("...then so should I!");
  return (
    <div>
      {postList}
    </div>
  );
}