
# A user-programmable platform


## Introduction

A 'user-programmable platform' is a platform where the users are free to create, modify, and extend the apps that it offers, and where each end user is able to choose exactly which version of each app they want to use, without having to change to a different web domain or download a different app.

* *Are you tired of platforms whose algorithms always tries to funnel you into a dopamine loop?*
* *Are you tired of rude comments and posts not being sufficiently suppressed, or of misinformation and inappropriate content not being sufficiently moderated?*
* *Are you tired of search results being dominated by paid-for entires, rather than just showing you the things that are the most relevant?*
* *Are you tired of AI slop and clickbait?*
* *Are you tired of your data being sold to third parties, or of the lack of transparency in this regard?*
* *Are you tired of ads that just keep increasing in volume?*
* *Or are you tired of updates in general that make things worse?*

With a user-programmable platform, you do not need to worry about any of these problems. Here the users are in complete control over what apps and what algorithms they use, and are free to modify and extend them however they want.

Furthermore, a user-programmable platform is designed to make it very easy and quick for the developing users to share their prototypes of new apps and features with each other, with minimal central oversight needed, creating a very free and decentralized creative space in which users can collaborate on building and improving the apps on the platform.



## Key features of a user-programmable platform

### All forks of the platform can be hosted simultaneously from the same place

The users are free to create new apps on the platform as well as fork existing ones. And whenever a new version of an app is created, other users are free to try out this new version, and switch to it if they like, without having switch to another web domain or install a different app.


### A sandbox technology makes it safe to try out new apps

All user-uploaded apps and code modules are run in a sandbox which ensures that new prototypes for apps and features can be shared quickly among the users, without needing to first be verified for security.

Even when a new version of a given app is supposed access the same back-end data structure as its predecessor, such as e.g. the user's posts and messages in case of a social media app, it will only be able to do so once it is verified by the user community and/or by the administrators of the predecessor app. And until then, it can simply use a mockup of that data structure instead, making it safe for users to try out as well, without risking deletion or corruption of their data.

Being able quickly and safely share prototypes for new apps and features with a lot of users, who can give feedback and rate the project, and potentially even help complete it, means that the development of the platform can move very fast. 


### Transparency means that trust is not required

When an app or a back-end module is uploaded to the platform, the source code is generally completely visible to the public. And the creator of the app cannot change the source code on a whim while the app is in use.

This means that as long as you trust the user-programmable platform itself to show you the correct source code, you do not need to trust any given creator on the platform in order to know that it is safe to use their apps.

This removes a core issue that otherwise affects decentralized platforms in general, namely the issue that in order to use the desired features of the platform, the individual user often has to trust several different independent parties that they do not know much about.


### No need for allocating resources means free hosting! (almost)

Another feature of a user-programmable platform is that apps do not have to allocate storage space or computational resources in advance. Instead the resources are only allocated exactly when needed by the users of the given app.[^1]

[^1]: And if an app needs server-side maintenance routines to run at regularly scheduled intervals, these intervals can just be based on how many POST requests has occurred since the last execution, rather than on how much time has passed.

This means that it is essentially free for developers to upload new apps and features, as it only costs the system the storage space required for the given source code.

The funding of the resources is thus not a concern for the developers of the apps and features, but is instead a matter purely between the platform and the end users who consume those resources.
The platform thus keeps track of the resources that each user consumes, but does not care about *where* and *how* these resources are consumed.

Note that since the platform is able to host any kind of app, including any kind of website that you can imagine, personal or otherwise, you will thus be able to have any kind of website that you want hosted essentially for free and in perpetuity by a user-programmable platform: You only pay the small cost of storing the source code for your website (which might even be covered by a free plan), and the visitors/users of your site will carry the rest of the costs.


### An open and decentralized network

A user-programmable platform also ought to allow for decentralization, namely by allowing apps on one platform to communicate and transfer data with other platforms, in particular other user-programmable platforms, as well as any other platform that utilizes open protocols.  



## Proposed core business model: A freemium subscription model

Each user of the platform has an amount of resources that they can use for free each month, both in terms of storage space and computational resources. And if they need to use more than what the free plan allows, they need to subscribe to a paid plan.

The free resources that each user gets is paid for at least in part by sponsorships, grants, donations, and/or initial investments. And if this does not cover it, they can also be paid for in part by charging a the paying users more in the paid plans.



## An extended business model where the developing users also get paid

While a user-programmable platform could certainly be based purely on open-source contributions, and on the willingness of its users to improve the platform for themselves and others, there are also other possible models which allow the developing users to actually be rewarded for their contributions, and which can also make the platform more interesting for investors.

<!-- Such a model might be especially interesting if a user-programmable platform wants to succeed in the space of business applications, and not just web and mobile applications, since business customers will generally happily pay more in order to get quick and reliable updates and maintenance of the software. -->

We thus propose utilizing the model of an '[open developer co-op](open-dev-co-ops.md),' on top of the proposed core business model, in order for the platform to be able to attract more contributions, and more investments as well.

In short, this model designed to be a midway between an open source and a closed source model, in a way that still motivates the developers to collaborate publicly, and share their contributions quickly and openly with each other, but which nonetheless still limits the use of the resulting code base in order to generate a revenue, which can then be used to pay the developers.

And by promising investors a share of this revenue as well, this model can thus also help bring in investments for the platform.

You can read more about this model of 'open developer co-ops' [here](open-dev-co-ops.md).



## Use cases

* If you want more control over the algorithms of your platforms, as well as over how your data is handled, a user-programmable platform will be beneficial to you, namely since it puts its users completely in charge of the algorithms, and lets each user choose which one they want to use.

* If you are tired of updates turning things worse for you as a user, either intentionally (known as [enshittification](https://en.wikipedia.org/wiki/Enshittification)) or unintentionally, a user-programmable platform will also benefit you. Here you never have to accept a new update, but can freely choose whichever fork of the platform you like, and switch any time you want.

* If you have an idea for a new feature or improvement of a given app that you use, you can first of all share that idea, and if others find it interesting, you can collaborate on making a prototype, which all other users on the platform will immediately be able to try out. And if enough users like the new feature, it can quickly be added as a new fork to the given app, which you and other users can then enjoy.
    - A concrete example could be if you had the idea to add a shared calender as a feature to the group pages of a social media app, where the whole group can keep track of all events and appointments related to it.
    - Or it could be if you had the idea to add 'quizzes' and/or 'surveys' as a new type of post that you can post to you friends/connections on a social media platform.
    - It could also be if you had the idea to create a way to organize posts and threads in a group according to topics, such that you can find related posts and threads in one place, instead of only relying on a chronologically ordered feed.
    - Or if you had an idea for how to structure comment sections in a better way, such that reactions, jokes, and personal anecdotes are grouped separately from the purely factual comments and questions about the given post/resource.
    <!-- - Or in a similar vein, you might have an idea for how to structure discussion threads more like [argument maps](https://en.wikipedia.org/wiki/Argument_map), where each argument has a list of the most relevant arguments and counterarguments, as rated by the users, and where this structure repeats itself to form a whole tree of arguments and counterarguments for the given discussion. -->
    <!-- - Or another idea might be to introduce more parameters that users can rate for any given type resource (such as a post, a video, a movie, etc.), other than just the normal 'good vs. bad' parameter. Think of [tags](https://en.wikipedia.org/wiki/Tag_(metadata)), but where each tag forms its own rating scale, which can be rated by all users on the platform. Such "ratable tags" could then be used to improve search results, and to improve algorithms on the platform in general. -->
    - And as a last example, it would also be a natural idea for any social media app on a user-programmable platform to allow its users to freely build their own individual profile pages however they want, almost like a personal website.

* If you have an idea for some website or app that you want the world to see/use, and you do not aim for this website/app to make enough ad money to make it profitable, you can choose to publish it on a user-programmable platform and save all the costs of running the servers. On a user-programmable platform, the only cost to the developer is paying for the storage space for the source code, which is usually miniscule, and the users pay the rest of the costs. Thus, on a user-programmable platform, there is no ad money to win, but there is also no money to lose either. And your website/app will stay up for as long as the user-programmable platform stays up, regardless of how many users it has.



## The evolution of AI increases the advantages of user-programmable platforms

As AI continues to improve as a tool for software development, the process of going from idea to implementation gets easier and easier as time goes on. This means that companies who excel at the creative part of the process, namely of coming up with and recognizing good ideas, will get an increased competitive advantage. And this advantage will only grow over time, unless their competitors can find ways to keep up.

A user-programmable platform is designed exactly for the purpose of creating a free and decentralized creative space where anyone can contribute, not least the users of the platform themselves, who are generally the ones most likely to come up with new ideas for useful features and improvements, and who can best recognize the useful ideas of others.

Thus, if AI continues to evolve, user-programmable platforms stand to gain a significant advantage in the long run over any competitor who does not manage to engage its users to the same extend in the development of their platform.

Furthermore, the evolution of AI also means that more people can engage in the development of apps and features, without needing the same kind of experience as it once took. For a user-programmable platform, this means that a far greater part of the user base will be able to engage in the development of new apps and features, greatly increasing the amount of contributions that the platform can attract.

And due to the sandboxing of the all user-uploaded code, a user-programmable platform also creates a safe space where the AI coding agents can be given free rein to build new prototypes for apps and features, without having to worry about security at that stage.



## Existing platforms can also adopt the same technology

A platform does not need to be built as a user-programmable platform from the ground up in order to get the same benefits. Existing platforms can also adopt the same technology.

For instance, an open-source platform such as Mastodon, and the Fediverse at large, could adopt the same technology by introducing user-programmable instances. The same goes for BlueSky and the ATmosphere at large, which could adopt the technology by introducing user-programmable AppViews.

The benefits of doing this is the same as described above, which is to allow developers to collaborate on improving the platforms more quickly and freely, without having to bear the costs of starting new servers in order to share their prototypes and host their applications. And it means that these platforms can get a wider and more decentralized variety of choices, without diluting the trust and the safety on the platforms in the process, due to the transparency of user-programmable servers.

It is also even possible for closed-source platforms to adopt the technology, opening up parts of their platform for the users to extend and modify.[^2]

[^2]: This would of course require isolation between the original and the user-programmable part of the platform. And if the platform wants its user-programmed modules to be able to interact with the original data structure of the platform, it thus ought to use a mockup of that data, which new user-made modules can access temporarily while they wait to be approved for accessing the real data structure.



## Current state of project

The project is ready for use. We currently have a working prototype of a user-programmable platform online at [up-web.org](https://up-web.org), where users can already extend the platform freely.

This prototype offers a high-level web development framework based on JavaScript, and where front-end components are built in the same way as in React.

In the future, we also intend to make it possible for the users to program in other languages and frameworks as well, such that they can choose whichever ones they prefer.

And while the current prototype at this point only uses an interpreter for executing user-uploaded code, a compiler will also be added in the future, allowing the users to compile their source code modules and achieve near-native speeds.



## Key takeaways

* A user-programmable platform can be extended and modified arbitrarily by the users, and each fork can be hosted from the same place.

* Each individual user can freely choose which fork of each app they want to use, without having switch to another web domain or install a different app.

* Collaboration on apps can happen fast and in a decentralized manner, without sacrificing safety, due to the user-uploaded apps being sandboxed.

* The source code of the uploaded apps is visible to the public, and cannot be changed on a whim, which means that users do not have to trust each individual creator of the apps and features that they want to use.

* Hosting the apps is essentially free for the developers, regardless of whether they implement something simple, like a personal website or a blog, or a small game or a tool of some kind, or if they implement something large like a full social media app.

* The cost of the resources that an app consumes is instead carried by the users of the platform, via a simple freemium subscription model.

* An [extended business model](open-dev-co-ops.md), if utilized, will allow the developing users to get paid fairly for their contributions, and can also allow the platform to attract more investments on top of that.
