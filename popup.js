

chrome.runtime.onMessage.addListener(function(request, sender) {
  if (request.action == "getBibtex") {
    var bibtex_text = document.getElementById("bibtex");
    bibtex_text.innerText = request.data.bibtex;
    var link_text = document.getElementById("link");
    link_text.innerText = request.data.url + ": " + request.data.title
  }
});

function onWindowLoad() {
  document.getElementById("bibtex-btn").addEventListener('click', function(event) {
    var bibtex_text = document.getElementById("bibtex");
    var range = document.createRange();
    range.selectNode(bibtex_text);
    window.getSelection().addRange(range);
    document.execCommand('copy');
    window.getSelection().removeAllRanges();
  });
  document.getElementById("link-btn").addEventListener('click', function(event) {
    var link_text = document.getElementById("link");
    var range = document.createRange();
    range.selectNode(link_text);
    window.getSelection().addRange(range);
    document.execCommand('copy');
    window.getSelection().removeAllRanges();
  });

  var bibtex_text = document.getElementById("bibtex");
  var link_text = document.getElementById("link");

  chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT}, function(tabs){
    var url = JSON.stringify(tabs[0].url)
    chrome.tabs.executeScript(null, {
      code: "var current_url = " + url + ";"
    }, function() {
      chrome.tabs.executeScript(null, {
        file: "get_bibtex.js"
      }, function() {
        // If you try and inject into an extensions page or the webstore/NTP you'll get an error.
        if (chrome.runtime.lastError) {
          bibtex_text.innerText = 'This is not recognized as a paper.\nTry on https://arxiv.org/abs/ pages.';
        }
      });
    });
  });
}

window.onload = onWindowLoad;
