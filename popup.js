var last_data_received = null;

chrome.runtime.onMessage.addListener(function(request, sender) {
  if (request.action == "getBibtex") {
    var bibtex_text = document.getElementById("bibtex");
    bibtex_text.innerText = request.data.bibtex;

    var link_text = document.getElementById("link");
    link_text.innerHTML = request.data.url + ": " + request.data.title;

    last_data_received = request.data;
  }
});

function onWindowLoad() {

  document.getElementById("bibtex-btn").addEventListener("click", function(event) {
    var bibtex_text = document.getElementById("bibtex");
    var range = document.createRange();
    range.selectNode(bibtex_text);
    window.getSelection().addRange(range);
    document.execCommand("copy");
    window.getSelection().removeAllRanges();
  });

  document.getElementById("link-btn").addEventListener("click", function(event) {
    var link_text = document.getElementById("link");
    var range = document.createRange();
    range.selectNode(link_text);
    window.getSelection().addRange(range);
    document.execCommand("copy");
    window.getSelection().removeAllRanges();
  });

  document.getElementById("zotero-btn").addEventListener("click", function(event) {
    if (last_data_received !== null && last_data_received.title !== "") {
      chrome.storage.sync.get({
        zotero_user_id: "",
        zotero_access_key: "",
        zotero_collection: "none",
      }, function(items) {
        document.getElementById("status").innerText = "Saving...";
        zotero_create_item(
            items.zotero_user_id, items.zotero_access_key,
            last_data_received.type,
            last_data_received.title,
            last_data_received.authors,
            last_data_received.journal_or_conference,
            last_data_received.year,
            last_data_received.url,
            items.zotero_collection,
            function (message) {
              document.getElementById("status").innerText = message;
            });
      });
    }
  });

  var bibtex_text = document.getElementById("bibtex");
  var link_text = document.getElementById("link");

  chrome.tabs.query({"active": true, "windowId": chrome.windows.WINDOW_ID_CURRENT}, function(tabs){
    var url = JSON.stringify(tabs[0].url);
    chrome.tabs.executeScript(null, {
      code: "var current_url = " + url + ";"
    }, function() {
      chrome.tabs.executeScript(null, {
        file: "get_bibtex.js"
      }, function() {
        // If you try and inject into an extensions page or the webstore/NTP you'll get an error.
        if (chrome.runtime.lastError) {
          bibtex_text.innerHTML = "This is not recognized as a paper.\nTry on https://arxiv.org/abs/ pages.\nFor example: <a href='https://arxiv.org/abs/2005.13537'>https://arxiv.org/abs/2005.13537</a>";
        }
      });
    });
  });
}

window.onload = onWindowLoad;
