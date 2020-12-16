var last_data_received = null;
var current_url = null;

chrome.runtime.onMessage.addListener(function(request, sender) {
  if (request.action == "citation-response") {
    if ("url" in request.data) {
      var bibtex = bibtex_build(request.data.type,
                                request.data.title,
                                request.data.authors,
                                request.data.journal_or_conference,
                                request.data.year,
                                request.data.url,
                                current_url);
      var bibtex_text = document.getElementById("bibtex");
      bibtex_text.innerText = bibtex;
      var link_text = document.getElementById("link");
      link_text.innerHTML = request.data.url + ": " + request.data.title;
      last_data_received = request.data;
      document.getElementById("buttons").style.display = "inline";
    } else {
      var status_text = document.getElementById("status");
      status.innerHTML = request.data.message;
    }
  }
});

function execute_scripts(tab_id, inject_details) {
  function create_callback(tab_id, inject_detail, inner_callback) {
    return function () {
      chrome.tabs.executeScript(tab_id, inject_detail, inner_callback);
    };
  }
  var callback = function() {
    // If you try and inject into an extensions page or the webstore/NTP you'll get an error.
    if (chrome.runtime.lastError) {
      var bibtex_text = document.getElementById("bibtex");
      bibtex_text.innerHTML = "This is not recognized as a paper.\nTry on https://arxiv.org/abs/ pages.\nFor example: <a href='https://arxiv.org/abs/2005.13537'>https://arxiv.org/abs/2005.13537</a>";
    }
  };
  for (var i = inject_details.length - 1; i >= 0; --i)
    callback = create_callback(tab_id, inject_details[i], callback);
  if (callback !== null)
    callback();
}


function on_window_load() {

  document.getElementById("bibtex-btn").addEventListener("click", function(event) {
    var bibtex_text = document.getElementById("bibtex");
    var range = document.createRange();
    range.selectNode(bibtex_text);
    window.getSelection().addRange(range);
    document.execCommand("copy");
    window.getSelection().removeAllRanges();
    document.getElementById("status").innerText = "BibTex copied.";
  });

  document.getElementById("link-btn").addEventListener("click", function(event) {
    var link_text = document.getElementById("link");
    var range = document.createRange();
    range.selectNode(link_text);
    window.getSelection().addRange(range);
    document.execCommand("copy");
    window.getSelection().removeAllRanges();
    document.getElementById("status").innerText = "Link copied.";
  });

  document.getElementById("zotero-btn").addEventListener("click", function(event) {
    if (last_data_received !== null && last_data_received.title !== "") {
      chrome.storage.sync.get({
        zotero_user_id: "",
        zotero_access_key: "",
        zotero_collection: "none",
      }, function(items) {
        if (items.zotero_user_id !== "" && items.zotero_access_key !== "" && items.zotero_collection != "none") {
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
        } else {
          document.getElementById("status").innerText = "Zotero not configured.";
        }
      });
    }
  });

  chrome.tabs.query({"active": true, "windowId": chrome.windows.WINDOW_ID_CURRENT}, function(tabs) {
    current_url = JSON.stringify(tabs[0].url);

    execute_scripts(null, [
        {code: "var current_url = " + current_url + ";"},
        {file: "src/domains.js"},
        {file: "src/extensions/acm.js"},
        {file: "src/extensions/ieeexplore.js"},
        {file: "src/extractor.js"},
    ]);
  });
}

window.onload = on_window_load;
