chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'defang_urls' || message.action === 'fang_urls') {
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      func: processPageLinks,
      args: [message.action]
    });
  }
});

/**
 * Injected into the page to process all anchor href attributes.
 * @param {string} action - 'defang_urls' or 'fang_urls'
 */
function processPageLinks(action) {
  const links = document.getElementsByTagName('a');

  function defangUrl(url) {
    return url
      .replace(/\./g, '[.]')
      .replace(/:\/\//g, '[://]')
      .replace(/@/g, '[at]');
  }

  function fangUrl(url) {
    return url
      .replace(/\[at\]/g, '@')
      .replace(/\[:\/\/\]/g, '://')
      .replace(/\[\.\]/g, '.')
      .replace(/\[:\]/g, ':');
  }

  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    const href = link.getAttribute('href');
    if (!href) continue;

    if (action === 'defang_urls') {
      if (href.includes('://')) {
        const defangedHref = defangUrl(href);
        link.setAttribute('href', defangedHref);
        link.textContent = defangedHref;
      }
    } else if (action === 'fang_urls') {
      if (href.includes('[.]') || href.includes('[://]') || href.includes('[:]')) {
        const fangedHref = fangUrl(href);
        link.setAttribute('href', fangedHref);
        link.textContent = fangedHref;
      }
    }
  }
}
