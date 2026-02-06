
import * as ILink from 'ILink.jsx';
import * as ELink from 'ELink.jsx'; 


export function render() {
  return indexPage;
}

const indexPage = <div className="text-page">
  <h1>The User-Programmable Web</h1>
  <section>
    <h2>Serverless computing on a new level</h2>
    <p>
      The User-Programmable Web (UP Web) is an open-source web development
      framework that takes the concept of
      <ELink key="link-serverless"
        href="https://en.wikipedia.org/wiki/Serverless_computing"
      >
        serverless computing
      </ELink>
      to the next level. Not only do applications scale automatically, they
      scale without any cost to the developers. 
    </p>
    <p>
      The cost of the resources that an app consumes is instead paid for by
      the users of that app, who pay either by watching ads on the website on
      which the app is hosted, or via subscription to the website.
    </p>
    <p>
      Furthermore, the organization behind up-web.org will function as a
      nonprofit, and its goal will be to maximize the benefit of the users of
      the UP Web.  
    </p>
    <p>
      All profits will thus go towards rewarding the open source developers of
      the UP Web, along with content creators and other contributors.    
    </p>
  </section>

  <section>
    <h2>Open source and free data portability</h2>
    <p>
      The fact that the UP Web is an open source project means that anyone is
      free to set up their own versions of up-web.org, and to modify the
      source code at will.
    </p>
    <p>
      In fact, up-web.org encourages this kind of competition from other
      service providers, and vows to
      always try to make it as easy as possible for developers and users to
      transfer their apps and data to other service providers.
    </p>
    <p>
      So if anyone has complaints about how up-web.org functions, or how it
      redistributes its profits to the contributors, they are completely free
      to set up a competitor that aims to do things differently. 
    </p>
    <p>
      And apart from allowing for free data portability,
      up-web.org also vows to allow apps to communicate freely across different
      service providers. This means that apps can potentially extend over
      several service providers at once, and utilize all the different user
      networks as one combined network.
    </p>
  </section>

  <section>
    <h2>Easy to get started</h2>
    <p>
      It is easy get started making your first user-programmed app. On the
      <ILink key="link-tut-1" href="/tutorials">
        {"Tutorials"}
      </ILink>
      page you will find a list of tutorials that will teach you how.
    </p>
    <p>
      By the end of
      the first tutorial, you will have learned how to upload a simple
      "Hello, World!" app. And the next couple of tutorials will teach you how
      to style your apps, how to make them responsive, and how to
      make them upload and download data from the database.
    </p>
    <p>
      In fact, by the end of
      <ILink key="link-tut-SMs" href="/tutorials/server-modules">
        {"Tutorial 5"}
      </ILink>,
      you will already have learned how to make a little message app, where
      you and other users can communicate, privately or publicly.
    </p>
    <p>
      The development framework that is provided is a JavaScript framework
      inspired by
      <ELink key="link-w3-react"
        href="https://www.w3schools.com/react/default.asp"
      >
        React
      </ELink>.
      So if you are already familiar with React, getting started will be
      particularly easy. 
    </p>
    <p>
      And once you have uploaded a new app or webpage, it will in theory stay
      up forever, until you modify or delete it.
    </p>
    <p>
      That is, unless your app breaks our terms of service, of
      course, which involves adhering to the GDPR, as well as not trying to
      scam other users, etc.
    </p>
  </section>

  <section>
    <h2>User-uploaded code is run in a sandbox</h2>
    <p>
      All user-uploaded code is executed in a sandbox that prevents it from
      accessing any unsafe features of JavaScript. This true both when the code
      is executed client-side and when it is executed server-side.
    </p>
    <p>
      Other users can therefore safely try out new app prototypes of yours
      without having to worry about their browser getting hacked. And you can
      safely try out theirs as well.
    </p>
    <p>
      Different apps are also assigned different parts of the database,
      isolated from each other. And apps can only upload and download data
      between each other when the creators have allowed it.
    </p>
  </section>

  <section>
    <h2>From Web 2.0 to Web 3.0</h2>
    <p>
      The change from Web 1.0 to
      <ELink key="link-web-2.0" href="https://en.wikipedia.org/wiki/Web_2.0">
        Web 2.0
      </ELink>
      meant the emergence of websites where the users are
      responsible for the content shown on the sites to a large extent.
    </p>
    <p>
      The structure and appearance of
      these websites are still, however, a responsibility solely of the
      owners of the websites, and the same is true for the algorithms that
      they use.
    </p>
    <p>
      The UP Web seeks to go one step further in this process by allowing the
      users to help program the apps for the websites as well, and help
      decide their appearance and their algorithms.
    </p>
    <p>
      And in the same way that content creators are often rewarded monetarily
      on Web 2.0 sites, so will the users that help create the apps and the
      algorithms for the UP Web.
    </p>
  </section>

  <section>
    <h2>Users can choose their own set of apps and algorithms</h2>
    <p>
      Since the mission of up-web.org is to maximize the benefit of its users,
      there is no point in trying to force a particular set of apps and
      algorithms on our user base. 
    </p>
    <p>
      Instead we will give each individual user the freedom to choose for
      themselves. And not only will they be free to choose which set of apps
      they want to use, but also which version of each individual app to use.
    </p>
    <p>
      We also strongly encourage our app-developing users to make it possible
      for other users to change and adjust the algorithms of the apps.
    </p>
    <p>
      Each user of up-web.org will thus start out with the most popular
      set of apps and algorithms as the default choice. And if they want to,
      they are then free to change this choice at any time.
    </p>
  </section>


  <section>
    <h2>Reasons to get excited about the UP Web</h2>
    <p>
      When users are free to choose the algorithms themselves,
      and when the app-developing users are rewarded for how well
      they benefit other users rather than how well the benefit the profits
      of the website, the UP Web will be able to eliminate some of the
      unfortunate circumstances that plagues the current web.
    </p>
    <p>
      In the following subsections, we will list some of the reasons
      why to get excited about the UP Web as a user.
    </p>

    <h4>1. Make it easier to limit your screen time</h4>
    <p>
      When you are in charge the algorithms that you use, you do not have to
      choose algorithms that are optimized for maximizing your watch time and
      engagement.
    </p>
    <p>
      If you want to make it easier for yourself to limit your screen time,
      you can thus simply choose algorithms that only shows you things
      that are relevant to what you initially looked for, rather than always
      trying to funnel you into a dopamine trap.
    </p>

    <h4>2. Filter out inappropriate content</h4>
    <p>
      When algorithms are only optimized to maximize your engagement,
      they are incentivized to push new content very quickly to a large group
      of users. But by doing so, they also increase the risk of showing
      inappropriate or damaging content to the users.
    </p>
    <p>
      But when you are in charge of the algorithms that you use, you can make
      sure that content is only shown to you once it has been past enough other
      users, who have then been given plenty of time to report the
      content if it is inappropriate.  
    </p>
    <p>
      And in case there is a shortage of users who volunteer to be among the
      first ones to see new content, and to report it it is inappropriate, we
      will start to give out rewards to such users as a way of attracting more.
    </p>

    <h4>3. Avoid misinformation</h4>
    <p>
      When algorithms are only optimized to maximize engagement, they are
      also not really incentivized to filter out content that spreads
      misinformation, as that kind of content only helps to increase
      engagement. 
    </p>
    <p>
      But when the algorithms are instead optimized to maximize user benefit,
      content that clearly spreads misinformation can be filtered out, in the
      same way as for inappropriate content.
    </p>
    <p>
      Furthermore, when facts are disputed, we can make sure that the user is
      warned about this. And we can even make sure to show list of fact-checking
      user groups and/or third parties in such cases, along with
      the scores for how these user groups and third parties have deemed the
      veracity of the information.
    </p>


    <h4>4. Suppress rude and nonconstructive posts and comments</h4>
    <p>
      Another downside of using existing web apps whose algorithms seek to
      maximize user engagement is that this has the effect of boosting
      negative discourse.
      This is due to the fact that negative and disruptive posts
      often attract more engagement than earnest and constructive ones.
    </p>
    <p>
      Whenever you reply to a rude post or comment, even if you reply in
      order to express your opposition to it,
      the algorithms still see this as engagement,
      and will try to boost the visibility of such content in the future,
      for you and for other users.
      Therefore, paradoxically, showing your opposition to a piece of content
      actually helps that content.
    </p>
    <p>
      Furthermore, since negative post and comments are boosted by the
      algorithms in this way, users who wants more attention are thus
      incentivized to create even more negative and disruptive content, leading
      to a bad spiral effect.
    </p>
    <p>
      However, when the algorithms are user-programmed, and are not
      trying to optimize for engagement at all cost, it is a rather simple
      matter to give the users the option to rate posts and comments on a
      scale from being nonconstructive to being earnest, and to have the
      algorithms strongly suppress the users that tends to be nonconstructive
      in their posts and comments.
    </p>

    <h4>5. Filter out AI slop and clickbait</h4>
    <p>
      The contemporary algorithms that only try to maximize watch time
      and user engagement are also effectively blind to whether the given
      piece of content is clickbait, or if it is AI slop, or in general if
      it pretends to be something that it is not.
    </p>
    <p>
      But with user-programmed algorithms, it is also a rather simple
      matter to allow users to rate whether a given post is clickbait, or
      AI generated, or otherwise insincere, which then allows the algorithms
      to subsequently suppress that post.
    </p>

    <h4>6. Control what data the algorithms collect</h4>
    <p>
      Another issue with contemporary web apps is that they are often not
      very transparent about what data they collect about you.
    </p>
    <p>
      But when each user can choose exactly which algorithms to use, the
      they can also choose precisely what data should and should not be
      collected about them.
    </p>

    {/* <h4>7. Enjoy a greater variety of possibilities</h4>
    <p>
      Last but not least, since the UP can draw on its entire user base for
      coming up with new creative solutions and features, both for the UI of
      the apps as well
      as for the algorithms, it will no doubt lead to much greater variety of
      possibilities for the users.
    </p>
    <p>
      The world of open source already has a vast number of contributors,
      collectively spending vast amounts of time and energy on open source
      projects, despite often not getting paid at all for their contributions.
      And if the UP Web can attract even just a small fraction of all that work
      and energy, it will not take long before the UP Web can offer products
      that are on par with contemporary apps.
    </p>
    <p>
      This is especially true now that web development has never been easier.
      There are so many resources available now that web developers can utilize
      in order to expedite the processes, and to make even fairly complicated
      apps in relatively small amounts of time.
      Furthermore, the framework that the UP Web offers
      takes care of most of the security-related aspects automatically, which
      makes it very easy for developers to also ensure that their apps are
      secure, on top of providing a good UI.   
    </p>
    <p>
      And after the apps of the UP Web have reached the same level as
      contemporary ones, the UP Web can only continue to evolve from there,
      drawing on the combined creativity of all users, who can continue to come
      up with new ideas for useful apps and features.
    </p> */}
  </section>

  <section>
    <h2>{"How to get started"}</h2>
    <p>{[
      "If you want to get started on making your first user-programmed apps, " +
      "go to the ",
      <ILink key="link-tut-2" href="/tutorials" >
        {"Tutorials"}
      </ILink>,
      " page."
    ]}</p>
    <p>{[
      "And to see a list of the ongoing projects related to the UP Web, " +
      "go see the ",
      <ILink key="link-proj" href="/entPath/1/1/em1.js;get/projects" >
        {"Projects"}
      </ILink>,
      " page."
    ]}</p>
    <p>{[
      "You can also go to the ",
      <ILink key="link-comp" href="/entPath/1/1/em1.js;get/components" >
        {"Components"}
      </ILink>,
      " page to see some of the proof-of-concept app components that have " +
      "been made so far. (After having clicked on an element in this list, " +
      "you need to click 'View component' in order to see it rendered.)"
    ]}</p>
    <p>{[
      "And if you want to have a look at the fundamental source code " +
      "of the project, or perhaps want to help maintain and extend it at " +
      "some point, this is currently found at ",
      <ELink key="link-github-repo"
        href="https://github.com/mjdamgaard/UP-Web-Project">
        {"github.com/mjdamgaard/UP-Web-Project"}
      </ELink>,
      "."
    ]}</p>
    <p>{[
      "Once it becomes relevant for you, there is also a ",
      <ILink key="link-contr" href="/entPath/1/1/em1.js;get/contributions" >
        {"Contributions"}
      </ILink>,
      " page where you can log your contributions to the project. (Also " +
      "feel free to contact up-web.org directly, if you want us to take " +
      "note of a contribution of yours.) " +
      "Note that contributions do not need to be related to source code " +
      "only. They can also be things such as spreading awareness of the " +
      "project, which will also be very much appreciated, indeed."
    ]}</p>
    <p>{
      "But before you go anywhere, please note that this website is still " +
      "only a " +
      "prototype at this stage. So please excuse all the rough edges " +
      "that you will find here and there."
    }</p>
  </section>

</div>;





export const styleSheets = [
  abs("../style.css"),
];






//   <section>
//     <h2>{"A sandboxing technology that gives the users free rein"}</h2>
//     <p>{
//       "We use a sandboxing technology that allows users to safely upload " +
//       "new apps, or new versions of existing apps, and " +
//       "have other users try them out without needing to fear getting hacked."
//     }</p>
//     <p>{
//       "The development process of a UP website therefore requires very " +
//       "little central oversight, and " +
//       "users are free to quickly " +
//       "and easily share new app ideas with each other, without the need for " +
//       "the apps to go through a centralized review process first."
//     }</p>
//     <p>{
//       "Furthermore, the sandboxing technology allows us to store the " +
//       "uploaded source code " +
//       "modules in the database rather than in the limited file system of the " +
//       "HTTP server itself. This means that there is practically no limit to " +
//       "how many apps the users can create, as well as how many versions " +
//       "each app can have!"
//     }</p>
//     <p>{
//       "And importantly, as the creator of a new app or feature, you do not " +
//       "pay anything at all for the server traffic and the data storage " +
//       "that the app uses! " +
//       "The fact that other users choose to use your app over others should " +
//       "not come at a cost to you. (If anything, you should be rewarded for " +
//       "it.)"
//     }</p>
//     <p>{
//       "The cost of the traffic and storage space is instead carried by the " +
//       "users of the app, who might " +
//       "pay by watching ads in the margins of the website, or by simply " +
//       "helping to attract " +
//       "more sponsors and donors to the website through their activity."
//     }</p>
//     <p>{
//       "The users thus have an incredible freedom to create and modify apps " +
//       "in a decentralized way. " +
//       "And we hope that the UP Web will develop into a whole ecosystem " +
//       "of web apps of all kinds, and where there is a very short and quick " +
//       "route from idea to practice!"
//     }</p>
//     {/* <p>{
//       "So whenever you have an idea for a new app or a new feature to an " +
//       "existing app, you can very quickly implement a prototype of that app " +
//       "or feature, and upload it under a relevant category such that other " +
//       "users can find it and try it out. These users might then help you " +
//       "finish the project. And once it is finished and ready to use, " +
//       "the app or modification does not need to go through a centralized " +
//       "review process, and then be rolled out to all users at once. " +
//       "Instead it can just gradually be picked up by more and more of the " +
//       "user base, until it has reached everyone who wants it."
//     }</p>
//     <p>{
//       "And whenever a user does not like a new feature to a given app, they " +
//       "are completely free to just pass on it, and keep using a version of " +
//       "the app without that feature."
//     }</p> */}
//   </section>


//   {/* <section>
//     <h2>{"Other exciting ideas"}</h2>
//     <p>{
//       "Apart from seeking to implement open source versions of existing web " +
//       "apps on the market, up-web.org also has some exciting projects ..."
//     }</p>

//     <h3>{"Scalar predicates"}</h3>
//     <p>{
//       "The fact contemporary web apps often optimize their algorithms to " +
//       "maximize watch time and engagement is not the only valid critique " +
//       "against them. Another point of critique is that the data they collect " +
//       "is often very low quality in terms of figuring out what the users are " +
//       "into."
//     }</p>
//     <p>{
//       "Most conventional web apps only has a single thumbs up or thumbs down " +
//       "rating that the users can interact with. And whether or not you hit " +
//       "the thumbs up button might depend a lot on your current mood, as well " +
//       "as if the given content creator asks you to."
//     }</p>
//     <p>{
//       "And apart from this, the algorithms only has your activity to go by, " +
//       "which as we have argued above is also not a very good measure, as it " +
//       "often inadvertently boosts clickbait and negative content, etc."
//     }</p>
//     <p>{[
//       "We want to make up for this by introducing 'scalar predicates,' " +
//       "which you can think about as a kind of ",
//       <ELink key="link-tag"
//         href="https://en.wikipedia.org/wiki/Tag_(metadata)">
//         {"tags"}
//       </ELink>,
//       ", but where each tag can be rated on a scale."
//     ]}</p>
//     <p>{
//       "For instance, if a user wants to rate a given movie, instead of just " +
//       "being able to say whether it is good or bad, the user gets a wide " +
//       "range of predicates to choose from. This could be predicates such as " +
//       "'funny,' 'scary,' 'has good acting,' etc."
//     }</p>
//     <p>{
//       "By thereby allowing users to be much more precise about what they " +
//       "like and dislike about a given resource, and what qualities it has " +
//       "in general, we can thereby get data of much greater quality when it " +
//       "comes the algorithms."
//     }</p>
//     <p>{
//       "And with much greater quality of data we will be able to get a much " +
//       "greater quality of algorithms. In other words, we do not have to " +
//       "make algorithms that are more computationally sophisticated than " +
//       "contemporary ones in order to beat them. We just have to create " +
//       "an avenue for the users to provide data of a much greater quality to " +
//       "the algorithms."
//     }</p>
//     {/ * <p>{
//       "And while a simple thumbs up or thumbs down button makes for a " +
//       "simpler user interface, it does not necessarily mean a better user " +
//       "experience. For even though ..."
//     }</p> * /}
//     <p>{[
//       "For more on this project, go to ",
//       <ILink key="link-semantic-qualities" href="/intro/qualities" >
//         {"this page"}
//       </ILink>,
//       "."
//     ]}</p>

//     <h3>{"Structured comment sections"}</h3>
//     <p>{
//       "Another project that up-web.org is excited to introduce is one about " +
//       "structured comment sections."
//     }</p>
//     <p>{
//       "When a users visits the comment section of a given post or resource, " +
//       "it is not always for the same reason. " +
//       "Sometimes they might primarily be interesting in seeing the positive " +
//       "reaction comments, other times they might be interested in seeing the " +
//       "negative ones. And sometimes they might not be looking for reaction " +
//       "comments at all, but rather for factual comments clarifying some " +
//       "question the user has about the resource, or for discussions about a " +
//       "specific topic relating to the resource."
//     }</p>
//     <p>{
//       "But when all these types of comments are mixed together in the same " +
//       "single thread, what you are looking for is often drowned out by the " +
//       "other types of comments."
//     }</p>
//     <p>{
//       "This is why we also seek to implement more structured comment " +
//       "sections, where each type of comment can be put under a fitting " +
//       "category, represented by a tab, such that you can more easily find " +
//       "what you are looking for."
//     }</p>
//     <p>{
//       "Furthermore, when it comes to discussions, each statement that is " +
//       "being discussed should have a tab of arguments and counterarguments, " +
//       "ordered such that the most relevant ..."
//     }</p>

//   </section> */}
