
import {fetch, getCurHomeDirPath} from 'query';
import * as PostField from "./PostField.js";
import * as PostList from "./PostField.js";

export function render() {
  let {postList} = this.state;

  if (!postList) {

  }

  return (
    <div>
      <PostField key={0}/>
      <PostList key={0} list={postList} />
    </div>
  );
}
