


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
      "network of user-programmed websites and applications. This this " +
      "website, UP-Web.org, is the first, pioneering website in this network."
    }</p>
    <p>{
      "And by \"user-programmable,\" we refer to the fact that almost " +
      "everything you see on this webpage is generated from source code " +
      "components that is uploaded to the website, by the users."
    }</p>
    <p>{
      "In fact, the only thing on this webpage that is not programmed and " +
      "uploaded by a user is the account menu at the top right of the page. " +
      "Everything else is user-programmed, even this very index page!"
    }</p>
  </section>

  <section>
    <h1>{"Changing this index page"}</h1>
    <p>{
      "If you want to help change this index page into a better one, here " +
      "how that is done."
    }</p>
    <p>{
      "Below you see a list of alternative index page component, all " +
      "uploaded by users of this website. TODO: Insert description of how to " +
      "click on an entity list element and navigate to the given component's " +
      "page to view it."
    }</p>
    <p>{
      "You might notice that the first component on the list is "
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