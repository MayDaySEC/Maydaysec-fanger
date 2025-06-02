chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'defang_urls') {
    const links = document.getElementsByTagName('a');
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const href = link.href;
      if (href.includes('://')) {
        const defangedHref = href
          .replace(/\./g, '[.]')
          .replace(/:/g, '[:]')
          .replace(/\/\//g, ':\\u200B/')
          .replace(/@/g, '[at]');
        link.setAttribute('href', defangedHref);
        link.textContent = defangedHref;
      }
    }
  } else if (message.action === 'fang_urls') {
    const links = document.getElementsByTagName('a');
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const href = link.href;
      if (href.includes(':\\u200B/')) {
        const fangedHref = href
          .replace(/\[\.\]/g, '.')
          .replace(/\[:\]/g, ':')
          .replace(/\\u200B/g, '')
          .replace(/\[at\]/g, '@');
        link.setAttribute('href', fangedHref);
        link.textContent = fangedHref;
      }
    }
  }
});
