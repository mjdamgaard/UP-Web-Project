
import {getHomeDirID} from 'route';
import * as ILink from 'ILink';

const homeDirID = getHomeDirID();


export function render() {
  return <div className="page about-page">

    <h2>A user-programmable platform</h2>
    <p>
      This is a "user-programmable" platform where the users
      themselves are free to extend and fork the apps on the platform,
      and build new ones. And each individual user is free to choose
      whichever version of each app that they like.
    </p>
    <p>
      The user-uploaded apps are all interpreted in a safe sandbox, which
      prevents users from hacking each other. And this sandbox even extends to
      the back end, which means that the user-uploaded apps can actually
      implement their own back end as well.
    </p>


    <h3>Explore this website</h3>
    <p>
      On the home page of this website, you will see a list of user uploaded
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
      version of the app by default (after it has been verified for safety, of
      course).
    </p>
    <p>
      And if you want a different version than the most popular one of a given
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
      and how these apps are updated automatically, etc. Everything you see on
      this website can be forked and modified!
    </p>


    <h3>An easy-to-use framework</h3>
    <p>
      This platform offers a high-level development framework that is very easy
      to use. As long as you just know a little bit of JavaScript/TypeScript,
      and preferably also a bit of React, you will be able to make your own
      new apps and features in no time!
    </p>
    <p>
      And it will not be long before we will also be able to assist you in
      using AI to help you build your apps and features even more quickly!
    </p>


    <h3>Free hosting</h3>
    <p>
      As an app-developing user, it will actually be almost completely free for
      you to have your apps hosted by the platform, except only for
      a miniscule cost up front for storing the source code of your apps
      itself.
    </p>
    <p>
      The rest of the costs in terms of e.g. the computational resources and
      the storage space for the data uploaded by the users of your apps will
      instead be carried by those users themselves.
    </p>
    <p>
      The users of the apps pay for their resource consumption either by
      watching ads on the platform, or via subscription plans.  
    </p>
    <p>
      As a developing user, you can then either choose to license your apps
      completely open-source, which means that they can be used by other
      user-programmable platforms as well, as part of a decentralized,
      open-source network.
      Or you can choose to give exclusive license rights to this platform
      in particular, which will allow it to monetize your apps more
      efficiently for you.    
    </p>
    {/* <p>
      A sizable portion of the revenue of the platform will then be used to
      reward these app developers for their contributions. (The exact
      percentage is TBD.) And if investments and/or revenue is
      lacking at first, the company behind this platform might choose to reward
      the early contributors in stock units instead, which also has the benefit
      of giving the developing users a vested interest and a vote in the
      company.
    </p> */}
    <p>
      So on top of the hosting being almost completely free, the platform will
      even let a sizable portion (the exact percentage is TBD) of its revenue
      go towards rewarding the developing users who have made important and
      popular contributions to the platform.
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
    <p>
      That is not the case for a user-programmable platform, since users with
      completely different preferences can still be part of the same network.
      In fact, user networks do not even need to be tied to any particular app
      on the platform, but can also be shared across multiple apps.
    </p>
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



    <h3>More information</h3>
    <p>
      To read about some particularly exciting <b>use cases</b> for this
      technology, follow
      <ILink key="l-uc" href={`/o-${homeDirID}/use-cases`}>this link</ILink>!
    </p>
    <p>
      And to see the <b>tutorials</b> for how to get started on creating your
      own "user-programmed" apps, follow
      <ILink key="l-tut" href={`/o-${homeDirID}/tutorials`}>this link</ILink>!
    </p>
    <p>
      Or to go back and <b>explore</b> the current app examples further, follow 
      <ILink key="l-home" href="/">this link</ILink>.
    </p>

  </div>;
}
