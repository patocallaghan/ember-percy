/* eslint no-console: off */

'use strict';

var bodyParser = require('body-parser');
var Environment = require('percy-client/dist/environment');

module.exports = {
  name: 'ember-percy',

  _clientInfo: function() {
    if(!this._clientInfoCache) {
      var version = require('./package.json').version;
      this._clientInfoCache = `${this.name}/${version}`;
    }

    return this._clientInfoCache;
  },

  _environmentInfo: function() {
    if(!this._environmentInfoCache) {
      this._environmentInfoCache = [
        `ember/${this._emberSourceVersion()}`,
        `ember-cli/${this._emberCliVersion()}`
      ].join('; ');
    }

    return this._environmentInfoCache;
  },

  _emberSourceVersion: function() {
    try {
      // eslint-disable-next-line node/no-unpublished-require
      return require('ember-source/package.json').version;
    } catch (e) {
      return 'unknown';
    }
  },

  _emberCliVersion: function() {
    try {
      // eslint-disable-next-line node/no-unpublished-require
      return require('ember-cli/lib/utilities/version-utils').emberCLIVersion();
    } catch (e) {
      return 'unknown';
    }
  },

  included: function(app) {
    this._super.included(app);
    app.import('vendor/percy-jquery.js', {type: 'test'});
  },

  // Only allow the addon to be incorporated in non-production envs.
  isEnabled: function() {
    // This cannot be just 'test', because people often run tests from development servers, and the
    // helper imports will fail since ember-cli excludes addon files entirely if not enabled.
    return (process.env.EMBER_ENV !== 'production');
  },

  // Inject percy finalization into the footer of tests/index.html.
  contentFor: function(type) {
    // Disable finalize injection if Percy is explicitly disabled or if not in an 'ember test' run.
    // This must be handled separately than the outputReady disabling below.
    if (process.env.PERCY_ENABLE == '0' || process.env.EMBER_ENV !== 'test') {
      return;
    }
    if (type === 'test-body-footer') {
      return "\
        <script> \
          require('ember-percy/native-xhr')['default'](); \
        </script> \
        <script src='http://localhost:5338/percy-agent.js'></script> \
      ";
    }
  },
};
