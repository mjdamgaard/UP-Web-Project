
import {
    ContentLoader,
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL, dbReqManager, accountManager,
} from "/src/content_loaders/SDBInterface.js";


export var loginPageCL = new ContentLoader(
    "LoginPage",
    /* Initial HTML template */
    '<div>' +
        '<<GoBackButton>>' +
        '<div class="left-margin"></div>' +
        '<div class="content-container">' +
            '<h3>Log in</h3>' +
            '<form action="javascript:void(0);">' +
                '<div class="form-group">' +
                    '<label>Username or ID</label>' +
                    '<input type="text" class="form-control user"></input>' +
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
        '<div class="right-margin"></div>' +
    '</div>',
    sdbInterfaceCL
);
loginPageCL.addCallback(function($ci, data) {
    $ci.on("submit", function() {
        let $this = $(this);
        let user = $this.find('.user').val();
        let pw = $this.find('.pw').val();
        // TODO: Validate input client-side first.
        accountManager.login(user, pw, $ci, function($ci, result) {
            if (result.exitCode != 0) {
                $ci.find('.response-display').html(result.exitCode); // TODO..
            } else {
                $ci.trigger("logged-in");
                $ci.trigger("back-to-main");
            }
        });
        return false;
    });
});


export var createAccountPageCL = new ContentLoader(
    "CreateAccountPage",
    /* Initial HTML template */
    '<div>' +
        '<<GoBackButton>>' +
        '<div class="left-margin"></div>' +
        '<div class="content-container">' +
            '<h3>Create new account</h3>' +
            '<form action="javascript:void(0);">' +
                '<div class="form-group">' +
                    '<label>Username</label>' +
                    '<input type="text" class="form-control username"></input>' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>E-mail address</label>' +
                    '<input type="email" class="form-control email"></input>' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>Password</label>' +
                    '<input type="password" class="form-control pw"></input>' +
                '</div>' +
                '<span>' +
                    '<button class="btn btn-default login">Submit</button>' +
                '</span>' +
            '</form>' +
            '<div class="response-display"></div>' +
        '</div>' +
        '<div class="right-margin"></div>' +
    '</div>',
    sdbInterfaceCL
);
createAccountPageCL.addCallback(function($ci, data) {
    $ci.on("submit", function() {
        let $this = $(this);
        let username = $this.find('.username').val();
        let email = $this.find('.email').val();
        let pw = $this.find('.pw').val();
        // TODO: Validate input client-side first.
        accountManager.createNewAccount(username, email, pw, $ci,
            function($ci, result) {debugger;
                if (result.exitCode != 0) {
                    $ci.find('.response-display').html(result.exitCode);//TODO..
                } else {
                    $ci.trigger("logged-in");
                    $ci.trigger("back-to-main");
                }
            }
        );
        return false;
    });
});
