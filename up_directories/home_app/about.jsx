
import * as ILink from 'ILink.jsx';
import * as ELink from 'ELink.jsx';
import * as EntityList from "./entity_lists/EntityList.jsx";


export function render() {
  return page;
}



const page = <div className="text-page">
  <h1>{"The User-Programmable Web"}</h1>
  <section>
    <h2>{"Welcome!"}</h2>
    <p>{
      "Welcome to the the User-Programmable Web! Or rather, welcome to an " +
      "initial prototype of a user-programmable website."
    }</p>
    <p>{
      "The User-Programmable Web (UP Web) is meant to be an open-source " +
      "network of user-programmed websites and applications. And up-web.org " +
      "is the first, pioneering website in this network!"
    }</p>
    <p>{[
      "And by \"user-programmable,\" we refer to the fact that almost " +
      "everything you see on this webpage is generated from source code " +
      "components that is uploaded to the website, by the users!",
      // <i>{"by the users!"}</i>,
    ]}</p>
    <p>{
      "In fact, the only thing on this webpage that is not programmed and " +
      "uploaded by a user is the account menu at the top right of this " +
      "webpage. Everything else is you see user-programmed!"
      // "even this very index page!"
    }</p>
  </section>

  <section>
    <h2>{"Changing the index page"}</h2>
    <p>{
      "If you want to help change the index page into a better one, here " +
      "is how that is done."
    }</p>
    <p>{
      "Below you see a list of proposed index page components, all " +
      "uploaded by users. This is a dynamic list where the " +
      "order depends on how the users have scored each " +
      "component. And if you click on the element at the very top of the " +
      "list, called 'Index page 1.0,' and then click on 'View component,' " +
      "you will see that you are lead to a page with the exact same content " +
      "as that of the current index page."
    }</p>
    <p>
      <EntityList key="_idx-list" classKey="/1/1/em2.js;get/indexPages"
        paginationLength={10}
      />
    </p>
    <p>{
      "This is no coincidence, as the index page is determined by whatever " +
      "component element is at the top of this list."
    }</p>
    <p>{
      "So if you have a " +
      "proposal for a different index page, you can first " +
      "of all upload that component to the same list, and then give it a " +
      "high score, and hope that other users does the same."
    }</p>
    <p>{
      "And it is not just the index page that is governed by the users. " +
      "Every " +
      "page and every app that the index page leads to is also user-" +
      "programmed, as well as any apps and pages that these might lead on " +
      "to, etc. " +
      "The index page will thus serve as an " +
      "entry point into a whole ecosystem of user-programmed apps and webpages."
    }</p>
  </section>

  <section>
    <h2>{"User-programmed server modules"}</h2>
    <p>{
      "The user-programmed components can also upload and download data " +
      "from the server. And example of this is the list component shown " +
      "above, which queries the database for the list of the most " +
      "popular index pages."
    }</p>
    <p>{
      "And the way that this is achieved is by allowing the users to create " +
      "and upload what we call \"server modules,\" along with the front-end " +
      "components."
    }</p>
    <p>{
      "These server modules can define their own data structures, " +
      "which become a local and independent part of the database. " +
      "And the server modules can also do computations on this data, which " +
      "means that " +
      "users are even able to program whatever algorithms " +
      "they want for their apps and webpages!"
    }</p>
  </section>

  <section>
    <h2>{"Apps and algorithms tailored to the individual user"}</h2>
    <p>{
      "The users are thus able to program both of the front-end " +
      "appearance of the apps and webpages, as well as the back-end data " +
      "structures and algorithms that they use."
    }</p>
    <p>{
      "But that is not all. Each individual user is then also able to choose " +
      "which apps and accompanying algorithms that they want. And this is " +
      "true even when those users has not been a part of programming " +
      "anything to the UP Web themselves."
    }</p>
    <p>{
      "In fact, even the " +
      "fundamental algorithms of up-web.org, like the one that decides " +
      "the scores of the index pages in the list above, are " +
      "designed in such a way that they can be made completely dependent on " +
      "the individual user's own preferences!"
    }</p>
    <p>{
      "This means that each individual user are free to decide whichever " +
      "algorithm they want for determining the index page that fits them " +
      "the best. And since the index page " +
      "serves as the entry point for navigating to all other user-programmed " +
      "webpages and apps, this means that each user can effectively decide, " +
      "what this UP website (up-web.org) should be for them."
    }</p>
    <p>{
      "So not only are the apps and the underlying algorithms created by " +
      "the users themselves, but each individual user also gets to freely " +
      "decide which versions of the apps and algorithms they want to use!"
    }</p>
    <p>{
      "And this is true for all users, not just the ones that take an active " +
      "part in contributing source code to the UP Web."
    }</p>
  </section>

  <section>
    <h2>{"Open source and freedom of data portability"}</h2>
    <p>{
      "As mentioned above, up-web.org is an open-source website, published " +
      "under the GPL-3.0 license, which means that anyone is free to copy " +
      "and modify the source code, and set up their own version this website " +
      "if they want."
    }</p>
    <p>{[
      "The source code for this project can currently be found at ",
      <ELink key="link-github-repo"
        href="https://github.com/mjdamgaard/UP-Web-Project">
        {"github.com/mjdamgaard/UP-Web-Project"}
      </ELink>,
      "."
    ]}</p>
    <p>{
      "The users are furthermore strongly encouraged to use open-source " +
      "licenses for their uploaded source code as well, and to make this " +
      "source code available on GitHub (or a similar site)."
    }</p>
    <p>{
      "And are also encouraged to make sure to make it easy for users to " +
      "download and back up of their own data, and for that data to be moved " +
      "to other websites, not least other websites that are part of the UP Web."
    }</p>
    <p>{
      "So if it ever happens that one such website becomes compromised or " +
      "corrupted in any way, the user community should be able to easily " +
      "just move their UP apps and accompanying data over to other nodes " +
      "in the network that is the UP Web."
    }</p>
  </section>


  <section>
    <h2>{"An Everything Website"}</h2>
    <p>{
      "Finally, you might be wondering what kinds of apps the UP Web " +
      "will seek to implement. And the short answer to this is: any kind " +
      "kind of app imaginable."
    }</p>
    <p>{
      "There is really no limit to what kinds of apps and webpages can be " +
      "implemented on the UP Web when compared to other kinds of websites. " +
      "Facebook, Twitter, YouTube, you name it, all such websites might " +
      "one day, sooner or later, get alternative versions of them them " +
      "implemented on the UP Web."
    }</p>
    <p>{
      "And even though the current prototype of the system might not contain " +
      "everything you need for implementing all these apps at the current " +
      "moment, the required " +
      "features will all be implemented in time. For instance, in regards " +
      "to the example of YouTube, while the " +
      "prototype does not currently have the functionality needed for " +
      "showing videos on the website, it will get this in a near future."
    }</p>
  </section>

  <section>
    <h2>{"Getting started"}</h2>
    <p>{
      "Of course, before this UP Web can become a reality, we need users who " +
      "want to take part in programming some of the first UP apps, and to " +
      "familiarize themselves with the system."
    }</p>
    <p>{[
      "To learn how to get started with creating and uploading your own app " +
      "components, you can follow the ",
      <ILink key="tut-link-1" href="/tutorials" >
        {"tutorials"}
      </ILink>,
      " of this website."
    ]}</p>
    <p>{[
      "We hope that you will have fun creating your own UP apps, and taking " +
      "an early and important part in this potentially ground-breaking " +
      "online movement."
    ]}</p>
  </section>
</div>;



export const styleSheets = [
  abs("./style.css"),
];
