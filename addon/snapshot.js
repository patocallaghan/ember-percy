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
      percy.snapshot(name, { enableJavascript: true });
    });
  } catch(e) {
    console.error(e);
    console.log('WARNING! percy-agent not started. Please start percy-agent before running tests.');
  }
}
