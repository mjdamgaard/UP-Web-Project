

## Introduction

A user-programmable platform is a platform where the users are free to create, modify, and extend the apps on the platform, and where each end user is able to choose exactly which version of each app they want to use, without having to change to a different web domain or download a different app.

Are you tired of platforms that uses algorithms that always tries to funnel you into a dopamine loop?
Are you tired of rude comments and posts not being sufficiently suppressed, and of misinformation and inappropriate content not being sufficiently moderated?
Are you tired of AI slop and clickbait?
Are you tired of your data being sold to third parties, or of the lack of transparency about this?
Are you tired of ads that just keep increasing in volume?

With a user-programmable platform you do not need to worry about any of these problems. Here the users are in complete control over what apps and what algorithms they use, and they are free to modify them and extend them however they want.

Furthermore, a user-programmable platform is designed to make it very easy and quick for the developing users to share their prototypes of new apps and features with each other, with minimal central oversight needed, creating a free and decentralized creative space in which users can collaborate on improving the apps on the platform.



## Key features of a user-programmable platform

#### 1. All forks of the platform can be hosted simultaneously from the same place

The users are free to create new apps on the platform as well as fork existing ones. And whenever a new version of an app is created, other users are free to try out this new version, without having switch to another web domain, or install a different app.


#### 2. A sandbox technology makes it safe to try out new apps

All user-uploaded apps and code modules are run in a sandbox which ensures that new prototypes for apps and features can be shared quickly among the users, without needing to first be verified for security.

Being able quickly and safely share prototypes for new apps and features with a lot of users, who can give feedback and rate the project, and potentially even help complete it, means that the development of the platform can move fast. 


<!-- All user-uploaded apps and code modules are run in a sandbox which ensures that it is always safe to try out new apps, or new versions of existing apps, without having to worry about safety.

Even when a new version of an app requires access to the same back-end data structure as its predecessor, it can simply use a mockup version of this back end while waiting to be verified by the user community and/or by the administrator(s) of the predecessor app.

This allows other users to immediately try out the new prototype and to give feedback to the creator, and maybe even help to complete it.

And as soon as it has been verified as being safe, users can now start using this new version of the app if they want, on equal footing with the other versions. -->


#### 3. Transparency means that trust is not required

When an app or a back-end module is uploaded to the platform, the source code is generally completely visible to the public. And the creator of the app cannot change the source code on a whim while the app is in use.

This means that as long as you trust the user-programmable platform itself to show you the correct source code, you do not need to trust any given creator on the platform in order to know that it is safe to use their apps.

This removes a core issue that otherwise affects decentralized platforms in general, namely the issue that in order to use the desired features of the platform, the individual user often has to trust several different independent parties that they do not know much about.


#### 4. No allocation required means free hosting (almost)

Another feature of a user-programmable platform is that apps do not have to allocate storage space or computational resources in advance. Instead the resources are only allocated on demand by the users of the apps.[^1]

[^1]: And if an app needs server-side maintenance routines to run at regularly scheduled intervals, these intervals can just be based on how many post requests has occurred since the last execution, rather than how much time has passed.

This means that it is essentially free for developers to upload new apps and features, as it only costs the system the storage space required for the given source code.

The funding of the resources is thus not a concern for the developers of the apps and features, but is instead a matter purely between the platform and the end users who consume those resources.
The platform thus keeps track of the resources that each user consumes, but does not care about where and how these resources are consumed.



## Proposed core business model

Each user of the platform has an amount of resources that they can use for free each month, both in terms of storage space and computational resources. And if they need to use more than what the free plan allows, they need to subscribe to a paid plan.

The free resources that each user gets is paid for at least in part by sponsors, grants, and/or initial investments. And if this does not cover it, they can also be paid for in part by charging a the paying users more in the paid plans.



## An extended business model where the developing users also get paid

While a user-programmable platform could absolutely be based purely on open-source contributions, and on the willingness of its users to improve the platform for themselves and others, there is also other possible models which allow the developing users to actually get paid for their contributions, while still motivating them to collaborate publicly, and share their contributions quickly and openly with each other.

Such a model might be especially interesting if a user-programmable platform wants to succeed in the space of business applications, and not just web and mobile applications, since business customers will generally happily pay more in order to get quick and reliable updates and maintenance of the software.

And a model like this could also help attract initial investments from venture capital, instead of having to rely purely on grants, etc.

You can read about a proposition for such a business model here *(TODO: Insert a link to another MD file, maybe in a different repo)*.



## Existing platforms can also adopt the same technology

Although the previous section references a non-open-source business model, the overall project is still completely open-source.
And it is not in competition with any existing open-source platforms, at least not directly.

The concepts of a user-programmable platform, as listed above, is not to our knowledge at odds at all with the concepts behind e.g. the Fediverse, or with BlueSky and the AT Protocol. (TODO: Edit)

Thus, the Fediverse could absolutely launch a user-programmable type of instance. And the ATmosphere could absolutely launch a user-programmable AppView.

Furthermore, any user-programmable platform would only benefit from creating network bridges, allowing users to federate data across networks.



## Current state of technology

We currently have a working prototype of a user-programmable platform, where users can already extend the platform freely.

We currently only offer JavaScript as the language with which to build apps and server modules, but in the future, other languages will be available as well.

The current prototype only uses an interpreter so far for executing the user-uploaded code, rather than compiling it. But a compiler will be built as well in the future, increasing the speed and reducing the resource consumption somewhat, both on the server side and on the client side.



## Summary

...