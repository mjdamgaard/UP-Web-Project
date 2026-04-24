

## Introduction

A user-programmable platform is a platform where the users are free to create, modify, and extend the apps on the platform, and where each end user is able to choose exactly which version of each app they want to use, without having to change to a different web domain or download a different app.

* *Are you tired of platforms that uses algorithms that always tries to funnel you into a dopamine loop?*
* *Are you tired of rude comments and posts not being sufficiently suppressed, and of misinformation and inappropriate content not being sufficiently moderated?*
* *Are you tired of AI slop and clickbait?*
* *Are you tired of your data being sold to third parties, or of the lack of transparency about this?*
* *Are you tired of ads that just keep increasing in volume?*
* *Or are you tired updates in general that you do not like and cannot decline?*

With a user-programmable platform you do not need to worry about any of these problems. Here the users are in complete control over what apps and what algorithms they use, and they are free to modify them and extend them however they want.

Furthermore, a user-programmable platform is designed to make it very easy and quick for the developing users to share their prototypes of new apps and features with each other, with minimal central oversight needed, creating a free and decentralized creative space in which users can collaborate on improving the apps on the platform.



## Key features of a user-programmable platform

#### 1. All forks of the platform can be hosted simultaneously from the same place

The users are free to create new apps on the platform as well as fork existing ones. And whenever a new version of an app is created, other users are free to try out this new version, without having switch to another web domain, or install a different app.


#### 2. A sandbox technology makes it safe to try out new apps

All user-uploaded apps and code modules are run in a sandbox which ensures that new prototypes for apps and features can be shared quickly among the users, without needing to first be verified for security.

Being able quickly and safely share prototypes for new apps and features with a lot of users, who can give feedback and rate the project, and potentially even help complete it, means that the development of the platform can move very fast. 


<!-- Even when a new version of an app requires access to the same back-end data structure as its predecessor, it can simply use a mockup version of this back end while waiting to be verified by the user community and/or by the administrator(s) of the predecessor app.

This allows other users to immediately try out the new prototype and to give feedback to the creator, and maybe even help to complete it.

And as soon as it has been verified as being safe, users can now start using this new version of the app if they want, on equal footing with the other versions. -->


#### 3. Transparency means that trust is not required

When an app or a back-end module is uploaded to the platform, the source code is generally completely visible to the public. And the creator of the app cannot change the source code on a whim while the app is in use.

This means that as long as you trust the user-programmable platform itself to show you the correct source code, you do not need to trust any given creator on the platform in order to know that it is safe to use their apps.

This removes a core issue that otherwise affects decentralized platforms in general, namely the issue that in order to use the desired features of the platform, the individual user often has to trust several different independent parties that they do not know much about.


#### 4. No need for allocating resources means free hosting! (almost)

Another feature of a user-programmable platform is that apps do not have to allocate storage space or computational resources in advance. Instead the resources are only allocated when needed by the users that use the app.[^1]

[^1]: And if an app needs server-side maintenance routines to run at regularly scheduled intervals, these intervals can just be based on how many post requests has occurred since the last execution, rather than how much time has passed.

This means that it is essentially free for developers to upload new apps and features, as it only costs the system the storage space required for the given source code.

The funding of the resources is thus not a concern for the developers of the apps and features, but is instead a matter purely between the platform and the end users who consume those resources.
The platform thus keeps track of the resources that each user consumes, but does not care about where and how these resources are consumed.

Note that since the platform is able to include any kind of app, including any kind of website that you can imagine, personal or otherwise, this means that you will be able to have any kind of website that you want hosted essentially for free and in perpetuity by a user-programmable platform: You only pay the small cost of storing the source code for your website (which might even be covered by a free plan), and the visitors will carry cost of any additional resources that it needs to consume.


#### 5. An open and decentralized network

A user-programmable platform also ought to allow for decentralization, namely by allowing apps on one platform to communicate and transfer data with other platforms, in particular other user-programmable platforms, as well as any other platform that utilizes open protocols.  



## Proposed core business model: A freemium subscription model

Each user of the platform has an amount of resources that they can use for free each month, both in terms of storage space and computational resources. And if they need to use more than what the free plan allows, they need to subscribe to a paid plan.

The free resources that each user gets is paid for at least in part by sponsors, grants, and/or donations. And if this does not cover it, they can also be paid for in part by charging a the paying users more in the paid plans.



## An extended business model where the developing users also get paid

While a user-programmable platform could absolutely be based purely on open-source contributions, and on the willingness of its users to improve the platform for themselves and others, there is also other possible models which allow the developing users to actually get paid for their contributions, while still motivating them to collaborate publicly, and share their contributions quickly and openly with each other.

Such a model might be especially interesting if a user-programmable platform wants to succeed in the space of business applications, and not just web and mobile applications, since business customers will generally happily pay more in order to get quick and reliable updates and maintenance of the software.

And a model like this could also help attract initial investments from venture capital, instead of having to rely purely on sponsorships, grants, and donations.

You can read about a proposition for such a business model here *(TODO: Insert a link to another MD file, maybe in a different repo)*.



## Existing platforms can also adopt the same technology

Although the previous section references a non-open-source business model, the overall project is still completely open-source.
And it is not in competition with any existing open-source platforms, at least not directly.

The concepts of a user-programmable platform, as listed above, is not to our knowledge at odds at all with the concepts behind e.g. the Fediverse, or with BlueSky and the AT Protocol. (TODO: Edit)

Thus, the Fediverse could absolutely launch a user-programmable type of instance. And the ATmosphere could absolutely launch a user-programmable AppView.

Furthermore, any user-programmable platform would only benefit from creating network bridges, allowing users to federate data across networks.



## Current state of project

The project is ready for use. We currently have a working version of a user-programmable platform online at up-web.org, where users can already extend the platform freely.

This prototype offers a high-level web development framework based on JavaScript, and where front-end components are built in the same way as in React.

And in the future, we intend to make it possible to program in other languages and frameworks as well, such that the users can choose the languages that they prefer.

And while the current prototype at this point only uses an interpreter for executing user-uploaded code, a compiler will also be added in the future, allowing the users to compile their source code modules and achieve near-native speeds.



## Summary: Key takeaways

* The platform can be extended and modified arbitrarily by the users, and each fork can be hosted from the same place.

* Each individual users can freely choose which fork of each app they want to use.

* Hosting the apps is essentially free for the developers, regardless of whether they implement personal websites, blogs, tools, or even full social media apps, etc.

* The cost of the resources that an app consumes is instead carried by the users who are using the app, and with a simple business model where they pay with money, and that is it.

* Collaboration on apps can happen fast and in a decentralized manner, without sacrificing safety, due to all the user-uploaded apps being sandboxed.

* The source code of the uploaded apps is visible to the public, and cannot be changed on a whim, which means that users do not have to trust each individual creator of the apps and features that they want to use.

* An *extended business model* (TODO: Insert link), if utilized, will allow the developing users to actually get paid for their contributions, and even help to attract more investments on top of that.


## TODOs
*TODO: Insert links in the above text.*
