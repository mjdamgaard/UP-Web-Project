
import * as PostField from "./PostField.jsx";
import * as PostList from "./PostList.jsx";

export function render() {
  return (
    <div>
      <PostField key={0}/>
      <PostList key={1} />
    </div>
  );
}


export const actions = {
  "refresh": function() {
    this.call(1, "refresh");
  }
};