

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

//use _gBrowser instead of gBrowser when startup
const WORKSPACE_TAB_ENABLED_PREF = "floorp.browser.workspace.tab.enabled";
const WORKSPACE_CURRENT_PREF = "floorp.browser.workspace.current";
const WORKSPACE_ALL_PREF = "floorp.browser.workspace.all";
const WORKSPACE_TABS_PREF = "floorp.browser.workspace.tabs.state";

function initWorkspace() { 
    //first run
    const l10n = new Localization(["browser/floorp.ftl"], true);
    if (Services.prefs.getStringPref(WORKSPACE_CURRENT_PREF) == "") {
      const defaultWorkspace = l10n.formatValueSync("workspace-default");
      Services.prefs.setStringPref(WORKSPACE_CURRENT_PREF, defaultWorkspace);
      Services.prefs.setStringPref(WORKSPACE_ALL_PREF, defaultWorkspace);
    }
    
    let tabs = gBrowser.tabs;
    const workspace_tabs_string_pref = Services.prefs.getStringPref(WORKSPACE_TABS_PREF)
    const workspace_current_string_pref = Services.prefs.getStringPref(WORKSPACE_CURRENT_PREF)
    
    if(workspace_tabs_string_pref == "[]"){
      for (let i = 0; i < tabs.length; i++) {
        tabs[i].setAttribute("floorp-workspace", workspace_current_string_pref);
      }
    } else {
      for (let i = 0; i < tabs.length; i++) {
        const tabsState = JSON.parse(workspace_tabs_string_pref);
        const tabStateSetting = tabsState[i];
        const workspace = tabStateSetting?.[i]?.workspace ?? workspace_current_string_pref;
        tabs.setAttribute("floorp-workspace", workspace);
      };
    }

    //add workspace menu form pref
    let workspaceAll = Services.prefs.getStringPref(WORKSPACE_ALL_PREF).split(",");
    for (let i = 0; i < workspaceAll.length; i++) {
      const label = workspaceAll[i];
      addWorkspaceElemToMenu(label);
    }
    //
    let Tag = document.createElement("style");
    Tag.innerText = `
        .tabbrowser-tab[first-visible-unpinned-tab="true"] > .tab-stack > .tab-content > .tab-close-button{
            display: none !important;
        }
    `;
    Tag.setAttribute("id", "floorp-micaforeveryone");
    document.head.appendChild(Tag);
}

function deleteworkspace(workspace) {
 if  (workspace !== "Default") {
  let allWorkspaces = Services.prefs.getCharPref(WORKSPACE_ALL_PREF).split(",");
  let index = allWorkspaces.indexOf(workspace);
  allWorkspaces.splice(index, 1);
  Services.prefs.setCharPref(WORKSPACE_ALL_PREF, allWorkspaces.join(","));

  //delete workspace tabs
  const tabs = gBrowser.tabs;
  for (let i = 0; i < tabs.length; i++) {
    const tab = tabs[i];
    const tabWorkspace = tab.getAttribute("floorp-workspace");
    if (tabWorkspace == workspace) {
      gBrowser.removeTab(tab);
    }
  }
  //delete workspace menuitem
  let menuitem = document.querySelector(`#workspace-${workspace}`);
  menuitem.remove();
  
  //move to other workspace
  const currentWorkspace = Services.prefs.getStringPref(WORKSPACE_CURRENT_PREF);
  if (currentWorkspace == workspace) {
    Services.prefs.setStringPref(WORKSPACE_CURRENT_PREF, allWorkspaces[0]);
    setCurrentWorkspace();
  }
 }
}

function setCurrentWorkspace() {
  const tabs = gBrowser.tabs;
  let currentWorkspace = Services.prefs.getStringPref(WORKSPACE_CURRENT_PREF);

  document.querySelector(`[floorp-lastVisibleTab]`)?.removeAttribute("floorp-lastVisibleTab")
  let lastTab = null
  for (let i = 0; i < tabs.length; i++) {
    const tab = tabs[i];
    let workspace = tab.getAttribute("floorp-workspace");
    if (workspace == currentWorkspace || !Services.prefs.getBoolPref(WORKSPACE_TAB_ENABLED_PREF)) {
      gBrowser.showTab(tab);
      lastTab = tab
    } else {
      gBrowser.hideTab(tab);
    }
    document.getElementById("workspace-button").setAttribute("label", currentWorkspace);
  }
  lastTab.setAttribute("floorp-lastVisibleTab","true")
} 

function saveWorkspaceState() {
  const tabs = gBrowser.tabs;
  const tabStateObject = tabs.map((tab, i) => ({
    [i]: {
      "workspace": tab.getAttribute("floorp-workspace"),
    }
  }));
  Services.prefs.setStringPref(WORKSPACE_TABS_PREF, JSON.stringify(tabStateObject));
}

function addWorkspaceElemToMenu(label) {
  let workspaceItemElem = window.MozXULElement.parseXULToFragment(`
  <hbox id='workspace-${label}' class="workspace-item-box">
    <toolbarbutton id="workspace-label" label="${label}" 
              class="toolbarbutton-1 workspace-item" workspace="${label}"
              oncommand="changeWorkspace('${label}')"/>
    <toolbarbutton id="workspace-delete" class="workspace-item-delete toolbarbutton-1"
                   oncommand="deleteworkspace('${label}')"/>
  </hbox>
  `);
  document.getElementById("workspace-menu-separator").before(workspaceItemElem);
}

function changeWorkspace(label) {
  let currentWorkspace = label;
  let tabs = gBrowser.tabs;

  Services.prefs.setStringPref(WORKSPACE_CURRENT_PREF, label);
  for (let i = 0; i < tabs.length; i++) {
    let tab = tabs[i];
    if(tab.getAttribute("floorp-workspace") == currentWorkspace){
      gBrowser.selectedTab = tab;
      break;
    } else if(i == tabs.length - 1){
      gBrowser.addTab("about:newtab", {
        skipAnimation: true,
        inBackground: false,
        triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal()
      });
    }
  }
  setCurrentWorkspace();
  saveWorkspaceState();
}

function addNewWorkspace() {
  let allWorkspace = Services.prefs.getStringPref(WORKSPACE_ALL_PREF).split(",");
  let l10n = new Localization(["browser/floorp.ftl"], true);


  prompts = Services.prompt;
  var check = {value: false};
  var input = {placeHolder: "Workspace Name"};
  let result = prompts.prompt(null, l10n.formatValueSync("workspace-prompt-title"), l10n.formatValueSync("please-enter-workspace-name"), input, null, check);

  if (result && allWorkspace.indexOf(input.value) == -1 && input.value != "") {
    let label = input.value;
    let workspaceAll = Services.prefs.getStringPref(WORKSPACE_ALL_PREF).split(",");
    workspaceAll.push(label);
    Services.prefs.setStringPref(WORKSPACE_ALL_PREF, workspaceAll);
    addWorkspaceElemToMenu(label);
  } else if( result == false){
    return;
  } else{
    prompts.alert(null, l10n.formatValueSync("workspace-prompt-title"), l10n.formatValueSync("workspace-error") + "\n" + l10n.formatValueSync("workspace-error-discription"));
  }
  console.log(result);
}

window.setTimeout(function(){
  let list = Services.wm.getEnumerator("navigator:browser");
  while (list.hasMoreElements()) { if (list.getNext() != window) return; }
  
  const toolbarButtonEle = window.MozXULElement.parseXULToFragment(
    `
    <toolbarbutton id="workspace-button"
                    class="toolbarbutton-1 chromeclass-toolbar-additional"
                    label="Workspace"
                    tooltiptext="Workspace"
                    type="menu"
                    style="list-style-image: url('chrome://browser/skin/topsites.svg');">
      <menupopup id="workspace-menu" context="workspace-menu-context">
         <menuseparator id="workspace-menu-separator"/>
         <toolbarbutton style="list-style-image: url('chrome://global/skin/icons/plus.svg');"
                        data-l10n-id="workspace-add" class="subviewbutton subviewbutton-nav" oncommand="addNewWorkspace()"/>
      </menupopup>
    </toolbarbutton>
    `
  );document.querySelector(".toolbar-items").before(toolbarButtonEle);
  if(!Services.prefs.getBoolPref(WORKSPACE_TAB_ENABLED_PREF)) document.querySelector("#workspace-button").style.display = "none"

  //run codes
  initWorkspace();
  setCurrentWorkspace();

  gBrowser.tabContainer.addEventListener("TabOpen", function() {
    let tabs = gBrowser.tabs;
    let lastTab = null
    document.querySelector(`[floorp-lastVisibleTab]`)?.removeAttribute("floorp-lastVisibleTab")
    for (let i = 0; i < tabs.length; i++) {
      let tab = tabs[i];
      if (!tab.hasAttribute("floorp-workspace")) {
        tab.setAttribute("floorp-workspace", Services.prefs.getStringPref(WORKSPACE_CURRENT_PREF));
      }
      if(tab.hasAttribute("floorp-workspace") == Services.prefs.getStringPref(WORKSPACE_CURRENT_PREF)){
        lastTab = tab
      }
    }
    lastTab.setAttribute("floorp-lastVisibleTab","true")
    saveWorkspaceState();
  }, false);

  gBrowser.tabContainer.addEventListener("TabClose", function() {
    saveWorkspaceState();
  }, false);
  
  gBrowser.tabContainer.addEventListener("TabMove", function() {
    saveWorkspaceState();
  } , false);

  Services.prefs.addObserver(WORKSPACE_CURRENT_PREF, function() {
    setCurrentWorkspace();
  }, false);

  Services.prefs.addObserver(WORKSPACE_TAB_ENABLED_PREF,function(){
    document.querySelector("#workspace-button").style.display = Services.prefs.getBoolPref(WORKSPACE_TAB_ENABLED_PREF) ? "" : "none"    
    setCurrentWorkspace()
  },false)

}, 1000);
