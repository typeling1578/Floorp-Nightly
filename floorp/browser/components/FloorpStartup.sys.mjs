/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
Scripts written here are executed only once at browser startup.
*/

import { AppConstants } from "resource://gre/modules/AppConstants.sys.mjs";
import { setTimeout, setInterval, clearTimeout, clearInterval } from "resource://gre/modules/Timer.sys.mjs";
const { Services } = ChromeUtils.import(
    "resource://gre/modules/Services.jsm"
);
const { AddonManager } = ChromeUtils.import(
    "resource://gre/modules/AddonManager.jsm"
);
const { OS } = ChromeUtils.import(
    "resource://gre/modules/osfile.jsm"
);

const EXECUTES = [
    {
        description: "Optimize the notification function.",
        runAt: "soon",
        onFirstRun: false,
        onUpdated: false,
        exec: function() {
            let isNativeNotificationEnabled = false;
            if (AppConstants.platform === "win") {
                let version = Services.sysinfo.getProperty("version");
                if (version === "10.0") {
                    isNativeNotificationEnabled = true;
                }
            } else if (AppConstants.platform === "linux") {
                isNativeNotificationEnabled = true;
            }
            let prefs = Services.prefs.getDefaultBranch(null);
            prefs.setBoolPref("alerts.useSystemBackend", isNativeNotificationEnabled);
        }
    },
    {
        description: "Set BMS icon provider",
        runAt: "soon",
        onFirstRun: false,
        onUpdated: false,
        exec: function() {
            let os_languages = Cc["@mozilla.org/intl/ospreferences;1"].getService(Ci.mozIOSPreferences).regionalPrefsLocales;
            let isChina = os_languages.includes("zh-CN");
            Services.prefs.getDefaultBranch(null)
                .setStringPref(
                    "floorp.browser.sidebar.useIconProvider",
                    isChina ?
                        "yandex" : // Setup for China
                        "duckduckgo"
                );
        }
    },
    {
        description: "Load Tab Sleep feature",
        runAt: "soon",
        onFirstRun: false,
        onUpdated: false,
        exec: function() {
            ChromeUtils.import("resource:///modules/TabSleep.jsm");
        }
    },
    {
        description: "Write CSS",
        runAt: "final-ui-startup",
        onFirstRun: false,
        onUpdated: false,
        exec: function() {
            IOUtils.exists(OS.Path.join(OS.Constants.Path.profileDir, "chrome")).then((data) => {
                if (!data) {
                    let userChromecssPath = OS.Path.join(OS.Constants.Path.profileDir, "chrome");
                    let uccpth = OS.Path.join(userChromecssPath, 'userChrome.css')
                    IOUtils.writeUTF8(uccpth, `
/*************************************************************************************************************************************************************************************************************************************************************

"userChrome.css" is a custom CSS file that can be used to specify CSS style rules for Floorp's interface (NOT internal site) using "chrome" privileges.
For instance, if you want to hide the tab bar, you can use the following CSS rule:

**************************************
#TabsToolbar {                       *
    display: none !important;        *
}                                    *
**************************************

NOTE: You can use the userChrome.css file without change preferences (about:config)

Quote: https://userChrome.org | https://github.com/topics/userchrome 

************************************************************************************************************************************************************************************************************************************************************/

@charset "UTF-8";
@-moz-document url(chrome://browser/content/browser.xhtml) {
/* Please write your custom CSS under this line*/


}
`);

                    let ucconpth = OS.Path.join(userChromecssPath, 'userContent.css')
                    IOUtils.writeUTF8(ucconpth, `
/*************************************************************************************************************************************************************************************************************************************************************
 
"userContent.css" is a custom CSS file that can be used to specify CSS style rules for Floorp's intenal site using "chrome" privileges.
For instance, if you want to apply CSS at "about:newtab" and "about:home", you can use the following CSS rule:

***********************************************************************
@-moz-document url-prefix("about:newtab"), url-prefix("about:home") { *
                                                                        *
/*Write your css*/                                                    *
                                                                        *
}                                                                     *
***********************************************************************

NOTE: You can use the userContent.css file without change preferences (about:config)

************************************************************************************************************************************************************************************************************************************************************/

@charset "UTF-8";
/* Please write your custom CSS under this line*/
`);
        
                }
            });
        }
    },
    {
        description: "Make newtabImages directory",
        runAt: "final-ui-startup",
        onFirstRun: false,
        onUpdated: false,
        exec: function() {
            IOUtils.exists(OS.Path.join(OS.Constants.Path.profileDir, "newtabImages")).then(
                (data) => {
                    if (!data) IOUtils.makeDirectory(OS.Path.join(OS.Constants.Path.profileDir, "newtabImages"))
                }
            )
        }
    },
    {
        description: "Setup for Undo Close Tab",
        runAt: "final-ui-startup",
        onFirstRun: true,
        onUpdated: false,
        exec: function() {
            setTimeout(() => {
                let { CustomizableUI } = ChromeUtils.import(
                    "resource:///modules/CustomizableUI.jsm"
                );
                CustomizableUI.addWidgetToArea("undo-closed-tab", CustomizableUI.AREA_NAVBAR, -1);
            }, 5000);
        }
    },
    {
        description: "Set content blocking category",
        runAt: "final-ui-startup",
        onFirstRun: true,
        onUpdated: false,
        exec: function() {
            setTimeout(() => {
                Services.prefs.setStringPref("browser.contentblocking.category", "strict")
            }, 5000);
        }
    },
    {
        description: "Install initial external addons",
        runAt: "final-ui-startup",
        onFirstRun: true,
        onUpdated: false,
        exec: async function() {
            try {
                let url = "https://addons.mozilla.org/firefox/downloads/latest/Gesturefy/latest.xpi"
                let install = await AddonManager.getInstallForURL(url);
                await install.install();
            } catch (e) { console.error(e) }
            try {
                let url = "https://addons.mozilla.org/firefox/downloads/latest/ublock-origin/latest.xpi"
                let install = await AddonManager.getInstallForURL(url);
                let installed = await install.install();
                await installed.disable(); // Default is disabled.
            } catch (e) { console.error(e) }
        }
    },
    {
        description: "Install TWP addon",
        runAt: "final-ui-startup",
        onFirstRun: false,
        onUpdated: false,
        exec: async function() {
            if (Services.prefs.getBoolPref("floorp.extensions.translate.migrateFromSystemAddonToUserAddon.ended", false)) return;
            let addon = await AddonManager.getAddonByID("{036a55b4-5e72-4d05-a06c-cba2dfcc134a}");
            if (addon === null || addon.version === "1.0.0") {
                let url = "https://addons.mozilla.org/firefox/downloads/latest/traduzir-paginas-web/latest.xpi";
                let install = await AddonManager.getInstallForURL(url);
                let installed = await install.install();
                await installed.reload(); // Do not show addon release note.
            }
            Services.prefs.setBoolPref("floorp.extensions.translate.migrateFromSystemAddonToUserAddon.ended", true);
        }
    },
]

{
    // Check information about startup.
    let isFirstRun = false;
    let isUpdated = false;
    {
        isFirstRun =
            !Boolean(Services.prefs.getStringPref("browser.startup.homepage_override.mstone", null));

        let nowVersion = AppConstants.MOZ_APP_VERSION_DISPLAY;
        let oldVersionPref = Services.prefs.getStringPref("floorp.startup.oldVersion", null);
        if (oldVersionPref !== nowVersion && !isFirstRun) {
            isUpdated = true;
        }
        Services.prefs.setStringPref("floorp.startup.oldVersion", nowVersion);
    }
    let onFinalUIStartup = new Promise(resolve => Services.obs.addObserver(resolve, "final-ui-startup"));

    let executeTargets = EXECUTES.filter(EXECUTE => {
        if (!EXECUTE.onFirstRun && !EXECUTE.onUpdated) return true;
        if (EXECUTE.onFirstRun && isFirstRun) return true;
        if (EXECUTE.onUpdated && isUpdated) return true; 
        return false;
    });

    let executeTargetsSoon = executeTargets.filter(EXECUTE => EXECUTE.runAt === "soon");
    for (let executeTargetSoon of executeTargetsSoon) {
        try {
            console.log(`Executing "${executeTargetSoon.description}"`);
            executeTargetSoon.exec();
        } catch (e) {
            console.error(e);
            console.warn(`Failed to execute "${executeTargetSoon.description}"`);
        }
    }

    (async() => {
        let executeTargetsFinalUIStartup = executeTargets.filter(EXECUTE => EXECUTE.runAt === "final-ui-startup");
        await onFinalUIStartup;
        for (let executeTargetFinalUIStartup of executeTargetsFinalUIStartup) {
            try {
                console.log(`Executing "${executeTargetFinalUIStartup.description}"`);
                await executeTargetFinalUIStartup.exec();
            } catch (e) {
                console.error(e);
                console.warn(`Failed to execute "${executeTargetFinalUIStartup.description}"`);
            }
        }
    })();
}
