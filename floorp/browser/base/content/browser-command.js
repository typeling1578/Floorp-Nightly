/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function OpenChromeDirectory() {
  let currProfDir = Services.dirsvc.get("ProfD", Ci.nsIFile);
  let profileDir = currProfDir.path;
  let nsLocalFile = Components.Constructor("@mozilla.org/file/local;1", "nsIFile", "initWithPath");
  new nsLocalFile(profileDir,).reveal();
}

function restartbrowser() {
  Services.obs.notifyObservers(null, "startupcache-invalidate");

  let env = Cc["@mozilla.org/process/environment;1"].getService(
    Ci.nsIEnvironment
  );
  env.set("MOZ_DISABLE_SAFE_MODE_KEY", "1");

  Services.startup.quit(
    Ci.nsIAppStartup.eAttemptQuit | Ci.nsIAppStartup.eRestart
  );
}

/*---------------------------------------------------------------- Clock ----------------------------------------------------------------*/

function setNowTime() {
  let now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();
  let seconds = now.getSeconds();
  if (hours < 10) hours = "0" + hours;
  if (minutes < 10) minutes = "0" + minutes;
  let dateAndTime = `${checkBrowserLangForLabel()} ${hours}:${minutes}`;
  let withSeconds = `${checkBrowserLangForToolTipText()} ${hours}:${minutes}:${seconds}`;
  let clock = document.getElementById("toolbarItemClock");
  if (clock) {
      clock.setAttribute("label", dateAndTime);
      clock.setAttribute("tooltiptext", withSeconds);
  }
}

function checkBrowserLangForLabel() {
  let now = new Date();
  let locale = Cc["@mozilla.org/intl/ospreferences;1"].getService(Ci.mozIOSPreferences).regionalPrefsLocales;
  if(locale[0] == "ja-JP"){
    const options = {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    }
    return now.toLocaleDateString('ja-JP', options);
  } else {
    return now.toLocaleDateString();
  }
}

function checkBrowserLangForToolTipText() {
  let now = new Date();
  let locale = Cc["@mozilla.org/intl/ospreferences;1"].getService(Ci.mozIOSPreferences).regionalPrefsLocales;
  if(locale[0] == "ja-JP"){
    let year = now.getFullYear();
    let JPYear = year - 2018;
    const options = {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    }
    return `${year}年`+`(令和${JPYear}年) `+ now.toLocaleDateString('ja-JP', options);
  } else {
    return now.toLocaleDateString();
  }
}