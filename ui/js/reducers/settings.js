import * as types from "constants/action_types";
import LANGUAGES from "constants/languages";
import lbry from "lbry";

const reducers = {};
const defaultState = {
  clientSettings: {
    showNsfw: lbry.getClientSetting("showNsfw"),
    language: lbry.getClientSetting("language"),
  },
  languages: {},
};

reducers[types.DAEMON_SETTINGS_RECEIVED] = function(state, action) {
  return Object.assign({}, state, {
    daemonSettings: action.data.settings,
  });
};

reducers[types.CLIENT_SETTING_CHANGED] = function(state, action) {
  const { key, value } = action.data;
  const clientSettings = Object.assign({}, state.clientSettings);

  clientSettings[key] = value;

  return Object.assign({}, state, {
    clientSettings,
  });
};

reducers[types.DOWNLOAD_LANGUAGE_SUCCEEDED] = function(state, action) {
  const languages = Object.assign({}, state.languages);
  const language = action.data.language;

  const langCode = language.substring(0, 2);

  if (LANGUAGES[langCode]) {
    languages[language] =
      LANGUAGES[langCode][0] + " (" + LANGUAGES[langCode][1] + ")";
  } else {
    languages[langCode] = langCode;
  }

  return Object.assign({}, state, { languages });
};

reducers[types.DOWNLOAD_LANGUAGE_FAILED] = function(state, action) {
  const languages = Object.assign({}, state.languages);
  delete languages[action.data.language];
  return Object.assign({}, state, { languages });
};

export default function reducer(state = defaultState, action) {
  const handler = reducers[action.type];
  if (handler) return handler(state, action);
  return state;
}
