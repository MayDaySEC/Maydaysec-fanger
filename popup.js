document.addEventListener('DOMContentLoaded', function() {
  var defangButton = document.getElementById('defangButton');
  var fangButton = document.getElementById('fangButton');

  defangButton.addEventListener('click', function() {
    var url = document.getElementById('urlInput').value;
    var defangedUrl = defangURL(url);
    document.getElementById('outputUrl').value = defangedUrl;
  });

  fangButton.addEventListener('click', function() {
    var url = document.getElementById('urlInput').value;
    var fangedUrl = fangURL(url);
    document.getElementById('outputUrl').value = fangedUrl;
  });
});

function defangURL(url) {
  // Replace occurrences of [.] with .
  var defangedUrl = url.replace(/\[.\]/gi, '.');
  // Replace occurrences of hxxp:// or hxxps:// with http:// or https:// respectively
  defangedUrl = defangedUrl.replace(/hxxps?:\/\//gi, 'https://');
  // Return defanged URL
  return defangedUrl;
}

function fangURL(url) {
  // Replace occurrences of . with [.]
  var fangedUrl = url.replace(/\./gi, '[.]');
  // Replace occurrences of http:// or https:// with hxxps://
  fangedUrl = fangedUrl.replace(/https?:\/\//gi, 'hxxps://');
  // Return fanged URL
  return fangedUrl;
}
