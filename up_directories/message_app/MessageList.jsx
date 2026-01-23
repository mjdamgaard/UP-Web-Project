
import homePath from "./.id.js";
import {fetch} from 'query';
import {map} from 'array';


export function render() {
  let {msgList} = this.state;

  if (!msgList) {
    this.do("refresh");
    return <div></div>;
  }

  let messages = map(msgList, ([, message], ind) => (
    <div>
      <span>{ind + 1}{"\t"}</span>
      <span>{message}</span>
    </div>
  ));
  return (
    <div>
      {messages}
    </div>
  );
}


export const methods = [
  "refresh",
];

export const actions = {
  "refresh": function() {
    fetch(
      homePath + "/posts.att/list/n/50/a/0"
    ).then(msgList => {
      this.setState(state => ({...state, msgList: msgList}));
    });
  },
};