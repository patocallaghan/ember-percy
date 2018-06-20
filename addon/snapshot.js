import { run } from '@ember/runloop';
import percyJQuery from 'percy-jquery';
import { getNativeXhr } from './native-xhr';

// Copy attributes from Ember's rootElement to the DOM snapshot <body> tag. Some applications rely
// on setting attributes on the Ember rootElement (for example, to drive dynamic per-route
// styling). In tests these attributes are added to the #ember-testing container and would be lost
// in the DOM hoisting, so we copy them to the to the snapshot's <body> tag to
// make sure that they persist in the DOM snapshot.
function copyAttributesToBodyCopy(bodyCopy, testingContainer) {
  let attributesToCopy = testingContainer.prop('attributes');
  percyJQuery.each(attributesToCopy, function() {
    // Special case for the class attribute - append new classes onto existing body classes
    if (this.name === 'class') {
      bodyCopy.attr(this.name, bodyCopy.attr('class') + ' ' + this.value);
    } else {
      bodyCopy.attr(this.name, this.value);
    }
  });
}

export function percySnapshot(name, options) {
  // Skip if Testem is not available (we're probably running from `ember server`
  // and Percy is not enabled anyway).
  if (!window.Testem) { return; }

  // Automatic name generation for QUnit tests by passing in the `assert` object.
  if (name.test && name.test.module && name.test.module.name && name.test.testName) {
    name = `${name.test.module.name} | ${name.test.testName}`;
  } else if (name.fullTitle) {
    // Automatic name generation for Mocha tests by passing in the `this.test` object.
    name = name.fullTitle();
  }

  try {
    var percy = new window.Percy.PercyAgentClient(
      'ember-percy',
      getNativeXhr(),
      (documentClone) => {
        let testingContainer = documentClone.querySelector('#ember-testing');
        documentClone.querySelector('body').innerHTML = testingContainer.innerHTML;

        return documentClone;
      }
    );

    run(function () {
      percy.snapshot(name, options);
    });
  } catch (e) {
    console.error(e.message);
    console.error(e.stack);
    console.log('WARNING! Ensure percy-agent has been started. To start, run "percy-agent start" before running tests.');
  }
}
