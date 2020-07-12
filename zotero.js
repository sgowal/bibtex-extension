var _ZOTERO_TYPE_MAP = {
  "inproceedings": "conferencePaper",
  "article": "journalArticle",
  "incollection": "bookSection",
};


function zotero_full_name(key, names, parents) {
  var name = names[key];
  if (parents[key] !== null) {
    return full_name(parents[key], names, parents) + '>' + name;
  } else {
    return name;
  }
}

function zotero_list_collections(user_id, access_key, callback) {
  var request = new XMLHttpRequest();
  request.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var collections = JSON.parse(request.responseText);
      var names = {};
      var parents = {};
      for (var i = 0; i < collections.length; i++) {
        var collection = collections[i];
        var key = collection.data.key;
        var name = collection.data.name;
        var parent = null;
        if (collection.data.parentCollection) {
          parent = collection.data.parentCollection;
        }
        names[key] = name;
        parents[key] = parent;
      }
      var full_names = {};
      for (var k in names) {
        full_names[k] = zotero_full_name(k, names, parents);
      }
      callback(full_names, "success");
    } else if (this.readyState == 4) {
      console.log("Failure to access Zotero API.");
      callback(null, "Failure to access Zotero API.");
    }
  };
  request.open("GET", "https://api.zotero.org/users/" + user_id + "/collections", true);
  request.setRequestHeader("Zotero-API-Key", access_key);
  request.send();
}

function zotero_upload_item(user_id, access_key, item, callback) {
  var request = new XMLHttpRequest();
  request.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      callback("Successfully saved to Zotero.");
    } else if (this.readyState == 4) {
      callback("Failure to add item to desired collection.");
      console.log("Failure to add item to desired collection.");
      console.log(request);
    }
  };
  request.open("POST", "https://api.zotero.org/users/" + user_id + "/items", true);
  request.setRequestHeader("Zotero-API-Key", access_key);
  request.setRequestHeader("Content-Type", "application/json");
  request.send(JSON.stringify([item]));
}


function zotero_create_item(user_id, access_key, type, title, authors, journal_or_conference, year, pdf_url, collection_key, callback) {
  var request = new XMLHttpRequest();
  request.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var item = JSON.parse(request.responseText);
      item.title = title;
      if (type == "article") {
        item.publicationTitle = journal_or_conference;
      } else if (type == "incollection") {
        item.bookTitle = journal_or_conference;
      } else if (type == "inproceedings") {
        item.proceedingsTitle = journal_or_conference;
      } else  {
        console.log("Unknown item type.");
      }
      item.date = year;
      item.url = pdf_url;
      var creator_item = item.creators[0];
      item.creators = [];
      for (var i = 0; i < authors.length; i++) {
        var new_creator_item = Object.assign({}, creator_item);
        var tokens = authors[i].split(", ");
        if (tokens.length == 1) {
          new_creator_item.firstName = tokens[0];
        } else {
          new_creator_item.firstName = tokens[1];
          new_creator_item.lastName = tokens[0];
        }
        item.creators.push(new_creator_item);
      }
      item.collections.push(collection_key);
      zotero_upload_item(user_id, access_key, item, callback);
    } else if (this.readyState == 4) {
      callback("Failure to access Zotero API.");
      console.log("Failure to access Zotero API.");
    }
  };
  request.open("GET", "https://api.zotero.org/items/new?itemType=" + _ZOTERO_TYPE_MAP[type], true);
  request.setRequestHeader("Zotero-API-Key", access_key);
  request.send();
}
