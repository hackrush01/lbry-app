import React from "react";
import ReactDOM from "react-dom";
import lbry from "./lbry.js";
import App from "component/app/index.js";
import SnackBar from "component/snackBar";
import { Provider } from "react-redux";
import store from "store.js";
import SplashScreen from "component/splash.js";
import AuthOverlay from "component/authOverlay";
import { doChangePath, doNavigate, doDaemonReady } from "actions/app";
import { toQueryString } from "util/query_params";
import { selectBadgeNumber } from "selectors/app";
import * as types from "constants/action_types";

const env = ENV;
const { remote, ipcRenderer, shell } = require("electron");
const contextMenu = remote.require("./menu/context-menu");
const app = require("./app");

lbry.showMenuIfNeeded();

window.addEventListener("contextmenu", event => {
  contextMenu.showContextMenu(
    remote.getCurrentWindow(),
    event.x,
    event.y,
    lbry.getClientSetting("showDeveloperMenu")
  );
  event.preventDefault();
});

window.addEventListener("popstate", (event, param) => {
  event.preventDefault();

  const hash = document.location.hash;
  let action;

  if (hash !== "") {
    const url = hash.split("#")[1];
    const params = event.state;
    const queryString = toQueryString(params);

    app.store.dispatch(doChangePath(`${url}?${queryString}`));
  } else {
    app.store.dispatch(doChangePath("/discover"));
  }
});

ipcRenderer.on("open-uri-requested", (event, uri) => {
  if (uri && uri.startsWith("lbry://")) {
    app.store.dispatch(doNavigate("/show", { uri }));
  }
});

ipcRenderer.on("open-menu", (event, uri) => {
  if (uri && uri.startsWith("/help")) {
    app.store.dispatch(doNavigate("/help"));
  }
});

document.addEventListener("click", event => {
  var target = event.target;
  while (target && target !== document) {
    if (
      target.matches('a[href^="http"]') ||
      target.matches('a[href^="mailto"]')
    ) {
      event.preventDefault();
      shell.openExternal(target.href);
      return;
    }
    target = target.parentNode;
  }
});

const application = remote.app;
const dock = application.dock;
const win = remote.BrowserWindow.getFocusedWindow();

const setBadge = () => {
  if (!dock) return;
  if (win.isFocused()) return;

  const state = app.store.getState();
  const badgeNumber = selectBadgeNumber(state);

  let badge;
  if (badgeNumber === 0) badge = "";
  else badge = "" + badgeNumber;

  dock.setBadge(badge);
};
app.store.subscribe(setBadge);

win.on("focus", () => {
  app.store.dispatch({ type: types.WINDOW_FOCUSED });
  dock.setBadge("");
});

const initialState = app.store.getState();

// import whyDidYouUpdate from "why-did-you-update";
// if (env === "development") {
//   /*
// 		https://github.com/garbles/why-did-you-update
// 		"A function that monkey patches React and notifies you in the console when
// 		potentially unnecessary re-renders occur."
//
// 		Just checks if props change between updates. Can be fixed by manually
// 		adding a check in shouldComponentUpdate or using React.PureComponent
// 	*/
//   whyDidYouUpdate(React);
// }

var init = function() {
  function onDaemonReady() {
    window.sessionStorage.setItem("loaded", "y"); //once we've made it here once per session, we don't need to show splash again
    app.store.dispatch(doDaemonReady());

    ReactDOM.render(
      <Provider store={store}>
        <div><AuthOverlay /><App /><SnackBar /></div>
      </Provider>,
      canvas
    );
  }

  if (window.sessionStorage.getItem("loaded") == "y") {
    onDaemonReady();
  } else {
    ReactDOM.render(<SplashScreen onLoadDone={onDaemonReady} />, canvas);
  }
};

init();
