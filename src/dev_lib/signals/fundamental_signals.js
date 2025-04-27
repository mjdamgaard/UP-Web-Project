

// Exit signal emitted when calling exit().
export const exitSignal = Symbol("exit");


// Exit signal emitted when calling exit().
export const moduleObjectSignal = Symbol("module_object");


// Creating a JSX (React-like) app and mounting it in the index HTML page, in
// the element with an id of "up-root".
export const createAppSignal = Symbol("create_app");

// Signal emitted by the dispatch() function/method.
export const dispatchSignal = Symbol("dispatch");



// Signal emitted by functions that can only be accessed by the admin.
export const adminOnlySignal = Symbol("admin_only");
