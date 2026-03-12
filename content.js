chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'defang_urls') {
    const links = document.getElementsByTagName('a');
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const href = link.getAttribute('href');
      if (!href) continue;
      if (href.includes('://')) {
        const defanged = href
          .replace(/\./g, '[.]')
          .replace(/:\/\//g, '[://]')
          .replace(/@/g, '[at]');
        link.setAttribute('href', defanged);
        link.textContent = defanged;
      }
    }
  } else if (message.action === 'fang_urls') {
    const links = document.getElementsByTagName('a');
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const href = link.getAttribute('href');
      if (!href) continue;
      if (href.includes('[.]') || href.includes('[://]') || href.includes('[:]')) {
        const fanged = href
          .replace(/\[at\]/g, '@')
          .replace(/\[:\/\/\]/g, '://')
          .replace(/\[\.\]/g, '.')
          .replace(/\[:\]/g, ':');
        link.setAttribute('href', fanged);
        link.textContent = fanged;
      }
    }
  }
});
