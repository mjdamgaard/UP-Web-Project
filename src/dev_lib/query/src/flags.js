


export const ELEVATED_PRIVILEGES_FLAG = Symbol("elevated-privileges");


export const REQUEST_ADMIN_PRIVILEGES_FLAG = Symbol("request-admin-privileges");
export const GRANT_ADMIN_PRIVILEGES_FLAG = Symbol("grant-admin-privileges");
export const ADMIN_PRIVILEGES_FLAG = Symbol("admin-privileges");


export const CAN_POST_FLAG = Symbol("can-post-privileges");


export const USER_ID_FLAG = Symbol("user-ID");

export const REQUESTING_SMF_ROUTE_FLAG = Symbol("requesting-SMF-route");
export const CURRENT_SMF_ROUTE_FLAG = Symbol("current-SMF-route");
export const REQUESTING_COMPONENT_FLAG = Symbol("requesting-component");
export const CLIENT_TRUST_FLAG = Symbol("client-trust");

// I might as well repeat the following TODO here: The "client-trust" flag
// should be expanded such that a component is not just given "trust," but is
// given a specific permission list for what it needs to do, and where these
// permissions ought to also target specific home directories or SMFs if they
// are related to querying the server/database.



export const NO_TRACE_FLAG = Symbol("no-trace");


