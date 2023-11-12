# openSDB

#### Status
A prototype is live now at www.opensdb.com, but it *is* a very basic and crude one. One will probably only find it interesting if one is already quite interested in my semantic backend.

I am currently in the process of transforming the source code into REACT, which is going on, not in the master fork, but in a different one.


## Introduction to the project

openSDB is an open source Semantic Database (SDB), interfaced via
www.opensdb.com.

By 'semantic' we refer to the fact that entities in the database can be linked
via relations that can be created freely by the users and can carry any meaning.
This is thus similar to the fundamental concept of the
[Semantic Web](https://www.wikipedia.org/wiki/Semantic_Web).

And in fact, this project seeks to revitalize the idea of the Semantic Web, but
with a different approach than the conventional one. Rather than trying to
extend the World Wide Web itself, this project instead aims to launch an open
source [Web 2.0](https://www.wikipedia.org/wiki/Web_2.0) site that utilizes
semantic data structures, not just as part of its data processing, but where
the users are actively engaged in building these structures.

The point of this is to make it way easier for the average user of the web to
take part in building the semantic data structures when compared to the
conventional Semantic Web, which requires users to write special
[RDF triples](https://www.wikipedia.org/wiki/Semantic_triple) in order to be
able to contribute.
These are fairly complicated HTML entities that web developers then have to
add as metadata to their web pages. So not only does the conventional approach
require its users to have specialized knowledge of RDF triples, it also
requires them to have access to editing web pages!

It is thus not particularly hard to see why the Semantic Web never really took
off with this approach: It never managed to become very accessible for its
users, not in terms of them being able to participate actively in it.

The project of openSDB seeks to do this better by making a website where it is
very easy to create semantic entities and to submit statements about their
properties and relations to each other.



## Not just facts; opinions as well!

One of the prospects of the Semantic Web is to be able to easily search for
specific facts on the internet, such as "who was the successor of Julius
Caesar?" or "what is the air-speed velocity of an unladen swallow?"

If openSDB succeeds in making a sizable Web 2.0 site where the users can easily
participate in building semantic structures, it will first of all mean that
more such facts can be recorded. There are in principle an infinite amount of
facts about our world, and we cannot record them all, but the more users a
semantic system has, and who are able to participate actively, the more facts
can be submitted and validated by this userbase.

However, conventional search engines, such as Google's, are already quite useful
for finding out facts, and it will take a while before a semantic network
could start to compete with those. And although AI is still quite unreliable
at this point in time, it is not unreasonable to think such technology will
make it even easier to search (reliably) for facts in the near future.

But the vision of openSDB actually extends the vision of the Semantic Web to
include, not only searching for facts, but also to be able to search for the
*opinions* of other users, in particular the averaged opinions of the userbase.

The semantic system of openSDB first of all entails that users can create any
kind of predicate that they want (which is true for any 'semantic' system).
Moreover, every semantic statement that a user submits includes a rating, on a
scale from 0 to 10, which tells to which degree the user deems the statement to
be true.
So for all questions where there is no definitive answer, but where the answer
is subjective, like for example how scary or how funny a given movie is, each
user can give their own opinion on said scale. The averages of all these user
ratings can then be computed (continuously) and shown at the page of the entity
in question (which would be the page of the given movie in this example).

And what is more, the site can then also afford the users with the possibility
to search among entities and sorting the search result according to any
predicates that they desire. As an example, a user might want to search for
movies and apart from an overall score of how "well-liked" they are, the user
might also want to use the predicates "funny" and "wholesome," if the user
wishes to find a good movie that is both of these things.
The averaged ratings of these three predicates can then be combined such that
the search results are ordered with the movies most fitting of this combination
first in the list.  



## Some examples where rateable predicates can be useful

The fact that creating and using these predicates are completely in the hands
of the users, and that they can thus use any predicates they want, opens up
countless possibilities. But let us try to think of a few examples of what it
could be used for. We already have the one about movies that are scary, funny,
and/or wholesome. To add to this example, one could also imagine using
more detailed predicates like: how much the movie deals with a certain theme,
how good the acting in it is, how well the plot or the dialog is written, how
similar it is to is to certain other iconic movies, and so on.

As another example, we could imagine that users from time to time might want to
browse for products to buy, and then not just want see an overall satisfaction
rating, but also more specific ratings such the durability[^1] of the product,
how easy it is to operate, if the price is low compared to similar products,
and also potentially predicates concerning manufacturing such as if this is
environment-friendly, if there is child labor involved or not, if workers are
paid a fair portion of the money made, and so on.

[^1]: It is worth to note that this is actually one example of a predicate that
can be considered as factual (and not a matter of opinion), but where it is
nonetheless still useful that users can submit their rating on a scale, instead
of only being able to submit if they think the product is durable or not.


We could also think of users wishing to find information and reading material
on a certain subject. This could for instance be a user wanting to learn more
about AI and the current advancements of that technology. There is a lot of
material to be found on the web on this subject, but simply rating this material
according to reader satisfaction is not enough to meet all needs. Some users
might specifically want texts that are very brief and easy to understand, others
might want more extensive texts that are nonetheless still easy to understand,
others still might want texts that are as brief as possible, yet goes into
some of the advanced details of the subject, and others still might want texts
that are both extensive and advanced. Having the predicates "brief," "easy to
understand" and "advanced" can thus greatly help tailor the search for the
specific user. Additionally, predicates like "humorous," "well-aided by
graphics," "includes good exercises," "includes challenging exercises,"
"well-sourced," and so on, might be helpful in tailoring the searches further
to the user's needs.

And to end this section with a few more examples where being able to tailor
searches after specific predicates might be very helpful, we could also imagine
searching for: news articles, books, videos, games, music, programs/apps,
websites, recipes, health/lifestyle recommendations, activity recommendations,
and so on.
There are a myriad of possibilities.



## High-quality semantic user data *is* the future!

If we think about [folksomies](https://en.wikipedia.org/wiki/Folksonomy),
i.e. the systems that are pretty widespread today
where users can add [tags](https://en.wikipedia.org/wiki/Tag_(metadata))
to the entities of a site, we can note that such systems also allow users to
categorize entities according to arbitrary predicates.
But the big problem with these systems is that they are binary: A user can only
state if a given tag fits an entity, or they can leave that tag out when they
add their tags.

This, as the reader might have experienced as well, means that conventional
folksonomy systems are quite unreliable: Entities often get tags that does not
fit them at all, and far from all entities for which a given tag might be
relevant will have that tag.

Furthermore, the conventional folksonomy systems are not at all able to give
the users a good idea of the *degree* to which the tags fit en entity. For
instance, while the tags of a movie entity might correctly show the a given
movie is scary, it does not allow users to get an idea of *how* scary the movie
is.

This also means that these systems cannot really be used to order entities
after a given predicate, e.g. in searches or in feeds, the way that the system
of openSDB will.
Sure, the conventional system can be used to add more scary movies to your
search results, if that is what you are after, but it cannot really be used to
change the order of those movies among themselves according to how scary they
are.


What is more, if all tags instead come with a rating scale, which is what
openSDB will offer, it might not just mean a higher quality of user data, but
perhaps the system will also be able to attract *more* of this data!

This is first of all because being able to add your own opinion immediately to
a tags when you see it on the site, with just one or two clicks, might turn out
to be much easier to use than the conventional systems, where users have to go
to a separate page and manually search for new tags to add.

But more importantly, the fact that users can express there opinions much more
precisely when using rating scales might enhance the experience submitting those
opinions, due to the fact that they might feel to a greater extent that their
opinions matters for rest of the community. And they would indeed be right about
this feeling: When each submitted opinion is given on a scale, it is much more
useful in terms of its effect on the search and feed algorithms.

Thus, when the user data is of much higher quality, its usefulness to the
community is higher as well, giving better search and feed algorithms on the
site. And the resulting feeling that one's data matters more might also make it
much more attractive to submit said data. This might thus increase the influx
of user data as well, which furthers enhances the potential of the algorithms
on the site.

And better algorithms inevitably means that more users will be attracted to the
site, migrating away from sites that does not upgrade to systems utilizing this
kind of semantic user data.

Semantic user data thus *is* the future, and it is only a matter time before it
will become the standard on the web.



## Open source, no ads, no tracking, and no gathering of involuntary data!

If openSDB manages to attract a sizable network of users and show the way for
semantic user data on the web, other sites could of course try to copy the
principles of its system. This is especially possible due to the fact that it
is completely open-source.

However, being open-source hopefully also turns out to be the advantage that
will ultimately make users prefer it over any potential not-so-open competitors.

If you submit your data to closed-source website, you run the risk that when
the site has grown big enough, it owners will try to milk its users for more
money (e.g. by running more ads or collecting and selling more metadata about
them), even if this comes at the cost of less user satisfaction.

But an open source site like openSDB will not have this luxury, especially not
if the site has maintained a policy that all submitted user data is supplied
to any third party that asks for it. This way third parties will be able to
continuously back up the data of the site, and if the site ever starts acting
selfishly towards its userbase, others will just be able to make a copy of the
site, complete with user data and all, and start hosting it at another domain.

Not only will openSDB indeed commit itself to such a policy, it will even
commit itself to working together with other parties that copies it (and its
policies) with the goal of creating a distributed and decentralized
(semantic) database.

This means that openSDB will always be forced to work best in the interests of
its users, or else it will simply be replaced.

And to further cement the point of being "for the users," openSDB will also
promise not to show any ads (unless perhaps as something that users can opt
into). It will also not try to collect any data about the users other than the
data that is necessary for the site to work and the semantic data that they
actively and voluntarily submits.

Instead openSDB will seek to fund its services through donations alone.



## A potential hub for all ratings on the web!

With its semantic system and its open-source nature, openSDB hopes to create
what can become a hub of all ratings on the web. And in order to better achieve
this goal, openSDB seeks to create a browser extension such that users can
access the ratings in the SDB at any time when they browse the web.

The idea is to have a browser extension that can query for rating data about
any website/web page that a user visits, and also potentially for links that
the user hovers over with the mouse. The browser extension can then note the
user about when there is rating data available for the site, and when the user
opens the tab of the extension, they can view the entity in the SDB that best
matches (also determined by user ratings) the given URL, and see the relevant
ratings for that entity.

For instance, if a user browses a video on YouTube, the extension can link to
the corresponding entity in the SDB, and the user can then see, and contribute
to, all the ratings regarding that video in the browser extension tab.
This first of all means that the user will be able see much more nuanced ratings
(and the dislikes; not just the likes). And when the user contributes to the
various ratings, the submitted data goes to a more general community than
YouTube, meaning that it can be used not just to enhance other users' searches
and feeds when browsing for videos *on YouTube*, but can be used to enhance
searches and feeds where users are interested in all videos on the web.

A similar example could be made for any site where users can browse a collection
of entities of a certain type (e.g. products, media, etc.). And while the users
could also just browse these things at the web application of openSDB
(www.opensdb.com), having a browser extension that can
be used across the web will likely make it much easier for users to use the
SDB, and will thus likely help attract much more user activity.


And since the connection to the SDB will be encrypted (HTTPS), and, more
importantly, since openSDB will never log anything about these queries save for
maybe an the overall data usage of a user in that week or month, the queries
that the browser extension makes will not be tracked by openSDB and also cannot
be tracked by any other parties.


## Related entities, comments and discussions

The browser extension will also be able to query for related entities to the
the given entity that matches an URL. (And the same things can be browsed on the
SDB's own website.)
This includes related entities of the same type as the given one (e.g. similar
movies if the entity is of that type) as well as related categories (e.g.
"Horror movies" or "Fantasy movies"), and of course facts (e.g. who the director
is or what actors is in it). It also includes comments to that entity.

Again we can predict, similarly to the ratings, that users might be more willing
to use the comment sections implemented via the browser extension rather than
the comment sections at the visited website, namely since their comments can
thereby reach a broader, more general community.  

Furthermore, the semantic system of openSDB allows us to afford the users with
the ability to group comments into subcategories. So for example, if you have
just watched a movie/video or read an article or post and you are interested in
a particular discussion about that, you can first of all go to a section of
related discussions for the entity. If you find the discussion that you are
interested in there, you can then go to that discussion and see what other users
have written about it. Or if the given discussion cannot be found, you can
submit it yourself, posing it as a question.

Not only does this mean that users looking for a particular kind of comments for
and entity will be able to better find what they are looking for, rather than
having to scan the whole combined comment section, but it also means any users
who just want to see what kind of comments an entity has, with no particular
query in mind, can get a quick overview of the relevant discussions to the
given entity. Since users can rate the discussions themselves in terms of how
interesting and relevant they are for the given entity, it means that the
related discussions can be ordered according to these predicates, showing the
most interesting and relevant discussions first.

And what is more, the semantic system of openSDB means that discussions
themselves can be ordered into substructures. This means that any discussion
that is complicated enough to include several points and/or several
sub-arguments can be structured into a whole tree of branching points and
counterpoints!

So for any kind of discussion we can think of, the users will be able to
collaborate on mapping out all the relevant arguments and counterarguments for
that discussion. And since the semantic system of openSDB also allows users to
give their opinions as ratings, it means that the users will even be able to
rate each statement making up the discussion of how likely they think the
statement is to be true. This includes any "facts" that the various
sub-conclusions are based on, as well as any conditional statement that says
that "if statements *P<sub>1</sub>*, *P<sub>2</sub>*, *P<sub>3</sub>*, *...*
are true, then statement *Q* follows."

Thus, the user community will not only potentially be able to map out various
discussions, they might also even be able to reach conclusions for those
discussions!



## Open-source algorithms

At the beginning, the algorithms of openSDB for ordering searches or feeds
will be based on taking rating averages from the predicates that a users selects
and produce a combined score from them. This might take us quite far in terms
of the users ability to search and find the things they want.

One of the potential next steps from there is for the community to start
utilizing ratings that users give to other users, in particular in terms of
their trustworthiness. This can further refine the algorithms by filtering out
spammers and trolls, and, on the other hand, elevating the inputs of users
who has a history making of valuable contributions to the community.  

As the open-source project evolves, we can potentially get even more advanced
algorithms as well, and the fact that the project is open-source sets no limit
on the sophistication of the algorithms when compared to closed-source
companies. The only argument for why an open-source project might be more
limited would be that it might not be able to make as much money to fund
the development and the computational resources for its algorithms. But if the
project takes off, it will become a giant source of high-quality user data
that any company can use free of charge, instead of having to pay closed-source
tech companies a high price for that kind of data. This will mean that there
will be plenty of stakeholders in the project, and more than enough to aid its
development and fund its combined data analysis sub-projects.

Moreover, the fact that the project is open-source also means that it can
potentially attract a great number of participants who wants to help its
development. More people means more ideas, and thus more creativity. And it is
hard to overstate the enormous potential that this gives the project. It might
give the project the potential to completely revolutionize how we use the web.



## Funding for the project and for its participants

The funding for openSDB's services, as well as any other SDB hosts that wants to
join the network, should come purely from sponsors and donors. These will
then get separate pages on the website(s) where users can see them listed. If
the project really takes off, it will certainly be good PR for the sponsors
that helped the project early on.

And as mentioned in the previous section, the project might be able to attract
a lot of funding from companies due to the fact that it can become a giant
source of high-quality data for them, which they can subsequently tab into free
of charge.

It is also worth noting that the fact that this user data is completely
voluntary and does not infringe on the privacy of the users will most likely
only help in attracting support for the project, including that of sponsors.


And in terms of the contributions to the project coming from the user community,
e.g. from content creators and from open-source programmers and front-end
designers, openSDB actually also seeks to implement a user-to-user donor
system.
Here the user-to-user ratings mentioned in the previous section might be useful,
since they can potentially allow the site to create a collection of user ranks,
where the rank is meant to represent the value of the user's combined
contributions (as deemed by other users).
Any donating user should them be able to choose a set of user ranks that best
fits their opinions of how much different kinds of contributions are worth.
And when the donation is finalized, it should result in a kind of credits for
the receiving users, proportional to how they are ranked in the chosen set,
which they should then be able to redeem for the money that has been donated to
them.

This user-to-user donating system will hopefully create a good alternative to
the current state of the web where content creators get their revenue from ads,
and it will hopefully help attract more contributors to the project, including
content creators as well as open-source programmers and front-end designers.



## Conclusion

openSDB hopes to be a pioneer in an open-source project to create what is a
slightly altered and in some ways extended version of the Semantic Web.

The first goal of this project is to create a hub of ratings on the web, where
the ratings can be anything that the users want.

We have argued that semantic user data like what openSDB gathers will be more
useful in terms of creating search and feed algorithms, namely because such data
will be of a much higher quality (and users might even be inclined to submit
more of this type of data, potentially).
And since such algorithms are very important for the user experience of web
applications, we state that such semantic data *is* the future: It is only a
matter of time before we will used everywhere on the web.

And by being completely open-source and encouraging hosts to join the network
as peers, it is likely that users will be attracted to this project rather than
any similar closed-source project, since it means security that the providers
of the service will not be able to turn their back to the community when they
eye an opportunity to make more money at the cost of its users.

So there is plenty of reasons to be excited and wanting to support and take part
in this project. First of all simply for the thrill of it, but also because
having been an early contributor will be valuable in terms of PR (for sponsors)
or in terms of recognition (for individual contributors).
And in the case of individual contributors, if the project really takes off and
people start donating via the mentioned user-to-user donating system, it might
also pay to have been part of the early contributors that made the project take
off.
