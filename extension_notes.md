
# Notes about extending the system

The current prototype of a user-programmable platform that this GitHub repo implements is based on a custom JS interpreter used to sandbox the user-uploaded code, and it currently only offers a specific development framework.

These notes explain how we can extend this system such that users can actually program in any language and any framework that they want.



## The current implementation

The current implementation of a user-programmable platform uses a JS interpreter to make things safe, sandboxing the user-uploaded code. This interpreter is currently used both in the front end and in the back end.

The job of the sandbox that the interpreter implements is the following.

* It has to make sure that the program cannot call unsafe native functions directly, at least not without special permission.
<!--  -->
* It has to keep track of the resource usage, in particular in the back end where the used "gas" is deducted from the user's account (at least for POST requests).
<!--  -->
* In the front end, it has to make sure that no unsafe HTML is inserted in the DOM tree.

* And it also has to be able to isolate front-end components from each other such that they cannot interfere with the HTML or the style of outside components, or nested components that has been isolated within them.
<!--  -->
* In the back end, the sandbox has to make sure that a back-end module can only interact directly with its own part of the database/storage space.
<!--  -->
* It also has to take care of user authentication in a separate layer such that the back-end modules does not have to implement this themselves (but only has to take care of the 'authorization' part).
<!--  -->
* And it has to keep track of where the each request originated, which can either be a given (isolated) front-end component or a given back-end module. This allows the back-end modules to check that a request originated from a valid source, similar to how the [Origin header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Origin) is used for HTTP requests across different domains.
<!--  -->
* Lastly, the sandbox has to keep track of the permissions of any function that is called, and make sure to throw an error if that function does something that it is not permitted to. These permissions depends on the context in which the function was called. (For instance, one front-end component might be trusted to link to any external website that it wants to, while another might not.)

The way that the current interpreter keeps track of permissions and requests origins is to keep a separate environment of permission flags etc., which is inherited only between function calls (not from the declaration environments of the functions).

This implementation works, but the fact that everything is currently based around a JS interpreter means first of all that all user-made programs need to be based on JS/TS, even on the back end. And it also slows the applications down compared to the native JS interpreter.

Furthermore, the current implementation only implements *one* framework for building front-end components (a framework similar to React).

But luckily, there is way to extend the current implementation such that users can first of all get to program in essentially any front-end framework that they want.

And there is even a way to extend the back end as well such that users can also use essentially any language and any framework here as well.



## Extending the front end

Rather than using an interpreter to execute the user-programmed functions and scripts safely, we can also instead implement a kind of transpiler that takes raw HTML/CSS/JS as its input and produces a safe version of HTML/CSS/JS, where:

* All calls to native JS functions have inserted guard clauses which prevents the function doing anything unsafe. These guards might also depend on the permissions of the calling function.

* Any original HTML is parsed for safety, and any JS function that inserts into the DOM tree is also guarded such that is does not insert unsafe HTML, and does not affect any element that is not within the current component's isolated scope.

* An object containing permissions, request origin data, user authentication data, etc., is handed down in all function calls, by shifting the input parameter list in each function call by one, making room for the object as the first parameter, while doing the same thing for the parameter lists of any function declaration. This object is also handed to any native function that needs it, such as the fetch(), which needs to use the request origin data.

* "Gas" reductions is inserted at the top of each branch of the script, i.e. at the top of each function body, each loop body, and each conditional branch, such that the program keeps track of the resource usage.

We can then make sure to transpile any HTML or JS file returned from the server (with MIME types of 'text/html' or 'text/javascript') this way as a last step before it is sent to the client.

With implementation, users will then be able to use any language or framework they want to create their HTML/CSS/JS modules, which are then transpiled to a safe version of itself before being inserted into the webpage.

Note that these modules are also free to import from JS modules of other users, which will have also been transpiled before being sent to the client.

And components can also be allowed to import and load other components, even ones made with a different framework, by using 'iframe' elements. (Such 'iframe' elements might also be recognized by the transpiler and reinterpreted as something else, if this can increase efficiency without sacrificing safety.)



## Extending the back end

...