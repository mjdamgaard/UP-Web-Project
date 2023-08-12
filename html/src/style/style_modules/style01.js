
import {
    sdbInterfaceCL, appColumnContainerCL, appColumnCL,
    interfaceHeaderCL, closeButtonCL, superCoolLogoCL,
} from "/src/content_loaders/SDBInterface.js";
import {
    tabHeaderCL, pagesContainerCL,
} from "/src/content_loaders/PagesWithTabs.js";
import {
    entityTitleCL, entityLinkCL
} from "/src/content_loaders/EntityTitles.js";
import {

} from "/src/content_loaders/EntityPages.js";
import {
    generalEntityElementCL,
} from "/src/content_loaders/EntityElements.js";
import {
    setDisplayCL, dropdownButtonBarCL, dropdownButtonCL, setHeaderCL,
    sortingCategoriesMenuCL,
} from "/src/content_loaders/SetDisplays.js";
import {
    ratingElementCL, ratingDisplayCL,
} from "/src/content_loaders/Ratings.js";
import {
    overlayPageCL, goBackButtonCL,
} from "/src/content_loaders/OverlayPages.js";



sdbInterfaceCL.addCSS(
    'height: 100%;' +
    'display: grid;' +
    'grid-template-columns: auto;' +
    'grid-template-rows: auto 1fr;' +
    ''
);
interfaceHeaderCL.addCSS(
    'background-color: #40E0E9;' +
    'margin-bottom: 10px;'
);
superCoolLogoCL.addCSS(
    'color: black;' +
    'font-size: 25pt;'
);
superCoolLogoCL.addCSS(
    '&:hover {' +
        'cursor: pointer;' +
    '}'
);
sdbInterfaceCL.addCSS(
    '& main > :not(.CI.AppColumnContainer) {' +
        'text-align: center;' +
        'display: grid;' +
        'grid-template-columns: auto;' +
        'grid-template-rows: 1fr auto 1fr;' +
        'opacity: 0.5;' +
    '}'
);
sdbInterfaceCL.addCSS(
    '& main > :not(.CI.AppColumnContainer):hover {' +
        'cursor: pointer;' +
        'opacity: 1;' +
    '}'
);

sdbInterfaceCL.addCSS(
    '& > main {' +
        'display: grid;' +
        'grid-template-columns: 70px auto 70px;' +
        'grid-template-rows: auto;' +
    '}'
);
appColumnContainerCL.addCSS(
    'display: grid;' +
    'grid-template-columns: auto auto;' +
    'grid-template-rows: auto;' +
    // 'overflow-x: auto;' +
    // 'overflow-y: hidden;' +
    'white-space: nowrap;' +
    // 'background-color: #f9fef5;' +
    ''
);
appColumnCL.addCSS(
    // 'flex-grow: 1;' +
    'overflow: initial;' +
    'white-space: initial;' +
    'display: inline-block;' +
    'margin: 0px 10px;' +
    // 'width: 600px;' +
    'border: 1px solid #DDD;' +
    'border-radius: 8px;' +
    'background-color: #FFF;' +
    ''
);
closeButtonCL.addCSS(
    'padding: 0px 4px;' +
    // 'position: relative;' +
    // 'z-index: 2;' +
    ''
);
tabHeaderCL.addCSS(
    'padding: 4px 0px 0px;' +
    // 'background-color: #f7f7f7;' +
    ''
);
tabHeaderCL.addCSS(
    '& .CI.CloseButton {' +
        "position: absolute;" +
        "z-index: 2;" +
        "right: 1px;" +
        "top: 1px;" +
    '}'
);
tabHeaderCL.addCSS(
    '& ul > li .nav-link {' +
        'pointer-events: none;' +
        'border-bottom: 1px solid #ddd;' +
        'background-color: #fefefe;' +
        // 'box-shadow: 10px 10px 5px lightblue;' +
    '}'
);
tabHeaderCL.addCSS(
    '& ul {' +
        'display: flex;' +
        // 'justify-content: flex-end;' +
        'flex-wrap: wrap-reverse;' +
        'flex-direction: row;' +
        'margin: 0px 0px 0px 2px;' +
    '}'
);
tabHeaderCL.addCSS(
    '& ul > li {' +
        'margin: 2px 1px -1px 0px;' +
    '}'
);
tabHeaderCL.addCSS(
    '& ul > li.active .nav-link {' +
        'border-bottom: 1px solid #fff;' +
        'background-color: #fff;' +
    '}'
);


sdbInterfaceCL.addCSS(
    '& .clickable-text:hover {' +
        'cursor: pointer;' +
        'text-decoration: underline;' +
        'color: blue;' +
    '}'
);



generalEntityElementCL.addCSS(
    'border-bottom: 1px solid gray;' +
    'border-top: 1px solid gray;' +
    ''
);
ratingElementCL.addCSS(
    'border-bottom: 1px solid gray;' +
    'border-top: 1px solid gray;' +
    ''
);
ratingDisplayCL.addCSS(
    'border-bottom: 1px solid lightgray;' +
    'border-top: 1px solid lightgray;' +
    ''
);

ratingDisplayCL.addCSS(
    '& .applies-to-subj {' +
        'font-size: 80%;' +
    '}'
);



dropdownButtonBarCL.addCSS(
    '&:hover {' +
        'cursor: pointer;' +
        'background-color: #eee;' +
    '}'
);
dropdownButtonBarCL.addCSS(
    'display: flex;' +
    'justify-content: center;'
);
// dropdownButtonCL.addCSS(
//     'font-size: 80%;' +
//     'position: relative;' +
//     'bottom: 10%;' // CSS is still weird to me sometimes (why does this not
//      // work?)..
// );
dropdownButtonBarCL.addCSS(
    '& .CI.DropdownButton {' +
        'font-size: 80%;' +
        // 'bottom: 0%;' +
    '}'
);
dropdownButtonCL.addCSS(
    '&:hover {' +
        'cursor: pointer;' +
    '}'
);
setHeaderCL.addCSS(
    '& > .CI.DropdownButtonBar:not(:hover) {' +
        'background-color: #f4f9ff;' +
    '}'
);
setDisplayCL.addCSS(
    '& > .CI.DropdownButtonBar:not(:hover) {' +
        'background-color: #ddd;' +
    '}'
);

sortingCategoriesMenuCL.addCSS(
    'border-top:    1px solid #ddd;' +
    'border-bottom: 1px solid #ddd;'
);



overlayPageCL.addCSS(
    'display: grid;' +
    'grid-template-columns: auto auto auto;' +
    'grid-template-rows: 20px auto;'
);
overlayPageCL.addCSS(
    '& > .content-container {' +
        'max-width: 600px;' +
    '}'
);


goBackButtonCL.addCSS(
    'font-size: 20px;' +
    'padding: 10px;' +
    'margin: 2px 7px;' +
    ''
);
goBackButtonCL.addCSS(
    '&:hover {' +
        'cursor: pointer;' +
        // 'background-color: #eee;' +
    '}'
);
