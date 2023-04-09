/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
function setVerticalTabs() {
  if (Services.prefs.getIntPref("floorp.tabbar.style") == 2) {
    window.setTimeout(function () {
      let verticalTabs = document.querySelector(".toolbar-items")
      verticalTabs.id = "toolbar-items-verticaltabs";

      let sidebarBox = document.getElementById("sidebar-box");
      sidebarBox.style.setProperty("overflow", "scroll", "important")

      //init vertical tabs
      sidebarBox.insertBefore(verticalTabs, sidebarBox.firstChild);
      let tabBrowserArrowScrollBox = document.getElementById("tabbrowser-arrowscrollbox");
      verticalTabs.setAttribute("align", "start");
      tabBrowserArrowScrollBox.setAttribute("orient", "vertical");
      tabBrowserArrowScrollBox.removeAttribute("overflowing");
      tabBrowserArrowScrollBox.removeAttribute("scrolledtostart")
      tabBrowserArrowScrollBox.disabled = true;
      document.getElementById("tabbrowser-tabs").setAttribute("orient", "vertical");
      tabBrowserArrowScrollBox.shadowRoot.querySelector(`[part="scrollbox"]`).setAttribute("orient", "vertical");

      //move menubar
      document.getElementById("titlebar").before(document.getElementById("toolbar-menubar"));
      if (sidebarBox.getAttribute("hidden") == "true") {
        SidebarUI.toggle();
      }
    }, 500);

    //toolbar modification
    var Tag = document.createElement("style");
    Tag.id = "verticalTabsStyle"
    Tag.textContent = `@import url("chrome://browser/content/browser-verticaltabs.css");`;
    document.head.appendChild(Tag);
  } else {
    document.querySelector("#verticalTabsStyle")?.remove()
    let verticalTabs = document.querySelector("#toolbar-items-verticaltabs")
    if(verticalTabs != null){
      document.querySelector("#TabsToolbar").insertBefore(verticalTabs,
        document.querySelectorAll(`#TabsToolbar > .titlebar-spacer`)[1])
      let tabBrowserArrowScrollBox = document.getElementById("tabbrowser-arrowscrollbox");
      let tabsBase = document.querySelector("#tabbrowser-tabs")
      verticalTabs.setAttribute("align", "end");
      verticalTabs.removeAttribute("id")
      tabBrowserArrowScrollBox.setAttribute("orient", "horizontal");
      tabsBase.setAttribute("orient", "horizontal");
      let tabsToolBar = document.querySelector("#tabbrowser-tabs")
      tabsToolBar.style.removeProperty("--tab-overflow-pinned-tabs-width")
      tabsToolBar.removeAttribute("positionpinnedtabs")
      
      window.setTimeout(() => {
        if(tabBrowserArrowScrollBox.getAttribute("overflowing") != "true") tabsBase.removeAttribute("overflow")
      },1000)
      tabBrowserArrowScrollBox.setAttribute("scrolledtostart","true")
      tabBrowserArrowScrollBox.removeAttribute("disabled");
      let sidebarBox = document.getElementById("sidebar-box");
      sidebarBox.style.removeProperty("overflow")
    }
  }

}
setVerticalTabs()
Services.prefs.addObserver("floorp.tabbar.style", setVerticalTabs);
