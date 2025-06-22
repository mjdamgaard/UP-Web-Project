
import {fetch, getCurHomeDirPath} from 'query';
import * as PostField from "./PostField.jsx";
import * as PostList from "./PostField.jsx";

export function render() {
  return (
    <div>
      <PostField key={0}/>
      <PostList key={1} />
    </div>
  );
}
