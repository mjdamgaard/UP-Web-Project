
import * as EntityList from "../entity_lists/EntityList.jsx";


export function render() {
  return indexpage;
}


export const styleSheetPaths = [
  abs("../style.css"),
];


const indexpage = <>
  <section>
    <h1>{"Welcome to the User-Programmable Web"}</h1>
    <p>{
      "Welcome to the the User-Programmable Web! Or rather, welcome to an " +
      "initial prototype of a user-programmable website."
    }</p>
    <p>{
      "The User-Programmable Web (UP Web) is meant to be an open-source " +
      "network of user-programmed websites and applications. And this " +
      "website, UP-Web.org, is the first, pioneering one in this network!"
    }</p>
    <p>{[
      "And by \"user-programmable,\" we refer to the fact that almost " +
      "everything you see on this webpage is generated from source code " +
      "components that is uploaded to the website ", <i>{"by the users."}</i>,
    ]}</p>
    <p>{
      "In fact, the only thing on this webpage that is not programmed and " +
      "uploaded by a user is the account menu at the top right of this " +
      "webpage. Everything else is user-programmed, even this very index page!"
    }</p>
  </section>

  <section>
    <h1>{"Changing this index page"}</h1>
    <p>{
      "If you want to help change this index page into a better one, here " +
      "how that is done."
    }</p>
    <p>{
      "Below you see a list of proposed index page component, all " +
      "uploaded by users of this website. This is a dynamic list where the " +
      "order depend on how the users of this website have scored each " +
      "component. And if you click on the element at the very top of the " +
      "list, called 'Index page 1.0,' and then click on 'View component,' " +
      "you will see that you are lead to a page with the exact same content " +
      "as this index page."
    }</p>
    <div className="index-page-list">
      <EntityList key="_idx-list" classKey="/1/1/em2.js;get/indexPages"
        paginationLength={10}
      />
    </div>
    <p>{
      "This is no coincidence, as this index page is determined by whatever " +
      "component element is at the top of this list. Thus, if you have a " +
      "proposal for a different index page for this website, you can first " +
      "of all upload that component to the same list, and then give it a " +
      "high score, and hope that other users scores it highly as well."
    }</p>
  </section>


  <section>
    <h2>{"..."}</h2>
    <p>{
      "For more information, " +
      "see https://github.com/mjdamgaard/UP-Web-Project."
    }</p>
  </section>
</>;