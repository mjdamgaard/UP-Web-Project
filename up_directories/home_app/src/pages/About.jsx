
import {getHomeDirID} from 'route';
import * as ILink from 'ILink';

const homeDirID = getHomeDirID();


export function render() {
  return <div className="page about-page">

    <h2>A user-programmable platform</h2>
    <p>
      This is a "user-programmable" platform, which is one where the users
      themselves can actually extend and fork the apps on the platform,
      and build new ones! And each individual user is then free to choose
      whichever version of each app that they like! 
    </p>
    <p>
      The user-uploaded apps are all interpreted in a safe sandbox, which
      prevents users from hacking each other. And this sandbox even extends to
      the back end, which means that the user-uploaded apps can actually
      implement their own back end as well, both in terms of the data
      structures and the algorithms!
    </p>


    <h3>Explore this website</h3>
    <p>
      On the home page of this website, you will see a list of user uploaded
      apps of a few different varieties that you can try out by clicking on
      them. For instance, if you click on the app titled 'Flip game,' you can
      see a little puzzle game as an example. And if you click on the triple
      bar ("≡") button on the right instead, you will see a list of alternative
      versions you can choose from.
    </p>
    <p>
      The list of apps even include the 'Home app,' which implements the app
      that defines the home page of this website. That's right, everything you
      see on this website is actually implemented as a user-uploaded app itself,
      and can therefore also be modified and extended by the users! If you thus
      click on the triple bar ("≡") to the right for the 'Home app,' you can
      explore and choose between other home page apps uploaded by users.
    </p>
    <p>
      When logged in, you can also click a star ("☆") button to mark a given
      version as your favorite, which means that this version will be the one
      that is loaded the next time you open the given app.
    </p>
    <p>
      You can also rate the app versions via the arrow ("⇧⇩") buttons. If a new
      version of an app becomes more popular than the previous one, and if the
      user community has verified its safety, the new version will automatically
      take the place of the old one. Thus, you don't have to manually update
      your apps yourself by continuously choosing new favorite versions. You
      can also just lean back and let the user community be in charge of
      updating your apps.
    </p>
    <p>
      By the way, the whole algorithm of how apps are updated is implemented
      via the aforementioned 'Home app,' which the users are free to
      fork and change. Thus, the users even get control over how their apps are
      updated automatically.
    </p>


    <h3>An easy-to-use framework</h3>
    <p>
      This platform offers a high-level development framework that is very easy
      to use. As long as you just know a little bit of JavaScript/Typescript,
      and preferably also a bit of React, you will be able to make your own
      new apps and features in no time!
    </p>
    <p>
      And it will not be long before we will also be able to assist you in
      using AI to help you build your apps and features even more quickly!
    </p>
    <p>
      <i>A tutorial for how to get started creating and uploading your own
      "user-programmed" apps will be available very soon!</i>
    </p>


    <h3>Business model</h3>
    <p>
      As an app-developing user, it will actually be basically free for you to
      upload your apps and have them hosted by on the platform, except only for
      the miniscule cost up front of storing the source code itself.
      The rest of the costs, namely in terms of computational resources and
      storage space for the data uploaded by users of your apps, will instead
      be carried by those users themselves.  
    </p>
    <p>
      The users of the apps pay for their resource consumption either by
      watching ads on the platform, or via subscription plans.  
    </p>
    <p>
      The developing users can either choose to license their apps completely
      open-source, which means that they can be used by other user-programmable
      platforms as well, as part of a decentralized, open-source network.
      Or they can choose to give exclusive license rights to this platform
      in particular, allowing it to monetize their apps more efficiently.    
    </p>
    <p>
      A sizable portion of the revenue of the platform will then be used to
      reward these app developers for their contributions. (The exact
      percentage is TBD.) And if investments and/or revenue is
      lacking at first, the company behind this platform might choose to reward
      the early contributors in stock units instead, which also has the benefit
      of giving the developing users a vested interest and a vote in the
      company.
    </p>


    <h3>Advantages</h3>
    <p>
      One of the great advantages of a user-programmable platform is first of
      all that the users will be able to trust that they can get things how
      <i>they</i> want it. They can get the algorithms that <i>they</i> want,
      as well as the layout, style, and features that <i>they</i> want.
    </p>
    <p>
      This is opposed to any conventional platform where the users are at the
      mercy of the decisions of a relatively small central group of
      developers and designers.
      And if a user wants something different, they have to migrate to a
      different platform, leaving their existing network behind.
      That is not the case for a user-programmable platform, since users with
      completely different preferences can still be part of the same network.
    </p>
    <p>
      Furthermore, since the development of the platform is not dependent on a
      central group of developers, but is open for everyone to contribute, it
      means that development can move very fast, as the platform can
      essentially draw on the entire world for coming up with new creative
      ideas, and for implementing those ideas.
    </p>
    <p>
      This is a great advantage, and one that will only be more and more
      valuable as AI continues to advance as a development tool. In a future
      where almost everyone can engage in software development, using just
      their natural language as a programming language, the concept of
      relying on a central group of developers will seem more and more
      meaningless as time goes on.
    </p>
    <p>
      The only way to truly embrace the powers of AI is thus to also embrace
      this technology of a user-programmable platform, and allow the creativity
      of the users to be set free.
    </p>



    <h3>More information</h3>
    <p>
      To read more about some particularly exciting <b>use cases</b> for this
      technology, follow
      <ILink key="l-uc" href={`/o-${homeDirID}/use-cases`}>this link</ILink>!
    </p>
    <p>
      And to get started on creating your own "user-programmed" apps, see
      the <b>tutorials</b>{" "}
      <ILink key="l-tut" href={`/o-${homeDirID}/tutorials`}>here</ILink>!
    </p>
    <p>
      Or to go back and <b>explore</b> the current app examples further, follow 
      <ILink key="l-home" href="/">this link</ILink>.
    </p>

  </div>;
}
