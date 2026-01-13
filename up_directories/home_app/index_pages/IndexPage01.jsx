
import * as ILink from 'ILink.jsx';
import * as ELink from 'ELink.jsx';


export function render() {
  return indexPage;
}


const indexPage = <div className="text-page">
  <h1>{"The User-Programmable Web"}</h1>
  <section>
    <h2>{"A decentralized network of open source web apps"}</h2>
    <p>
      The User-Programmable Web (UP Web) is meant to be a
      collection of open source websites where the users are in complete
      control over the appearance and functionality of the web
      apps, as well as the data structures and algorithms behind them!
    </p>
    <p>{
      "Here it is the users themselves that create and upload all the " +
      "front-end components and back-end modules that make up the website. " +
      "And each individual user gets to choose exactly " +
      "which set of apps and which set of algorithms they want to use, " +
      "regardless of whether they have contributed any source code themselves!"
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
      "new apps, or new versions of existing apps, and " +
      "have other users try them out without needing to fear getting hacked."
    }</p>
    <p>{
      "The development process of a UP website therefore requires very " +
      "little central oversight, and " +
      "users are free to quickly " +
      "and easily share new app ideas with each other, without the need for " +
      "the apps to go through a centralized review process first."
    }</p>
    <p>{
      "Furthermore, the sandboxing technology allows us to store the " +
      "uploaded source code " +
      "modules in the database rather than in the limited file system of the " +
      "HTTP server itself. This means that there is practically no limit to " +
      "how many apps the users can create, as well as how many versions " +
      "each app can have!"
    }</p>
    <p>{
      "And importantly, as the creator of a new app or feature, you do not " +
      "pay anything at all for the server traffic and the data storage " +
      "that the app uses! " +
      "The fact that other users choose to use your app over others should " +
      "not come at a cost to you. (If anything, you should be rewarded for " +
      "it.)"
    }</p>
    <p>{
      "The cost of the traffic and storage space is instead carried by the " +
      "users of the app, who might " +
      "pay by watching ads in the margins of the website, or by simply " +
      "helping to attract " +
      "more sponsors and donors to the website through their activity."
    }</p>
    <p>{
      "The users thus have an incredible freedom to create and modify apps " +
      "in a decentralized way. " +
      "And we hope that the UP Web will develop into a whole ecosystem " +
      "of web apps of all kinds, and where there is a very short and quick " +
      "route from idea to practice!"
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
    <h2>{"Reasons to get excited about the UP Web"}</h2>

    <h3>{"Free data portability and an end to enshittification!"}</h3>
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
    <p>{[
      "The service providers will thus have no leverage to start exploiting " +
      "the users, as is otherwise often the case in the process known as ",
      <ELink key="link-ens"
        href="https://en.wikipedia.org/wiki/Enshittification">
        {"enshittification"}
      </ELink>,
      "."
    ]}</p>

    <h3>{"Choose only the apps and features that you want!"}</h3>
    <p>{
      "When new apps or features are created, they are not just rolled " +
      "out to all users at once, as is generally the case for other " +
      "websites. On the UP Web, " +
      "each user can choose which apps and features to use independently of " +
      "each other."
    }</p>
    <p>{
      "Of course, the default options is to just follow along with whatever " +
      "settings are the most popular. But the user can change this at any time."
    }</p>
    <p>{
      "So whenever a new update comes along that e.g. moves a button to new " +
      "location that you do not like, or make any other kind of change that " +
      "you do not want, simply reject that update, and stick to the " +
      "version(s) of the app that you prefer!"
    }</p>

    <h3>{"Make it easier to limit your screen time!"}</h3>
    <p>{
      "Since the algorithms behind all the apps on the UP Web are user-" +
      "programmed, there is no real point for the creators to make them " +
      "aggressively try to maximize your watch time and engagement."
    }</p>
    <p>{
      "And since you are in complete control over which algorithms you use, " +
      "you can always make sure to choose ones that are not optimized " +
      "for making you stick to your screen for as long as possible!"
    }</p>
    <p>{
      "The UP Web will thus make it a lot easier for you to limit your " +
      "screen time when compared to existing web apps on the market."
    }</p>

    <h3>{"Filter out all inappropriate content!"}</h3>
    <p>{
      "When the algorithms are not optimized to maximize your engagement, " +
      "the algorithms also do not have to push new content to a lot of " +
      "users quickly, with the risk of showing them inappropriate or " +
      "downright damaging content."
    }</p>
    <p>{
      "Instead you can choose to only use algorithms that make sure to " +
      "give other users, who either volunteer, or who are just not as " +
      "sensitive to the same things, the time to review the content first. " +
      "And only once enough users has deemed the content appropriate, " +
      "in terms of the categories that you wish to avoid, will the content " +
      "be included in your feeds and search results."
    }</p>
    <p>{
      "And while up-web.org in particular intends to give each user free " +
      "rein to choose whatever algorithms they like, we will " +
      "also at some " +
      "point implement other UP websites where the algorithms are restricted."
    }</p>
    <p>{
      "So if you want to protect your children from viewing something that " +
      "is damaging for them, just make sure that their devices can only " +
      "access these restricted UP websites."
    }</p>

    <h3>{"Avoid misinformation!"}</h3>
    <p>{
      "In the same way that te UP Web will make it relatively easy to avoid " +
      "inappropriate content, by taking the time to review new posts rather " +
      "than quickly pushing it to a large audience, it will also be easier " +
      "to avoid misinformation."
    }</p>
    <p>{
      "Whenever a post contains some apparent information about the world, " +
      "the users that review new posts can mark it accordingly. " +
      "Then the post can be forwarded to volunteering fact-checking user " +
      "groups. And when the post finally reaches your feed, you will be able " +
      "to see how the various fact-checking user groups (that you have some " +
      "amount of trust in) have each rated the veracity of the post so far."
    }</p>


    <h3>{"Suppress rude and nonconstructive comments!"}</h3>
    <p>{
      "Another downside of using existing web apps whose " +
      "algorithms seek to maximize user engagement is that this has " +
      "the effect of boosting negative discourse."
    }</p>
    <p>{
      "This is due to the fact that negative and rude comments " +
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
      "matter to give the users the option to rate a given comment or " +
      "a given user on an earnest-to-rude scale, and to have the algorithms " +
      "strongly suppress the users that tends to be nonconstructive in their " +
      "comments."
    }</p>

    <h3>{"Filter out AI slop and clickbait!"}</h3>
    <p>{
      "The contemporary algorithms that only try to maximize watch time " +
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

    <h3>{"Control what data the algorithms collect!"}</h3>
    <p>{
      "Another issue with contemporary web apps is that they are often not " +
      "very transparent about the data they collect about you."
    }</p>
    <p>{
      "But when it is the users themselves that program the algorithms, and " +
      "these algorithms are open source, it is easy to see exactly what " +
      "data is being collected."
    }</p>
    <p>{
      "And since each user can choose exactly which algorithms to use, the " +
      "users will also be able to choose very precisely what data should and " +
      "should not be collected about them."
    }</p>
  </section>

  {/* <section>
    <h2>{"Other exciting ideas"}</h2>
    <p>{
      "Apart from seeking to implement open source versions of existing web " +
      "apps on the market, up-web.org also has some exciting projects ..."
    }</p>

    <h3>{"Scalar predicates"}</h3>
    <p>{
      "The fact contemporary web apps often optimize their algorithms to " +
      "maximize watch time and engagement is not the only valid critique " +
      "against them. Another point of critique is that the data they collect " +
      "is often very low quality in terms of figuring out what the users are " +
      "into."
    }</p>
    <p>{
      "Most conventional web apps only has a single thumbs up or thumbs down " +
      "rating that the users can interact with. And whether or not you hit " +
      "the thumbs up button might depend a lot on your current mood, as well " +
      "as if the given content creator asks you to."
    }</p>
    <p>{
      "And apart from this, the algorithms only has your activity to go by, " +
      "which as we have argued above is also not a very good measure, as it " +
      "often inadvertently boosts clickbait and negative content, etc."
    }</p>
    <p>{[
      "We want to make up for this by introducing 'scalar predicates,' " +
      "which you can think about as a kind of ",
      <ELink key="link-tag"
        href="https://en.wikipedia.org/wiki/Tag_(metadata)">
        {"tags"}
      </ELink>,
      ", but where each tag can be rated on a scale."
    ]}</p>
    <p>{
      "For instance, if a user wants to rate a given movie, instead of just " +
      "being able to say whether it is good or bad, the user gets a wide " +
      "range of predicates to choose from. This could be predicates such as " +
      "'funny,' 'scary,' 'has good acting,' etc."
    }</p>
    <p>{
      "By thereby allowing users to be much more precise about what they " +
      "like and dislike about a given resource, and what qualities it has " +
      "in general, we can thereby get data of much greater quality when it " +
      "comes the algorithms."
    }</p>
    <p>{
      "And with much greater quality of data we will be able to get a much " +
      "greater quality of algorithms. In other words, we do not have to " +
      "make algorithms that are more computationally sophisticated than " +
      "contemporary ones in order to beat them. We just have to create " +
      "an avenue for the users to provide data of a much greater quality to " +
      "the algorithms."
    }</p>
    {/ * <p>{
      "And while a simple thumbs up or thumbs down button makes for a " +
      "simpler user interface, it does not necessarily mean a better user " +
      "experience. For even though ..."
    }</p> * /}
    <p>{[
      "For more on this project, go to ",
      <ILink key="link-semantic-qualities" href="/intro/qualities" >
        {"this page"}
      </ILink>,
      "."
    ]}</p>

    <h3>{"Structured comment sections"}</h3>
    <p>{
      "Another project that up-web.org is excited to introduce is one about " +
      "structured comment sections."
    }</p>
    <p>{
      "When a users visits the comment section of a given post or resource, " +
      "it is not always for the same reason. " +
      "Sometimes they might primarily be interesting in seeing the positive " +
      "reaction comments, other times they might be interested in seeing the " +
      "negative ones. And sometimes they might not be looking for reaction " +
      "comments at all, but rather for factual comments clarifying some " +
      "question the user has about the resource, or for discussions about a " +
      "specific topic relating to the resource."
    }</p>
    <p>{
      "But when all these types of comments are mixed together in the same " +
      "single thread, what you are looking for is often drowned out by the " +
      "other types of comments."
    }</p>
    <p>{
      "This is why we also seek to implement more structured comment " +
      "sections, where each type of comment can be put under a fitting " +
      "category, represented by a tab, such that you can more easily find " +
      "what you are looking for."
    }</p>
    <p>{
      "Furthermore, when it comes to discussions, each statement that is " +
      "being discussed should have a tab of arguments and counterarguments, " +
      "ordered such that the most relevant ..."
    }</p>

    <h3>{"..."}</h3>

  </section> */}

  <section>
    <h2>{"Business model"}</h2>
    <p>{[
      "The business model of the company behind up-web.org " +
      "is to first of all have a ",
      <ILink key="tut-link-sponsors" href="/sponsors" >
        {"Sponsors"}
      </ILink>,
      " page where we showcase our sponsors, and ask our users to send some " +
      "appreciation their way."
    ]}</p>
    <p>{
      "We will also accept individual donations as well, from anyone " +
      "interested in supporting the project."
    }</p>
    <p>{
      "The money we receive will then be spent in order to help start up " +
      "and maintain the UP Web. And hopefully, if we do a " +
      "good job of this, we might " +
      "then be able to attract even more sponsors and donors in the future."
    }</p>
    <p>{
      "Apart from the maintenance of the servers, this money will also go " +
      "to rewarding the various " +
      "users who contribute apps and features to the project, as well as " +
      "those who help develop and extend the fundamental source code of the " +
      "project."
    }</p>
    <p>{
      "We then intend to let the donors and the sponsors help decide where " +
      "the money should flow to, by allowing them to vote on the best " +
      "algorithm to determine the rewards."
    }</p>
    <p>{
      "Lastly, if the donations and sponsorships turn out not to cover the " +
      "costs of the user activity, the website might start showing ads in " +
      "the margins of the webpages. But since users can easily move their " +
      "data and activity to another service provider in the " +
      "network, this will only happen if it turns out to be necessary."
    }</p>
  </section>

  <section>
    <h2>{"Rewarding content creators"}</h2>
    <p>{
      "You might be wondering at this point: If the website only shows ads " +
      "in the margins as a last resort, i.e. if the donations and " +
      "sponsorships are " +
      "too scarce, how will the content creators on the website be rewarded?"
    }</p>
    <p>{
      "Well, because the content creators maintain the IP rights to their " +
      "content, they are able to put restrictions on how that content can be " +
      "shown on the site. And in particular, they can require that their " +
      "content has to be shown inside components that also show ads from " +
      "time to time, or requires some payment by the users."
    }</p>
    <p>{
      "So the only difference, when compared to other websites that show " +
      "user content, is that up-web.org will not necessarily be taking the " +
      "role as the middleman between the content creators and the " +
      "advertising companies. The content creators might thus have to make " +
      "those deals with third-party companies instead."
    }</p>
    <p>{[
      "So at the end of the day, the UP Web will basically be able to " +
      "provide the same " +
      "opportunities for content creators as on the " +
      "current web. And in some ways, the UP Web will be able to " +
      "provide ",
      <i>{"more"}</i>,
      " opportunities, since the content creators are not forced to use " +
      "the given website as the middleman between them and the advertising " +
      "companies. Instead they will have a free market to choose from!"
    ]}</p>
    <p>{
      "Getting the freedom to choose exactly how their content should be " +
      "monetized might be a game changer for the content creators. " +
      "And since the ad revenue from content creators around the world is " +
      "measured in the billions of dollars, there is potentially a lot of " +
      "money on the line for them if this UP Web becomes a reality."
    }</p>
  </section>

  <section>
    <h2>{"Rewarding open source creators like content creators"}</h2>
    <p>{
      "If the UP Web becomes a reality, then there might also come a time " +
      "where we stop relying on sponsors and donors for " +
      "rewarding the open source contributors, and simply start using " +
      "a small portion of the money that goes to the content " +
      "creators. After all, having better apps and " +
      "algorithms in which to show the content will benefit all, both the " +
      "regular users and the content creators."
    }</p>
    <p>{
      "Now, think for a moment about the countless of hours that content " +
      "creators around the world pour into their work each year. " +
      "Imagine if even a small fraction of that vast amount of work went " +
      "into building new apps for the UP Web, and not least new " +
      "creative algorithms."
    }</p>
    <p>{
      "If that were the case, the UP Web would take over the Web in no " +
      "time, so to speak."
    }</p>
    <p>{
      "So rewarding the open source creators will be beneficial for " +
      "everyone involved. And it is not hard to imagine that the source code " +
      "creators whom the community will reward most generously for their " +
      "work will be the ones that helped the whole project take off."
    }</p>
    <p>{
      "Furthermore, the company behind up-web.org will make it one of " +
      "its primary missions to ensure exactly that, namely that the early " +
      "source code " +
      "creators, as well as anyone else who helped making the UP Web " +
      "take off, will be rewarded the most generously for their work."
    }</p>
    <p>{
      "We hope that this might add a bit of extra motivation for anyone who " +
      "is excited about the prospect of the UP Web and wants to join " +
      "the project."
    }</p>
  </section>

  <section>
    <h2>{"How to get started"}</h2>
    <p>{[
      "If you want to get started on making your first user-programmed apps, " +
      "go to the ",
      <ILink key="link-tut" href="/tutorials" >
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
      "prototype at this stage. So please excuse all the rough edges, so " +
      "to speak, that you will find here and there."
    }</p>
  </section>
</div>;


export const styleSheets = [
  abs("../style.css"),
];
