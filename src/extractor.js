// This script is injected into the current page to extract the citation information.

function main(url) {
  var redirect = pdf_redirect_url(url);
  if (redirect === null) {
    // Not on PDF page.
    var error_message = "Unable to find any papers on\n" + url + ".";
    for (var domain in EXTENDED_DOMAINS) {
      if (!url.startsWith(domain)) {
        continue;
      }
      var data = EXTENDED_DOMAINS[domain](url);
      if (data === null) {
        error(error_message);
      } else {
        reply(data);
      }
      return;
    }
    var data = get_citation(document, url);
    if (data === null) {
      error(error_message);
    } else {
      reply(data);
    }
  } else {
    // PDF page, try to get the original content.
    var error_message = "Unable to find any papers on\n" + redirect.url + ".";
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        parser = new DOMParser();
        document_root = parser.parseFromString(request.responseText, "text/html");
        var data = redirect.get_citation(document_root, redirect.url);
        if (data === null) {
          error(error_message);
        } else {
          reply(data);
        }
      } else if (this.readyState == 4) {
        error(error_message);
      } else {
        update("Fetching...");
      }
    };
    request.open("GET", redirect.url, true);
    request.send();
  }
}


function get_citation(document_root, current_url) {
  var x = document_root.querySelectorAll("meta[name]");
  var i;

  var authors = [];
  var year = null;
  var title = null;
  var url = null;
  var conference = null;

  for (i = 0; i < x.length; i++) {
    var name = x[i].name;
    var content = x[i].content;

    if (name == "citation_title") {
      title = content;
    } else if (name == "citation_author") {
      authors.push(canonicalize_author(content));
    } else if (name == "citation_authors" && authors.length == 0) {
      authors = content.split('; ').map(function(val, index){
        return canonicalize_author(val);
      })
    } else if (name == "citation_publication_date") {
      year = content.split(/[\/-]/)[0];
    } else if (name == "citation_date") {
      year = content.split(/[\/-]/)[0];
    } else if (name == "citation_online_date" && year === null) {
      year = content.split(/[\/-]/)[0];
    } else if (name == "citation_arxiv_id") {
      conference = "arXiv preprint arXiv:" + content;
    } else if (name == "citation_mjid") {
      var tokens = content.split(";");
      if (tokens[0] == "biorxiv") {
        conference = "bioRxiv preprint bioRxiv:" + tokens[1];
      } else if (tokens[0] == "medrxiv") {
        conference = "medRxiv preprint medRxiv:" + tokens[1];
      } else {
        conference = content;
      }
    } else if (name == "citation_pdf_url") {
      url = content;
    } else if (name == "citation_fulltext_html_url" && url === null) {
      url = content;
    } else if (name == "citation_conference_title" && conference === null) {
      conference = content;
    } else if (name == "citation_journal_title" && conference === null) {
      conference = content;
    }
  }

  if (title === null) {
    return null;
  }

  var type = get_type(current_url);
  return {
      url: url,
      title: title,
      authors: authors,
      journal_or_conference: conference,
      year: year,
      type: type,
      message: "Successfully retrieved citation information.",
  };
}


function in_domain(domain, url) {
  if (url.startsWith("https://")) {
    return url.substring(8).startsWith(domain);
  } else if (url.startsWith("http://")) {
    return url.substring(7).startsWith(domain);
  } else {
    return url.startsWith(domain);
  }
}


function pdf_redirect_url(url) {
  var re = null;
  var fn = null;
  var process_fn = get_citation;
  for (var domain in PDF_DOMAINS) {
    if (in_domain(domain, url)) {
      re = PDF_DOMAINS[domain][0];
      fn = PDF_DOMAINS[domain][1];
      if (PDF_DOMAINS[domain].length == 3) {
        process_fn = PDF_DOMAINS[domain][2];
      }
      break;
    }
  }
  if (re === null) {
    return null;
  }
  matches = url.match(re);
  if (matches === null || matches.length < 2) {
    return null;
  }
  return {
    url: fn(matches),
    get_citation: process_fn,
  };
}


function canonicalize_author(author) {
  tokens = author.split(", ");
  var new_author = author;
  if (tokens.length == 1) {
    tokens = author.split(" ");
    if (tokens.length >= 2) {
      new_author = tokens[tokens.length - 1] + ", ";
      tokens.pop();
      new_author += tokens.map(function(val, index){
        if (val.endsWith(".")) {
          return val.substring(0, val.length - 1);
        }
        return val;
      }).join(" ");
    }
  }
  return new_author;
}


function get_type(url) {
  var type = null;
  for (var domain in DOMAIN_TYPES) {
    if (in_domain(domain, url)) {
      type = DOMAIN_TYPES[domain];
      break;
    }
  }
  if (type === null) {
    type = "inproceedings";
  }
  return type;
}


function reply(data) {
  chrome.runtime.sendMessage({
    action: "citation-response",
    data: data
  });
}


function error(message) {
  chrome.runtime.sendMessage({
    action: "citation-response",
    data: {
        message: message,
    }
  });
}


function update(message) {
  chrome.runtime.sendMessage({
    action: "citation-response",
    data: {
        message: message,
    }
  });
}


main(current_url);
