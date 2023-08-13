
import {
    ContentLoader,
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL, dbReqManager, accountManager,
} from "/src/content_loaders/SDBInterface.js";





export var overlayPageCL = new ContentLoader(
    "OverlayPage",
    /* Initial HTML template */
    '<div>' +
        '<div class="left-margin"><<GoBackButton>></div>' +
        '<div class="content-container"></div>' +
        '<div class="right-margin"></div>' +
    '</div>',
    sdbInterfaceCL
);

export var goBackButtonCL = new ContentLoader(
    "GoBackButton",
    /* Initial HTML template */
    '<span>' +
        '&#10094;' +
    '</span>',
    sdbInterfaceCL
);
goBackButtonCL.addCallback(function($ci, data) {
    $ci.on("click", function() {
        $(this).trigger("back-to-main");
        return false;
    });
});



export var loginPageCL = new ContentLoader(
    "LoginPage",
    /* Initial HTML template */
    '<<OverlayPage>>',
    sdbInterfaceCL
);
loginPageCL.addCallback("append", ".content-container",
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
            '<button class="btn btn-default">Log in</button>' +
        '</span>' +
    '</form>' +
    '<div class="response-display text-warning"></div>'
);
loginPageCL.addCallback(function($ci, data) {
    $ci.on("submit", function() {
        let $this = $(this);
        if (!hasAcceptedStorage()) {
            return;
        }
        $this.find('.response-display').empty();
        let user = $this.find('.user').val();
        let pw = $this.find('.pw').val();
        // TODO: Validate input client-side first!
        accountManager.login(user, pw, $this, function($ci, result) {
            if (result.exitCode != 0) {
                $ci.find('.response-display').text(result.error);
            } else {
                $ci.trigger("logged-in");
                $ci.trigger("back-to-main");
            }
        });
        return false;
    });
});
loginPageCL.addCallback(function($ci, data) {
    if (!hasAcceptedStorage()) {
        return;
    }
});
export function hasAcceptedStorage() {
    if (localStorage.hasAcceptedStorage) {
        return true;
    } else {
        if (
            confirm(
                'This site only uses necessary local storage. Press OK to ' +
                'accept this and be able to log in or create an account.'
            )
        ) {
            localStorage.hasAcceptedStorage = true;
            return true;
        } else {
            return false;
        }
    }
}

export var createAccountPageCL = new ContentLoader(
    "CreateAccountPage",
    /* Initial HTML template */
    '<<OverlayPage>>',
    sdbInterfaceCL
);
createAccountPageCL.addCallback("append", ".content-container",
    '<h3>Create new account</h3>' +
    '<form action="javascript:void(0);">' +
        '<div class="form-group">' +
            '<label>Username</label>' +
            '<input type="text" class="form-control username"></input>' +
        '</div>' +
        '<p class="text-info"><i>(Anonymous usernames are prefered.)</i></p>' +
        '<div class="form-group">' +
            '<label>E-mail address</label>' +
            '<input type="email" class="form-control email"></input>' +
        '</div>' +
        '<p class="text-info"><i>' +
            '(For testing purposes, you can make a temporary account by ' +
            'choosing a fake e-mail address.) The e-mail address will be ' +
            'stored but it connection to this account will be erased ' +
            'upon confirmation. So save your password!' +
        '</i></p>' +
        '<div class="form-group">' +
            '<label>Password</label>' +
            '<input type="password" class="form-control pw"></input>' +
        '</div>' +
        '<p class="text-info"><i>Choose a unique password!</i></p>' +
        '<div class="checkbox" style="font-size: 11pt;">' +
            '<label><input type="checkbox" class="terms" value="">' +
                'I accept that the entities and ratings that I submit with ' +
                'this account will be available to the public, and that it ' +
                'will be shared upon request with any third party that ' +
                'wishes to copy the SDB. This includes a user entity with ' +
                'the username chosen here. (But it of course does not ' +
                'include any data like the e-mail address or password etc.).' +
            '</label>' +
        '</div>' +
        '<span>' +
            '<button class="btn btn-default">Submit</button>' +
        '</span>' +
    '</form>' +
    '<div class="response-display text-warning"></div>'
);
createAccountPageCL.addCallback(function($ci, data) {
    $ci.on("submit", function() {
        let $this = $(this);
        if (!$this.find('input.terms').is(':checked')) {
            $this.find('.response-display').text(
                'You need to accept the terms before creating an account.'
            );
            return;
        }
        if (!hasAcceptedStorage()) {
            return;
        }
        let username = $this.find('.username').val();
        let email = $this.find('.email').val();
        let pw = $this.find('.pw').val();
        // TODO: Validate input client-side first!
        accountManager.createNewAccount(username, email, pw, $this,
            function($ci, result) {
                if (result.exitCode != 0) {
                    $ci.find('.response-display').text(result.error);
                } else {
                    $ci.trigger("logged-in");
                    $ci.trigger("back-to-main");
                }
            }
        );
        return false;
    });
});
createAccountPageCL.addCallback(function($ci, data) {
    if (!hasAcceptedStorage()) {
        return;
    }
});


export var tutorialPageCL = new ContentLoader(
    "TutorialPage",
    /* Initial HTML template */
    '<<OverlayPage>>',
    sdbInterfaceCL
);
tutorialPageCL.addCallback("append", ".content-container",
    '<iframe src="tutorial.html" style="border:none;"></iframe>'
);
