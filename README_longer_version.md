# openSDB (prototype)
*Status: in development*

## Introduction to the project

openSDB is a Semantic Database (SDB) that is both open source and open for any
other parties to copy, at least for a majority of the (non-sensitive) data.

By 'semantic' we refer to the fact that entities in the database can be linked
via (user-provided) relations that can carry any meaning. Thus, if we take the
fundamental entities inhabiting the database, which openSDB calls 'Terms' and
which can represent everything from web resources to real-life objects, places
and persons, the users of the SDB can then upload links between all these Terms
in the form of relations, expressed as lexical items in a natural language
(such as English).

For instance we could have the lexical item: "is the director of", which a user
might want to use as a relation to express e.g. that Peter Jackson is the
director of The Lord of the Rings: The Fellowship of the Ring. That user can
then upload or find the Terms "is the director of", "Peter Jackson" and "The
Lord of the Rings: The Fellowship of the Ring" and subsequently use these to
construct the statement: "Peter Jackson is the director of Lord of the Rings:
The Fellowship of the Ring."

This concept of an SDB is thus very much related to the concept of the Semantic
Web, as envisioned by Tim Berners-Lee in 1999 (see e.g.
www.wikipedia.org/wiki/Semantic_Web).
The main difference, however, is that the Semantic Web (so far) has mainly been
intended to run across the whole World Wide Web, by having web developers add
subject–relation–object statements (referred to as 'triplets') as metadata to
their web pages. Semantic Web applications are then supposed to read this
metadata from across the web to get its data structures.

This is opposed to approach of this project, which aims to develop such
applications on top of databases instead (i.e. SDBs). These applications will
then be accessed through limited number of web domains, instead of having them
run on top of the entire web at once.

This approach has the drawback that it is not immediately as decentralized as
the conventional Semantic Web: If the latter would have ever taken off, it
would have immediately been as decentralized as the World Wide Web. But the
conventional Semantic Web never really did take off, and perhaps for good
reason, as we will discuss in a moment. Therefore we must start to think of
alternative approaches if we ever want to fully realize the dream of the
Semantic Web. And luckily, while the approach of storing semantic data in
databases rather than in web pages as metadata does sound to be a bit more
centralized, the fact that openSDB encourages other organizations/parties to
copy the source code and data and start their own databases means that we can
create a network of independent SDBs that can end up forming a big decentralized
distributed database. And on top of this decentralized and distributed SDB, a
new kind of Semantic Web might be formed.[^1]

[^1]: Although a more appropriate term in that case might be 'Semantic
Net(work).'

Now, the reason why the approach of SDBs might have a big advantage over the
conventional approach, is that, as I see it, the conventional approach is a bit
stuck in an old and outdated way of thinking about the web. In this old way of
thinking, the gab between what was considered "users" and what was considered
"developers" was not as wide as it is today: As a "user" of the web you could
surf the web and visit web pages, and if you wanted to add something to the web
yourself, you could "simply" make your own website and host it from a domain.
But this way of thinking about the users of the web is far from the reality
today, where there is indeed quite a wide gab between the developers and the
average users of the web. Thus the average user today is realistically not ever
going to write any HTML when they want to add something to the web (and they
are especially not going to write semantic metadata triplets, as this takes
even more advanced knowledge than for just writing simple HTML).

And yet the "average users," i.e. the non-developers, add *so much* to the web
in its present state. Nowadays when we use the web, we often go to the same
websites that we have visited many times before, not to see what new content
the developers have added to the site, but instead to see what other users of
the site have uploaded. This revolution of the web in terms of how we use it is
what is known as the Web 2.0.
It means that the "average" (non-developer) users now makes up a huge source
of input data flowing into the web. And there is no question in my mind that if
we want to truly reach the vision of the Semantic Web, we *have* to first
develop a system the can tap into this huge data source.
More precisely, we need a semantic system where it is both easy and intuitive
for users to upload and up-rate the semantic links, and preferably just as easy
as it is for users to upload and up-rate resources currently on the various
Web 2.0 sites that are popular today.

To implement such an intuitive and easy-to-use system is the goal of openSDB.


## Overview of the semantic system of openSDB

### Semantic inputs

The example from before with "Peter Jackson" + "is the director of" + "Lord of
the Rings: The Fellowship of the Ring" explains the general concept of a
semantic system, but openSDB does not actually store semantic links directly as
triplets like this. Instead the system stores semantic statements as
predicate–subject pairs, but allows Terms to be compound, meaning that a
predicate can be formed from a relation and an object. One could for example
form a predicate from "is the director of" and "Lord of the Rings: The
Fellowship of the Ring" put together. This choice makes queries faster by a
considerable amount, but it does come with the downside that relations are not
automatically two-way, and subject–relation–object statements thus need to be
stored two ways, namely as Predicate(relation, object) + subject and as
Predicate(reverse relation, subject) + object, to make them work both ways.
I believe this trade-off will be well worth it.

More importantly, each semantic statement is also stored together with the ID
of the user who states the statement, and with a rating value running from 0 to
10 (in small steps of 10 divided by 65535) which denotes the degree to which
the user deems the statement to be true, like when answering a survey. A rating
value of five thus means a neutral degree; meaning that the statement is deemed
neither to be particularly true/fitting for the subject nor false/unfitting. A
rating value towards 0 then of course means 'very false/unfitting' and a rating
value towards 10 means 'very true/fitting.'

These combinations of user + predicate + subject + rating is referred as
'semantic inputs' in the terminology of openSDB, and for any constant pair of
user and predicate, the set of relevant rating–subject pairs stored in the
database as part of semantic inputs are referred to as 'input sets' (or
sometimes just 'sets' for brevity).
Due to a uniqueness constraint, any subject can only appear once in such sets
(i.e. a user can only give one rating to any given statement), and the input
sets are stored as ordered in terms of the rating value.
openSDB also aims to store these input sets as compactly as possible, meaning
that retrieval of these sets can be done very efficiently. In fact, retrieval
of input sets is seen as the most central type of query of the database, and
therefore one that should be optimized as much as possible (hence the choice
mentioned in the first paragraph of this section).  

When using the database, however, users will mostly not want to query for one
particular user's ratings, but instead want to query for an average of ratings
from all users. openSDB intends to also implement such queries as queries for
input sets, only where the user ID is replaced for the ID of an averaging
algorithm.
Furthermore, for each such algorithm, openSDB intends to actually store the
averaged (or otherwise aggregated) ratings in the same way as other semantic
inputs such that these averages can be retrieved as efficiently as the
single-user input sets. Thus, the averaging/aggregation algorithms will be
implemented as what we might refer to as 'bots,' namely since they take the
place of users in the user ID column of the semantic inputs table. The input
sets of these "bots" will then be maintained via continuous scheduled events
that update the ratings according to recent user inputs.

### Terms

'Terms' refers to the semantic units of the system, including the relations and
predicates, and even including the users themselves since each new user of
the SDB will get their own Term representing them. All Terms have a unique ID,
first of all, and are defined by two fields: an ID of a so-called
'Context,'' which are themselves a kind of Terms, and then a 'defining string.'
The Context defines, typically via a template, how the defining string is to be
interpreted semantically. An example of such a template could be: "Movie:
\<Title\>, \<Year\>", and an example of a Term that defines an instance of this
template could be one that had "The Lord of the Rings: The Fellowship of the
Ring|2001" as its defining string. Note that '|' is thus used as a delimiter for
dividing a defining string up into several parts.

To give another example, let us say this "Movie: \<Title\>, \<Year\>" + "The
Lord of the Rings: The Fellowship of the Ring|2001" Term is given the ID of 28
in the SDB. Take then the following template: "is an important/useful instance
of the \<Noun phrase\> of \<Term\>", which can be used to construct
predicates from just a noun phrase and any given object term. If we then want
to construct the statement that Peter Jackson is the director of this Movie, we
can first of all create the desired predicate by defining a Term of this
template Context and with "Director|\#28" as its defining string. Here "\#28"
will then be interpreted as the Term with ID = 28, giving us the exactly the
predicate we wanted (only formulated a bit differently: "is an important/useful
instance of the Director of *Movie: The Lord of the Rings: The Fellowship of*
*the Ring, 2001*").
And with another Term defining Peter Jackson (the right one), we can then
create the desired statement.

An additional syntactic feature of these template Contexts that is then also
worth mentioning is that parts of the template can be emphasized by wrapping
them in curly brackets. For instance we could wrap \<Title\> in the movie
template from before, giving us "Movie: {\<Title\>}, \<Year\>". This then tells
any application that runs on top of the SDB that the "\<Title\>" part is the
important part to print out when referencing the Term, whereas the rest of the
template instance can be considered as "clarifying details." So instead of
"Movie: The Lord of the Rings: The Fellowship of the Ring, 2001", if we take
the same example, the application can instead just print out "The Lord of the
Rings: The Fellowship of the Ring" for brevity.


## The "killer application" of openSDB

### A system of continuous ratings for arbitrary predicates

The first application of a semantic system such as openSDB that comes to mind,
at least if one is already familiar with the vision of the Semantic Web, is
that of semantic searches. And though this application might potentially become
very useful in a future when the network around SDBs has grown large enough, it
will take a while before it can start to compete with modern-day search engines.
But there is another application that I believe can become extremely useful
quite fast, and which does not have the same competition against it from
existing technologies. Since this application also very much utilizes some of
the traits that sets openSDB apart from conventional semantic systems, I
therefore see it as the (so-called) killer application of openSDB.

The application is to implement a web app, possibly with the assistance of a
browser extension, that can become a hub for ratings for all kinds of resources
on the web, as well as any other things that one can imagine.
And the key reasons why such a rating hub running on top of a semantic system
might supersede more conventional rating hubs is first of all the fact that the
semantic system allows for arbitrary kinds of ratings, i.e. ratings with respect
to arbitrary predicates.
This is opposed to having just the usual good-versus-bad axis to rate
entities along that we see everywhere.
And combined with the fact that, in the case of openSDB,
all predicates can be rated on a continuous scale, this is what I believe will
make the application far more useful than existing ones.

There are many instances where such semantic ratings can be useful. Users
browsing for products to buy might want to not just see a satisfaction rating,
but also see more specific ratings such as for durability, how easy they are to
operate, if the price is low compared to similar products, and also potentially
factors concerning manufacturing such as if it is environment-friendly, if there
is slave labor involved, if workers are paid a fair portion of the money made,
and so on. And users browsing a movie to watch, as another example, might want
to see predicates such as how scary the movie is, how funny it is, how wholesome
or cute it is, how much it deals with a certain theme, how good the acting is,
how well the plot or the dialog is written, how similar to is to certain other
iconic movies, and so on.

It is worth noting here that folksonomies (i.e. systems of user-provided tags)
already goes some way to make users able to see some of these qualities. But
with these systems, users can only get an idea e.g. if the movie is scary or
not, or if it deals with a certain theme or belongs to a certain genre or not.
They can not see the *degree* to which these predicates are true/fitting.

Furthermore, the conventional folksonomy systems take a lot of user actions
when users want to contribute to them. But if, on the other hand, the users were
able to just click on any existing "tag," which would be associated with a
predicate in our case, and immediately add their own rating to that predicate
with just one or two more clicks, I believe the system could attract so much
more (valuable) user data hereby, compared to the conventional systems.

Having continuous ratings rather than binary tags, which is either there or not
there, also means that the data is of much higher quality when it comes to
using that data to provide good search results (and feeds for that matter).
Therefore, if a user for instance wants to search through all movies and order
them such that, say, the movies that are both the most funny and at the same
time the most wholesome appears on the top of the list of search results, the
data of an application using continuous ratings will be much more useful than,
say, folksonomy data in terms ordering search result this way, namely since the
degree of *how much* the tags/predicates apply (according to the users) can be
determined with much higher precision.

This application can thus potentially open up a whole new world of search and
feed algorithms, since it will not need to rely on advanced machine learning
algorithms in order to analyze the user data and make meaningful connections;
the data flowing into an SDB will already have a high degree of "meaning" to
begin with.


### How such an application might be implemented

In order to implement such an application, we could first of all have a
web app through which the users can access the SDB. This is what I am currently
working on in the front-end part of this GitHub repository. When users want to
look up ratings for a certain resource or product, or whatever thing that they
are interested in, they can go to the web app at a certain website (e.g.
www.opensdb.com) and search for that thing (either through a conventional search
bar or through a "semantic walk"). And upon finding the match, they can then
access the various ratings.

What would be an even better way to access the ratings, however, would be if a
browser extension was developed as well, designed to read the URLs that the
user visits with their browser, or potentially even those that they hover over
with the mouse, and then search for matches against those URLs (or other kinds
of URIs for that matter) to immediately get the relevant user ratings of the SDB
to show the user. If this can be realized, it means that openSDB, together with
any other SDB that might join the network and work together with the likes of
openSD, can implement what can essentially become a hub for all ratings on the
web, and one that is always right at hand when users browse the web.

And in this regard, it is also very much worth mentioning that openSDB will be
completely anonymous (unless a user actively disclose their identity to other
users) and completely without tracking. The protocol used will be purely HTTPS
and the database will not record anything about its users other than: username,
password, potentially a backup key, and also potentially the rough amount of
data downloaded and/or uploaded by the user in the last week or month.
The database might also store the e-mails of a user but will not link this to
the user's account (unless asked to). It will instead at most just record the
number of user accounts that each e-mail address has created, but not which
ones.
openSDB will also not allow any ads in its web app or its browser extension
such that no third party will be able to track the user either.
Thus, if openSDB, and SDBs like it, in the future will achieve to make up this
"hub for all ratings on the web," it will be with as high a degree of anonymity
as possible. And the data will not belong to the SDBs involved, but will be in
the public domain, free for all to use (as opposed to belonging to just one or
a few companies as well as those they sell that data on to).


### Funding of the project

The funding for openSDB (and any SDB that wants to join the network and follow
the same principles) should come purely from sponsors and donors. These will
then get separate pages on the website(s) where users can see them listed. If
the system will indeed become as widely used as I think it can, there will
certainly be enough interested sponsors that want to be associated with the
project in order to fund the maintenance of the web services (and perhaps also
some of the development if we are lucky). And individual users might also want
to contribute some.

Another potential reason that this project might be able to attract funding
could also be due the fact that, if it really takes off, it could become a giant
source of very high-quality user data, and one which all companies will be able
to use completely free of charge. This might especially be attractive to a lot
of smaller companies that wish to have access to user data (e.g. data of how
users rate their various products and services, and more importantly of what
users want for future products and services) in order to better compete with
other companies, but which do not want to pay high prices for that data. For
such companies it might thus be considered worth it to help fund a project that
can potentially yield them free access to a continuous source of user data of
very high quality in the near future. And the fact that this user data is
guaranteed to be anonymous and non-infringent on the users' privacy will most
likely only help in attracting that kind of support for the project.
