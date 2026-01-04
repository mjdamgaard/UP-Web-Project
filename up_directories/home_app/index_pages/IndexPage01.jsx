
import * as ILink from 'ILink.jsx';
import * as ELink from 'ELink.jsx';
import * as EntityList from "../entity_lists/EntityList.jsx";


export function render() {
  return indexPage1;
}


const indexPage2 = <div className="text-page">
  <h1>{"The User-Programmable Web"}</h1>
  <section>
    <h2>{"A decentralized network of open source web apps"}</h2>
    <p>{
      "The User-Programmable Web (UP Web) is meant to be a " +
      "collection of open source websites where the users are in complete " +
      "control over the appearance and functionality of the web " +
      "apps, as well as the data structures and algorithms behind them."
    }</p>
    <p>{
      "Here it is the users themselves that create and upload all the " +
      "components and modules that make up the website. " +
      "And each individual user gets to chose exactly " +
      "which set of apps and which set of algorithms they want to use, " +
      "regardless of whether they have contributed any source code themselves."
    }</p>
    <p>{
      "This website, up-web.org, is the very first prototype of such a " +
      "user-programmable (UP) website. Indeed, every app and every page on " +
      "this website, including the page that you are reading now, has " +
      "been uploaded by a user!"
    }</p>
  </section>

  <section>
    <h2>{"A sandboxing technology that gives the users free rein"}</h2>
    <p>{
      "We use a sandboxing technology that allows users to safely upload " +
      "new apps, as well as new versions of existing apps, and " +
      "have other users try them out without needing to fear getting hacked " +
      "by them."
    }</p>
    <p>{
      "The UP website therefore requires very little central oversight when " +
      "it comes to the development of new app prototypes, and new " +
      "modifications to existing apps. The users are thus free to quickly " +
      "and easily share new app ideas with each other, without the need for " +
      "the apps to go through a centralized review process first."
    }</p>
    <p>{
      "Furthermore, the sandboxing technology also allows us to store these " +
      "source code " +
      "modules in the database rather than in the limited file system of " +
      "the server itself. This means that there is practically no limit to " +
      "how many apps the users can create, as well as how many versions of " +
      "each given app can be made."
    }</p>
    <p>{
      "And as the creator of a new app or feature, you do not pay anything " +
      "for the server traffic and the data storage that the app uses. " +
      "The fact that other users choose to use your app over others should " +
      "not come at a cost to you. If anything, you should be rewarded for " +
      "it."
    }</p>
    <p>{
      "The cost is instead carried by the users of the app, who might " +
      "pay by watching ads in the margins of the website, or by simply " +
      "helping to attract " +
      "more sponsors and donors to the website through their activity."
    }</p>
    <p>{
      "The users thus have an incredible freedom to create and modify apps " +
      "in a decentralized way. " +
      "And we hope that the UP Web will develop into a whole ecosystem " +
      "of web apps of all kinds, and where there is a very short and quick " +
      "route from idea to practice."
    }</p>
    {/* <p>{
      "So whenever you have an idea for a new app or a new feature to an " +
      "existing app, you can very quickly implement a prototype of that app " +
      "or feature, and upload it under a relevant category such that other " +
      "users can find it and try it out. These users might then help you " +
      "finish the project. And once it is finished and ready to use, " +
      "the app or modification does not need to go through a centralized " +
      "review process, and then be rolled out to all users at once. " +
      "Instead it can just gradually be picked up by more and more of the " +
      "user base, until it has reached everyone who wants it."
    }</p>
    <p>{
      "And whenever a user does not like a new feature to a given app, they " +
      "are completely free to just pass on it, and keep using a version of " +
      "the app without that feature."
    }</p> */}
  </section>

  <section>
    <h2>{"Why to get excited about the UP Web"}</h2>

    <h3>{"Free data portability and an end to \"enshitification!\""}</h3>
    <p>{
      "The fact that UP Web is open source and decentralized " +
      "means that it will be easy for users to avoid exploitation."
    }</p>
    <p>{
      "If any service provider in the network become exploitative towards " +
      "its users, for instance by showing an excessive amount of ads, the " +
      "users can just move their source code and data over " +
      "another node in the network."
    }</p>
    <p>{
      "The service providers will thus have no leverage to start exploiting " +
      "the users."
    }</p>

    <h3>{"Choose only the apps and features that you want!"}</h3>
    <p>{
      "When new apps or features are created, they are not just rolled " +
      "out to all users at once, like on other websites. With the UP Web, " +
      "each user can choose which apps and features to use independently of " +
      "each other."
    }</p>
    <p>{
      "So whenever a new update comes along that e.g. moves a button to new " +
      "location that you do not like, or make any other kind of change that " +
      "you do not like, simply reject that update, and stick to the " +
      "version(s) of the app that you like."
    }</p>

    <h3>{"Make it easier to limit your screen time!"}</h3>
    <p>{
      "Since the algorithms behind all the apps on the UP Web are user-" +
      "programmed, there is no real point for the creators to make them " +
      "aggressively try to maximize your watch time and engagement."
    }</p>
    <p>{
      "And since you are in complete control over which algorithms you use " +
      "you can also make sure to choose an algorithm that is not optimized " +
      "towards making you stick to your screen for as long as possible."
    }</p>
    <p>{
      "The UP Web will thus make it a lot easier to limit your screen time " +
      "when compared to existing web apps on the market."
    }</p>

    <h3>{"Filter out all inappropriate content!"}</h3>
    <p>{
      "When the algorithms are not optimized to maximize your engagement, " +
      "the algorithms also do not have to push new content to a lot of " +
      "users quickly."
    }</p>
    <p>{
      "Instead you can choose to only use algorithms that makes sure to " +
      "take their time, and allowing other, volunteering users to review " +
      "the content first, and make sure it to mark accordingly if it can " +
      "be considered inappropriate in some way."
    }</p>
    <p>{
      "With such algorithms, it will not take a lot of effort to be able to " +
      "filter out all content from your feeds and search results which you " +
      "deem inappropriate."
    }</p>
    <p>{
      "And while up-web.org in particular intends to give each user free " +
      "rein to choose the algorithms they want to use, we will also at some " +
      "point implement other UP websites where the algorithms are restricted."
    }</p>
    <p>{
      "So if you want to protect your children from viewing something that " +
      "is damaging for them, just make sure that their devices can only " +
      "access the restricted UP websites."
    }</p>

    <h3>{"Avoid misinformation!"}</h3>
    <p>{
      "In the same way that te UP Web will make it relatively easy to avoid " +
      "inappropriate content, by taking the time to review new posts rater " +
      "than quickly pushing it to a large audience, it will also be easier " +
      "to avoid misinformation."
    }</p>
    <p>{
      "Whenever a post contains some apparent information about the world " +
      "the volunteering users that review new posts can mark it accordingly. " +
      "Then the post can be forwarded to volunteering fact-checking user " +
      "groups. And when the post finally reaches your feed, you will be able " +
      "to see how the various fact-checking user groups (that you have some " +
      "amount of trust in) have each rated the veracity of the post so far."
    }</p>


    <h3>{"Suppress rude and nonconstructive comments!"}</h3>
    <p>{
      "Another downside of using existing web apps on the market whose " +
      "algorithms maximize for user engagement is that this has the effect " +
      "of boosting negative discourse."
    }</p>
    <p>{
      "This is due to the fact that negative and downright rude comments " +
      "often attract more engagement than more earnest and constructive " +
      "comments."
    }</p>
    <p>{
      "And even though you might reply to a rude comment in order to express " +
      "your opposition to it, the algorithms still see that as engagement, " +
      "and will try to boost the visibility of such comments in the future, " +
      "for you and for other users, despite the fact that you might want " +
      "the exact opposite."
    }</p>
    <p>{
      "Furthermore, since these algorithms also tend to boost the visibility " +
      "of users who has the most engagement, it even gives an increased " +
      "motivation for users to be rude and disruptive, which adds to the " +
      "whole problem."
    }</p>
    <p>{
      "However, when the algorithms are user-programmed, and are not " +
      "trying to optimize for engagement at all cost, it is a rather simple " +
      "matter of giving the users the possibility to rate a given comment or " +
      "a given user on an earnest-to-rude scale, and to have the algorithms " +
      "strongly suppress the users that tends to be nonconstructive in their " +
      "comments."
    }</p>

    <h3>{"Filter out AI slop and clickbait!"}</h3>
    <p>{
      "The contemporary algorithms that only ties to maximize watch time " +
      "and user engagement are also effectively blind to whether the given " +
      "piece of content is clickbait, or if it is AI slop, or in general if " +
      "it pretends to be something that it is not."
    }</p>
    <p>{
      "But with user-programmed algorithms, it is also a rather simple " +
      "matter to allow users to rate whether a given post is clickbait, or " +
      "AI generated, etc., which then allows the algorithms to subsequently " +
      "suppress that post."
    }</p>


  </section>

  <section>
    <h2>{"More than just alternatives to existing web apps"}</h2>
    <p>{
      "..."
    }</p>

    {/* <h3>{"Increased creativity means better apps and better algorithms"}</h3>
    <p>{
      "When the ..."
    }</p> */}
  </section>

  <section>
    <h2>{"Business model"}</h2>

    <h3>{"Business model of up-web.org"}</h3>
    <p>{[
      "The business model of the company behind up-web.org in particular " +
      "is to first of all have a ",
      <ILink key="tut-link-sponsors" href="/sponsors" >
        {"Sponsors"}
      </ILink>,
      " page where we showcase our sponsors, and ask our users to send some " +
      "appreciation their way."
    ]}</p>
    <p>{
      "And we will also accept individual donations from anyone interested " +
      "in supporting the project."
    }</p>
    <p>{
      "We will then spend this money in order to help start and maintain " +
      "the UP Web as best as we can. And if we do a good job, this might " +
      "help attract even more sponsors and donors in the future."
    }</p>
    <p>{
      "Apart from the maintenance of the servers and the fundamental source " +
      "code of the project, this money will also go to rewarding the various " +
      "users who contribute their own source code to the project."
    }</p>
    <p>{
      "Lastly, if the donations and sponsorships turn out not to cover the " +
      "costs of the user activity, the website might start to show ads in " +
      "the margins of the webpages. But since users can easily move their " +
      "data and activity to another service provider in the " +
      "network, this will only happen if it turns out to be necessary."
    }</p>
  </section>

  <section>
    <h2>{"Rewarding content creators"}</h2>
    <p>{
      "..."
    }</p>
  </section>
</div>;

const indexPage1 = <div className="text-page">
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
      "everything you see on this website is generated from source code " +
      "components that has been uploaded to it, by the users themselves!",
      // <i>{"by the users!"}</i>,
    ]}</p>
    <p>{
      "In fact, the only thing on this webpage that is not programmed and " +
      "uploaded by a user is the account menu at the top right of this " +
      "webpage. Everything else is you see user-programmed, " +
      "even this very index page!"
    }</p>
  </section>

  <section>
    <h2>{"Changing this index page"}</h2>
    <p>{
      "If you want to help change this index page into a better one, here " +
      "is how that is done."
    }</p>
    <p>{
      "Below you see a list of proposed index page components, all " +
      "uploaded by users. This is a dynamic list where the " +
      "order depends on how the users have scored each " +
      "component. And if you click on the element at the very top of the " +
      "list, called 'Index page 1.0,' and then click on 'View component,' " +
      "you will see that you are lead to a page with the exact same content " +
      "as this index page."
    }</p>
    <p>
      <EntityList key="_idx-list" classKey="/1/1/em2.js;get/indexPages"
        paginationLength={10}
      />
    </p>
    <p>{
      "This is no coincidence, as this index page is determined by whatever " +
      "component element is at the top of this list."
    }</p>
    <p>{
      "So if you have a " +
      "proposal for a different index page, you can first " +
      "of all upload that component to the same list, then give it a " +
      "good score, and hope that other users does the same."
    }</p>
    <p>{
      "And it is not just the index page that is governed by the users. " +
      "Every " +
      "webpage and every app that this index page leads to is also user-" +
      "programmed. And these can of course also link to even more pages and " +
      "apps. " +
      "The index page will thus hopefully end up serving as an " +
      "entry point into a whole ecosystem user-programmed webpages and " +
      "apps of all kinds."
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
      "The way that this is achieved is by allowing the users to create " +
      "and upload what we call \"server modules,\" along with their " +
      "front-end components."
    }</p>
    <p>{
      "These server modules can define their own set of data structures, " +
      "which then becomes a local and independent part of the database. " +
      "And the server modules can also do all kinds of computations on this " +
      "data as well, which means that " +
      "users are even able to design and create whatever algorithms " +
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
      "which apps and accompanying algorithms they want. And this is " +
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
      "webpages and apps, this means that each user can effectively decide " +
      "what this UP website should be for them!"
    }</p>
    {/* <p>{
      "So not only are the apps and the underlying algorithms created by " +
      "the users, but each individual user also gets to freely " +
      "decide which versions of the apps and algorithms they want to use!"
    }</p>
    <p>{
      "And this is true for all users, not just the ones that take an active " +
      "part in contributing source code to the UP Web."
    }</p> */}
  </section>

  <section>
    <h2>{"Open source and freedom of data portability"}</h2>
    <p>{
      "As mentioned above, up-web.org is an open-source website (published " +
      "under the GPL-3.0 license), which means that anyone is free to copy " +
      "and modify the source code, and set up their own version this website " +
      "if they want."
    }</p>
    <p>{[
      "The source code for this project can currently be found at ",
      <ELink key="link-w3-html"
        href="https://github.com/mjdamgaard/UP-Web-Project">
        {"github.com/mjdamgaard/UP-Web-Project"}
      </ELink>,
      "."
    ]}</p>
    <p>{
      "The users are furthermore strongly encouraged to also use open-source " +
      "licenses for their uploaded source code as well, and to make this " +
      "source code openly available on GitHub (or a similar site)."
    }</p>
    <p>{
      "And they also encouraged to make it easy for the users of their " +
      "UP apps to " +
      "download and back up of their own data, and for that data to be moved " +
      "easily to other websites, and not least other UP websites."
    }</p>
    <p>{
      "So if it ever happens that one UP website becomes compromised or " +
      "corrupted in any way, the user community should be able to easily " +
      "move their UP apps and accompanying data over to other nodes " +
      "in this decentralized network that will constitute the UP Web."
    }</p>
  </section>


  <section>
    <h2>{"An \"Everything Website\""}</h2>
    <p>{
      "Finally, you might be wondering what kinds of apps the UP Web " +
      "will seek to implement. And the short answer to this is: " +
      "any kind of app imaginable, really."
    }</p>
    <p>{
      "There is not really any limit to what kinds of apps and webpages " +
      "can be " +
      "implemented on the UP Web when compared to other kinds of websites. " +
      "Facebook, Twitter, YouTube, you name it, all such websites might " +
      "one day, sooner or later, get alternative versions of them them " +
      "implemented on the UP Web."
    }</p>
    <p>{
      "In fact, an alternative version of Facebook is already underway, and " +
      "will be soon ready for use."
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

  {/* <section>
    <h2>{"An Everything Website"}</h2>
    <p>{
      "In a near future we might change this index page to include some kind " +
      "of feed, and preferably one that is based on the users' own " +
      "preferences. This feed could e.g. contain ongoing projects and " +
      "discussions, such that the users can easily follow " +
      "the goings on of the website, and the UP Web Project at large."
    }</p>
    <p>{
      "But apart from this front page feed, the index page should also " +
      "contain links to all of the most useful user-uploaded web apps and " +
      "webpages. And these apps and pages can also further contain links to " +
      "app and pages, which means that this index will ultimately serve as " +
      "an index from which you can navigate to all the useful user-uploaded " +
      "apps and webpages in existence."
    }</p>
    <p>{
      "And since there will be practically no limit of what this user-" +
      "uploaded apps can do, it means that this website can in principle " +
      "end up offering alternatives to all kinds of websites, like " +
      "Facebook, Twitter/X, YouTube, you name it."
    }</p>
    <p>{
      "Thus, the ultimate goal of this website is to become what we might " +
      "call an \"Everything Website.\""
    }</p>
  </section> */}

  <section>
    <h2>{"Getting started"}</h2>
    <p>{
      "Of course, before this UP Web can become a reality, we need users who " +
      "want to take part in programming some of the first UP apps, and to " +
      "familiarize themselves with the system."
    }</p>
    <p>{
      "Maybe you want to give it a go? All help and engagement is greatly " +
      "appreciated!"
    }</p>
    <p>{[
      "To learn how to get started with creating and uploading your own app " +
      "components, you can follow the ",
      <ILink key="tut-link-1" href="/tutorials" >
        {"Tutorials"}
      </ILink>,
      " of this website."
    ]}</p>
    <p>{[
      "And to see what other users have already created, go to the ",
      <ILink key="link-comp" href="/entPath/1/1/em1.js;get/components" >
        {"Components"}
      </ILink>,
      " page. Or if you want to take a look at some of the ongoing projects in " +
      "the user community, go to the ",
      <ILink key="link-proj" href="/entPath/1/1/em1.js;get/projects" >
        {"Projects"}
      </ILink>,
      " page."
    ]}</p>
    <p>{[
      "We hope that you will have fun creating your own UP apps, and in " +
      "taking an early part in this open source movement!"
    ]}</p>
  </section>
</div>;



export const styleSheets = [
  abs("../style.css"),
];
