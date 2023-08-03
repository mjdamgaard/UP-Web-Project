# openSDB
*Status: in development.*


## Introduction to the project

openSDB is an open source Semantic Database (SDB), interfaced via
www.opensdb.com
(*not live yet, but a prototype/beta version will be so very soon!*).

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
users, not in terms of being able to participate actively in it.

openSDB seeks to do this better by creating a website where it is very easy to
create semantic entities and to submit statements about their properties and
relations to each other.

<!--
openSDB first and foremost seeks to do exactly that: make the Semantic Web[^1]
much more accessible to all users of the web.
Its approach is to instead start out as a Web 2.0 site, running on top of a
Semantic Database (SDB), and try to make an interface for this database
(in the form of a web application) that is very easy and intuitive to use.

[^1]: Although a more appropriate term in our case might be 'Semantic
Net(work),' since our approach do not directly extend the World Wide Web
itself.
-->


<!--
A valid concern is then that ...
 -->


<!--
The danger of this approach, if not dealt with appropriately, is that, as one
might point out, it risks exchanging more accessibility for more centralization
as well, since a Web 2.0 site might have ownership over its source code, and it
might also be unwilling to share its data structures (the non-sensitive parts).
This centralization would very much be in contradiction with the original
visions of the Semantic Web.

However, openSDB seeks to prevent such centralization first of all being
completely open source, second, by allowing any other parties to copy all its
non-sensitive data, and third, by committing itself to working towards a
distributed and decentralized database. This means that other parties will be
able to back up the application and the database, and to host their own version
of the system at any point. openSDB encourages this and wants to work together
with such other parties towards forming a distributed database.[^2]

[^2]: This will likely include implementing processes to remap entity IDs such
that database nodes (in the distributed database) can keep their respective
data structures in sync with other nodes.

Thus if openSDB at any point does something that is against the interests of
its users, the unsatisfied part of the userbase can then immediately just
start up its own copy of the site from a backup.
-->



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
in question (which would be the page of the given movie in our example).

And what is more, the site can then also afford the users with the possibility
to search among entities and sorting the search result according to any
predicates that they desire. As an example, a user might want to search for
movies and apart from an overall score of how "well-liked" they are also use the
predicates "funny" and "wholesome," if the user wishes to find a good movie that
is both of these things. The averaged ratings of these three predicates can then
be combined such that the search results are ordered with the movies most
fitting of this combination first in the list.  


## Examples where this could be useful

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
might be considered factual (and not a matter of opinion), but where it is
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
searches after specific predicates might be very helpful, we could imagine
searching for news articles, books of fiction, videos, games, music,
programs/apps, websites, and so on.
There are a myriad of possibilities.


<!--
## Disp:
- Folksonomies..
- The problem of what you leave out..
- YT as an example. Mention the positive feedback loops..
-
-->


<!-- ## Comparing with conventional folksonomy systems -->
## High-quality semantic user data *is* the future!

If we think about [folksomies](https://en.wikipedia.org/wiki/Folksonomy),
i.e. the systems that are pretty widespread today
where users can add [tags](https://en.wikipedia.org/wiki/Tag_(metadata)
to the entities of a site, we can note that such systems also allow users to
categorize entities according to arbitrary predicates.
<!--
But these systems need
an important upgrade, one that openSDB will offer: Each tag has to come with
a rating scale where users can quickly and easily give their own opinion of how
well the tags fits the entity.
-->
But the big problem with these systems is that they are binary: A user can only
state if a given tag fits an entity, or they can leave that tag out when they
add their tags.

This, as the reader might have experienced as well, means that conventional
folksonomy systems are quite unreliable: Entities often get tags that does not
fit them at all, and far from all entities for which a given tag might be
relevant for will have that tag.

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
this system might also be able to attract *more* of this data!

This is first of all because being able to add your own opinion immediately to
whatever tags you see on a site might turn out to be much easier to use than
the conventional systems, where users how to go to separate site and manually
search for new tags to add. (*Clarify*)

But more importantly, the fact that users can express there opinions much more
precisely when using rating scales might better the experience submitting those
opinions. And this is not least because they might also feel that the opinions
that they submit matters more in terms of how it betters the search results and
feeds of others when each opinion is given on a scale, and they would be right
about that!

Thus, when the user data is of much higher quality, its usefulness to the
community is higher as well, giving better search and feed algorithms on the
site. And the feeling of one's data mattering more might make it so much more
attractive to submit said data. This might thus increase the influx of user
data as well, which furthers enhances the potential of the algorithms on the
site.

And better algorithms inevitably means that more users will be attracted to the
site, migrating away from sites that does not upgrade to systems utilizing this
kind of semantic user data.

Semantic user data *is* the future, and it is only a matter time before it will
be the standard on the web.


## Semantic user groups

In the semantic system of openSDB, even the users themselves will get an entity
each in the database that represents them, which means that users will also be
able to make statements about each other. This opens up further possibilities
in long run since it means that users will also able to classify each other.

...





<!--
## High-quality semantic user data *is* the future!
-->









<!--
## Disp:


- [...]
- A section with a few examples. End with mentioning feeds/searches. (check)
- A section about how semantic data is much better than conventional data.
    - compare with folksonomies also.
- A section about user groups and what they will mean.
- ..No tracking and open source.. *Voluntary data.
    *Give data securely with anonymous account..
    *(Maybe mention why this means that other sites can't copy.)
- A section explaining the browser extension and a hub for all ratings.
- ..About overviews of relevant entities/categories and graph discussions etc...
    - ...And perhaps template documents (decentralized collaboration) and code
    verification...
- A section about this Semantic Net not just being an index for things, but
- can develop into any web app really. Already the info page has a structure
- that depends on the users. This can be taken further ... ..And user groups
- enhances this... ...And open source means security..



-->







<!--
Extending the vision of the Semantic Web to include opinions instead of just
facts obviously does not make much sense if the userbase is limited to people
with special access to editing web pages, and with special knowledge of how to
write RDF triples. For then you would only get the opinions of those people,
and that would not be of much use.

So in order to achieve this extended vision, we have to first do what openSDB
seeks to do and make a semantic system that is accessible to all and easy to
use.
 -->













<!--  -->
