/* ACE Mind containment hotfix.
   The native ACE Mind renderer is the only visible authority.
   This module remains diagnostics-only and does not mutate the supplement chamber.
*/

const VERSION = 'ace_mind_optimizer_shadow.contained.v1';

const api = Object.freeze({
  version: VERSION,
  mode: 'diagnostics-only',
  run: async function () { return null; },
  latest: function () { return null; },
  history: async function () { return []; },
  disable: function () {},
  enable: function () {}
});

if (typeof window !== 'undefined') {
  window.AceMindOptimizerShadow = api;
  window.dispatchEvent(new CustomEvent('ace-mind:optimizer-contained', {
    detail: { version: VERSION, authority: 'native-ace-mind-renderer' }
  }));
}

export default api;
