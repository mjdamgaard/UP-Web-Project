
import * as ILink from 'ILink.jsx';
import * as EntityList from "../entity_lists/EntityList.jsx";


export function render() {
  return indexPage;
}



const indexPage = <>
  <h1>{"The User-Programmable Web"}</h1>
  <section>
    <h2>{"Welcome!"}</h2>
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
      "components that is uploaded to the website ", "by the users!",
    ]}</p>
    <p>{
      "In fact, the only thing on this webpage that is not programmed and " +
      "uploaded by a user is the account menu at the top right of this " +
      "webpage. Everything else is user-programmed, even this very index page!"
    }</p>
  </section>

  <section>
    <h2>{"Changing this index page"}</h2>
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
    <br/>
    <p>{
      "This is no coincidence, as this index page is determined by whatever " +
      "component element is at the top of this list."
    }</p>
    <p>{
      "So if you have a " +
      "proposal for a different index page for this website, you can first " +
      "of all upload that component to the same list, and then give it a " +
      "high score, and hope that other users does the same."
    }</p>
    <p>{[
      "To learn how to create and upload new components. follow the " +
      "tutorials at ",
      <ILink key="tut-link-1" href="/tutorials" >
        {"up-web.org/tutorials"}
      </ILink>,
      "."
    ]}</p>
  </section>

  <section>
    <h2>{"An Everything Website"}</h2>
    <p>{
      "In a near future we might change this index page to include some kind " +
      "of feed, and preferably one that is based on the users' own " +
      "preferences. This feed could e.g. contain ongoing projects and " +
      "discussions, such that the users can easily update themselves with " +
      "the goings on of the website, and the UP Web Project at large."
    }</p>
    <p>{
      "But apart from this front page feed, the index page should also " +
      "contain links to all of the most useful user-uploaded web apps and " +
      "webpages. And these apps and pages can also further contain links to " +
      "app and pages, which means that this index will ultimately serve as " +
      "an index from which you can navigate to all the useful user-uploaded " +
      "apps and webpages that currently exist."
    }</p>
    <p>{
      "And since there will be practically no limit of what this user-" +
      "uploaded apps can do, it means that this website can in principle " +
      "end up offering alternatives to all kinds of websites in existence."
    }</p>
    <p>{
      "Thus, the ultimate goal of this website is to become what we might " +
      "call an \"Everything Website.\""
    }</p>
  </section>

  <section>
    <h2>{"User-programmed backend modules"}</h2>
    <p>{
      "..."
    }</p>
  </section>


  <section>
    <h2>{"Safety"}</h2>
    <p>{
      "..."
    }</p>
  </section>
</>;



export const styleSheetPaths = [
  abs("../style.css"),
];
