
import {
    DBRequestManager,
} from "/src/DBRequestManager.js";
import {
    AccountManager,
} from "/src/AccountManager.js";
import {
    ContentLoader,
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL, dbReqManager,
} from "/src/content_loaders/SDBInterface.js";


export var loginPageCL = new ContentLoader(
    "LoginPage",
    /* Initial HTML template */
    '<div>' +
        '<div class="left-margin col-sm-3"></div>' +
        '<div class="content-container col-sm-6">' +
            '<h3>Log in</h3>' +
            '<form action="javascript:void(0);">' +
                '<div class="form-group">' +
                    '<label>Username or ID</label>' +
                    '<input type="text" class="form-control username"></input>' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>Password</label>' +
                    '<input type="password" class="form-control pw"></input>' +
                '</div>' +
                '<span>' +
                    '<button class="btn btn-default login">Log in</button>' +
                '</span>' +
            '</form>' +
            '<div class="response-display"></div>' +
        '</div>' +
        '<div class="right-margin col-sm-3"></div>' +
    '</div>',
    sdbInterfaceCL
);
