chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'defang') {
    chrome.storage.sync.get({ rules: [] }, function(data) {
      var rules = data.rules;
      chrome.scripting.executeScript({
        target: { tabId: sender.tab.id },
        func: defangURLs,
        args: [rules]
      });
    });
  }
});

function defangURLs(rules) {
  var links = document.getElementsByTagName('a');
  for (var i = 0; i < links.length; i++) {
    var link = links[i];
    var href = link.getAttribute('href');
    rules.forEach(function(rule) {
      href = href.replace(rule.fangedUrl, rule.defangedUrl);
    });
    link.setAttribute('href', href);
  }
}
