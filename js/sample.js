
function getVConsole(selector) { // eslint-disable-line no-unused-vars
  'use strict';

  var console = document.querySelector(selector);
  return {
    log: function(message) {
      console.value += (message + '').replace(/\s+$/, '') + '\n';
      console.scrollTop = console.scrollHeight;
    }
  };
}
