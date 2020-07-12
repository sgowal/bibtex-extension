// Saves options to chrome.storage
function save_options() {
  var zotero_user_id = document.getElementById("user_id").value;
  var zotero_access_key = document.getElementById("access_key").value;
  var select = document.getElementById("collections");
  var zotero_collection = collections.options[collections.selectedIndex].value;
  chrome.storage.sync.set({
    zotero_user_id: zotero_user_id,
    zotero_access_key: zotero_access_key,
    zotero_collection: zotero_collection,
  }, function() {
    // Things are saved.
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  chrome.storage.sync.get({
    zotero_user_id: "",
    zotero_access_key: "",
    zotero_collection: "none",
  }, function(items) {
    document.getElementById("user_id").value = items.zotero_user_id;
    document.getElementById("access_key").value = items.zotero_access_key;
    // Fill collections.
    var list = document.getElementById("collections");
    if (items.zotero_user_id !== "" && items.zotero_access_key !== "") {
      zotero_list_collections(items.zotero_user_id, items.zotero_access_key, function(collections, message) {
        console.log(items.zotero_collection)
        list.innerHTML = "";
        if (collections !== null) {
          for (var key in collections) {
            var option = document.createElement("option");
            option.value = key;
            option.text = collections[key];
            list.add(option);
          }
          list.value = items.zotero_collection;
        } else {
          var option = document.createElement("option");
          option.value = "none";
          option.text = message;
          list.add(option);
        }
      });
    }
  });
}
document.addEventListener("DOMContentLoaded", restore_options);
document.getElementById("save").addEventListener("click", save_options);
