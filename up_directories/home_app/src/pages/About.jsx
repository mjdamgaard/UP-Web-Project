
import * as ILink from 'ILink';


export function render() {
  return <div className="page about-page">

    <h2>A user-programmable platform</h2>
    <p>
      This is a "user-programmable" platform, which is an open-source and
      decentralized platform where the users are free to upload their own apps
      to the platform, as well as their own modifications to existing apps.
    </p>
    <p>
      Each of the user-uploaded apps and modifications will generally be made
      available to all other users as well, meaning
      that each user is free to choose exactly which version of each app that
      they prefer, without having to go to a different web domain or
      download a different mobile app.
    </p>
    <p>
      The user-uploaded apps are all interpreted in a safe sandbox, which makes
      it possible for users to share their new apps and modifications quickly
      and safely with the rest of the community, without the risk of them
      hacking each other.
      {/* This sandbox even extends
      to the back end as well, which means that the user-uploaded apps are not
      limited to one particular back end, but are free to implement their own. */}
    </p>
    {/* <p>
      This sandbox even extends to the back end as well, allowing users to
      upload the source code to be executed server-side, and
      thereby implement their own back-end data structures and algorithms.
    </p> */}
    {/* <p>
      Furthermore, the platform does not require the user-uploaded apps to
      allocate any computational resources or storage space in advance (apart
      from the space for the source code itself). Instead these
      resources are simply allocated only on demand, which means that platform
      will generally be able to accept and host any new user-uploaded app or
      modifications for free, or at least for a miniscule cost.
    </p> */}
    <p>
      Furthermore, the platform does not require the user-uploaded apps to
      allocate any resources in advance, apart from just the storage space for
      the source code itself. This means that costs of platform will not
      depend much on the number of apps and app versions that it hosts, but
      mostly on how many users use those apps. The platform is therefore able
      accept and host new apps and app versions at a miniscule cost to the
      uploading users.
    </p>


    <h3>Advantages</h3>
    <p>
      One of the great advantages of a user-programmable platform is that the
      users will be able to trust that they can get things how
      <i>they</i> want it. They can get the algorithms that <i>they</i> want,
      as well as the layout, style, and features that <i>they</i> want.
    </p>
    <p>
      This is opposed to any conventional platform where the users are at the
      mercy of the decisions of a relatively small central group of
      developers and designers.
      And if a user wants something different, they have to migrate to a
      different platform, leaving their existing network behind.
    </p>
    {/* <p>
      That is not the case for a user-programmable platform, since users with
      completely different preferences can still be part of the same network.
      In fact, user networks do not even need to be tied to any particular app
      on the platform, but can also be shared across multiple apps.
      {/* And due to the open-source and decentralized nature of the platform, you
      also do not have to rely on any single company for not either neglecting
      or ruining the apps with forced updates all of a sudden. * /}
    </p> */}
    <p>
      Furthermore, since the development of the platform is not dependent on a
      central group of developers, but is open for everyone to contribute,
      development will be able to move fast, as the platform can
      essentially draw on the entire world for coming up with new creative
      ideas, and for implementing those ideas.
    </p>
    <p>
      This is a great advantage, and one that will only become more and more
      valuable as AI continues to advance as a development tool. In a future
      where almost anyone can engage in software development, using just
      their natural language as a programming language, the concept of
      relying on a central group of developers and designers will no doubt
      seem more and more meaningless as time goes on.
    </p>
    <p>
      The only way to truly embrace the powers of AI is thus to also embrace
      this technology of a user-programmable platform, and allow the creativity
      of the users to be set free.
    </p>


    {/* <h3>Allowing users to donate towards specific tasks</h3>
    <p>
      As part of engaging the user community and giving them more control and
      autonomy, we (at up-web.org) also intend to implement an app on the
      platform where the users themselves can create software tickets for
      specific updates or features that they would like.
    </p>
    <p>
      The users will then be able to vote on which tickets they think are the
      most important, and will even be able to donate money towards
      these tickets. The tickets are then auctioned off to developing users
      who are willing to bid on them. And if the winner of the auction
      then completes the given ticket to a satisfactory degree, that user will
      earn the money that was donated towards the ticket.
    </p>
    <p>
      This will increase autonomy of the users, allowing them to take matters
      into their own hands for getting the updates that they desire, rather
      than having to rely on a central group of developers for deciding what is
      important. 
    </p> */}

  
    <h3>Core business model</h3>
    <p>
      The costs of the platform will mainly be carried by the end users who use
      the apps on it. These users will either pay through subscriptions, or by
      watching ads, or through individual donations.
    </p>
    <p>
      The company behind up-web.org
      (which is just one node in a decentralized network)
      seeks to be completely transparent about its costs, and seeks
      to take the user community on board in terms of how they prefer to
      pay these costs.
    </p>
    {/* <p>
      There are also other possible sources of income on top of this, such as
      sponsorships, grants, and public funding.
      And if a lot of users end up donating to each other through the software
      tickets mentioned above, we can also potentially take a cut of this
      money if the users are on-board.
    </p> */}
    <p>
      Additionally, while the developing users are always free to use
      open-source licenses for their apps and software components, we will also
      allow them to choose other kinds of licenses if they wish to have more
      specific control over how their apps and components are monetized. And in
      return, we will require a cut of the revenue that these closed-source
      apps and components generate.
    </p>


    <h3>Explore this website</h3>
    <p>
      On the
      <ILink key="l-home" href={`/`}>home page</ILink>
      of this website, you will see a list of user uploaded
      apps. Try clicking e.g. on the app titled 'Flip game,' and you will
      see a little puzzle game as an example.
    </p>
    <p>
      If you then go back and click on the triple bar (≡) button on the right,
      you will see a list of alternative user-uploaded versions of the same app
      that you can choose from.
    </p>
    <p>
      When logged in, you can also rate the app versions via the arrow (⇧⇩)
      buttons. This user input can then be used gauge the popularity of
      each app version, and makes it possible to always load the most popular
      version of the app by default.
      {/* (after it has been verified for safety, of course). */}
    </p>
    <p>
      And if you want a different version than the most popular one for a given
      app, you can click a star (☆) button to mark that version as
      your favorite, making it the one that is loaded the next time you open
      the app.
    </p>
    <p>
      Lastly, if you try clicking on the app called 'Home app,' you will see
      that you are led to an app that is identical to the home page.
      This is because the home page itself is actually a
      user-uploaded app, and can therefore also be forked and modified freely
      by the users as well!
    </p>
    <p>
      This even includes the page header and the account menu of the website,
      as well as the algorithms behind which apps are shown on the home page,
      and how these apps are updated automatically. Everything you see on
      this website can be forked and modified!
    </p>



    <h3>An easy-to-use framework</h3>
    <p>
      This platform offers a high-level development framework that is easy
      to use. As long as you just know a little bit of JavaScript/TypeScript,
      and preferably also a bit of React, you will be able to make your own
      new apps and features in no time!
    </p>
    <p>
      And it will not be long before we will also be able to assist you in
      using AI to help you build your apps and features even more quickly!
    </p>
    <p>
      In order to get started building your own user-programmed (UP) apps, go
      check out the
      <ILink key="l-tut" href={`~/../tutorials`}>tutorials</ILink>.
    </p>
  </div>;
}
