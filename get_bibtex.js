var _TYPE_MAP = {
  "arxiv.org/": "article",
  "www.medrxiv.org/": "article",
  "www.biorxiv.org/": "article",
  "science.sciencemag.org/": "article",
  "papers.nips.cc/": "incollection",
  "distill.pub/": "article",
};


var _PDF_MAP = {
  "www.nature.com/articles/": [
      /^(.*\/)([^\/]*)\.pdf$/,
      function (m) {
        return m[1] + m[2];
      }
  ],
  "arxiv.org/pdf/": [
      /^https:\/\/arxiv\.org\/pdf\/([^\/]*)$/,
      function (m) {
        return "https://arxiv.org/abs/" + m[1];
      }
  ],
  "www.medrxiv.org/content/": [
      /^(https:\/\/www\.medrxiv\.org\/content\/)([^\/]*)\/([^\/]*)\.full\.pdf$/,
      function (m) {
        return m[1] + m[2] + "/" + m[3];
      }
  ],
  "www.biorxiv.org/content/": [
      /^(https:\/\/www\.biorxiv\.org\/content\/)([^\/]*)\/([^\/]*)\.full\.pdf$/,
      function (m) {
        return m[1] + m[2] + "/" + m[3];
      }
  ],
  "openreview.net/pdf?id=": [
      /^https:\/\/openreview\.net\/pdf\?id=([^\/]*)$/,
      function (m) {
        return "https://openreview.net/forum?id=" + m[1];
      }
  ],
  "papers.nips.cc/paper/": [
      /^(.*\/)([^\/]*)\.pdf$/,
      function (m) {
        return m[1] + m[2];
      }
  ],
  "science.sciencemag.org/content/": [
      /^(https:\/\/science\.sciencemag\.org\/content\/)([^\/]*)\/(.*)\.full\.pdf$/,
      function (m) {
        return m[1] + m[3];
      }
  ],
  "www.roboticsproceedings.org/": [
      /^(.*\/)([^\/]*)\.pdf$/,
      function (m) {
        return m[1] + m[2] + ".html";
      }
  ],
};


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
  for (var domain in _PDF_MAP) {
    if (in_domain(domain, url)) {
      re = _PDF_MAP[domain][0];
      fn = _PDF_MAP[domain][1];
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
  return fn(matches);
}


function reply(data) {
  chrome.runtime.sendMessage({
    action: "getBibtex",
    data: data
  });
}


function error(message) {
  chrome.runtime.sendMessage({
    action: "getBibtex",
    data: {
        bibtex: message,
        url: "",
        title: ""
    }
  });
}


function update(message) {
  chrome.runtime.sendMessage({
    action: "getBibtex",
    data: {
        bibtex: message,
        url: "",
        title: ""
    }
  });
}


function main(url) {
  var error_message = "Unable to find any papers on\n" + url + ".";
  if (url.startsWith("https://ieeexplore.ieee.org/document/")) {
    var data = ieeexplore();
    if (data === null) {
      error(error_message);
    } else {
      reply(data);
    }
    return;
  }

  var redirect_url = pdf_redirect_url(url);
  if (redirect_url === null) {
    var data = get_citation(document);
    if (data === null) {
      error(error_message);
    } else {
      reply(data);
    }
  } else {
    error_message = "Unable to find any papers on\n" + redirect_url + ".";
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        parser = new DOMParser();
        document_root = parser.parseFromString(request.responseText, "text/html");
        var data = get_citation(document_root);
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
    request.open("GET", redirect_url, true);
    request.send();
  }
}


function useful_word(word) {
  return !(["a", "an", "the"].includes(word.toLowerCase()));
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
  for (var domain in _TYPE_MAP) {
    if (in_domain(domain, url)) {
      type = _TYPE_MAP[domain];
      break;
    }
  }
  if (type === null) {
    type = "inproceedings";
  }
  return type;
}


function build_bibtex(type, title, authors, journal_or_conference, year, pdf_url) {
  var first_author = authors[0].split(", ")[0].toLowerCase();
  var first_word = title.split(" ").filter(useful_word)[0].toLowerCase();
  first_word = first_word.replace("-", "");
  first_word = first_word.replace(":", "");
  var authors_string = authors.join(" and ");

  var bibtex = "@" + type + "{";
  var is_article = type == "article";
  bibtex += first_author + year + first_word + ",\n";
  if (title !== null) {
    bibtex += "  title={" + title + "},\n";
  }
  if (authors_string !== "") {
    bibtex += "  author={" + authors_string + "},\n";
  }
  if (journal_or_conference !== null) {
    if (is_article) {
      bibtex += "  journal={" + journal_or_conference + "},\n";
    } else {
      bibtex += "  booktitle={" + journal_or_conference + "},\n";
    }
  }
  if (year !== null) {
    bibtex += "  year={" + year + "},\n";
  }
  if (pdf_url !== null) {
    if (!pdf_url.startsWith("http")) {
      var arr = current_url.split("/");
      if (pdf_url.startsWith("/")) {
        pdf_url = arr.slice(0, 3).join("/") + pdf_url;
      } else {
        arr.pop();
        pdf_url = arr.join("/") + "/" + pdf_url;
      }
    }

    bibtex += "  url={" + pdf_url + "}\n";
  }
  bibtex += "}";
  return bibtex;
}


function get_citation(document_root) {
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
      bibtex: build_bibtex(type, title, authors, conference, year, url),
      url: url,
      title: title,
      authors: authors,
      journal_or_conference: conference,
      year: year,
      type: type,
  };
}


function retrieve_window_variables(names) {
  var variables = {};

  var script_content = "";
  for (var i = 0; i < names.length; i++) {
    var variable = names[i];
    script_content += "if (typeof " + variable + " !== 'undefined') document.getElementsByTagName('body')[0].setAttribute('tmp_" + variable + "', JSON.stringify(" + variable + "));\n";
  }

  var script = document.createElement('script');
  script.id = 'temporary-script';
  script.appendChild(document.createTextNode(script_content));
  (document.body || document.head || document.documentElement).appendChild(script);

  for (var i = 0; i < names.length; i++) {
    var variable = names[i];
    var body = document.getElementsByTagName('body')[0];
    variables[variable] = JSON.parse(body.getAttribute("tmp_" + variable));
    body.removeAttribute("tmp_" + variable);
  }
  document.getElementById("temporary-script").remove();
  return variables;
}


function ieeexplore() {
  var g = retrieve_window_variables(["global"])["global"];

  var title = g.document.metadata.title;
  var authors = g.document.metadata.authors.map(function(val, index){
    return canonicalize_author(val.name);
  });
  var conference = g.document.metadata.publicationTitle;
  var year = g.document.metadata.publicationYear;
  var url = g.document.metadata.pdfPath;
  var type = get_type(current_url);

  return {
      bibtex: build_bibtex(type, title, authors, conference, year, url),
      url: url,
      title: title,
      authors: authors,
      journal_or_conference: conference,
      year: year,
      type: type,
  };
}


main(current_url);
