var _TYPE_MAP = {
  "https://arxiv.org/": "article",
  "https://www.nature.com/": "article",
  "https://science.sciencemag.org/": "article",
  "https://papers.nips.cc/": "incollection",
  "https://distill.pub/": "article",
};

// http://www.roboticsproceedings.org/rss15/p01.html
// http://www.roboticsproceedings.org/rss15/p01.pdf

var _PDF_MAP = {
  "https://www.nature.com/articles/": [
      /^(.*\/)([^\/]*)\.pdf$/,
      function (m) {
        return m[1] + m[2];
      }
  ],
  "https://arxiv.org/pdf/": [
      /^https:\/\/arxiv\.org\/pdf\/([^\/]*)$/,
      function (m) {
        return "https://arxiv.org/abs/" + m[1];
      }
  ],
  "https://openreview.net/pdf?id=": [
      /^https:\/\/openreview\.net\/pdf\?id=([^\/]*)$/,
      function (m) {
        return "https://openreview.net/forum?id=" + m[1];
      }
  ],
  "https://papers.nips.cc/paper/": [
      /^(.*\/)([^\/]*)\.pdf$/,
      function (m) {
        return m[1] + m[2];
      }
  ],
  "https://science.sciencemag.org/content/": [
      /^(https:\/\/science\.sciencemag\.org\/content\/)([^\/]*)\/(.*)\.full\.pdf$/,
      function (m) {
        return m[1] + m[3];
      }
  ],
  "http://www.roboticsproceedings.org/": [
      /^(.*\/)([^\/]*)\.pdf$/,
      function (m) {
        return m[1] + m[2] + ".html";
      }
  ],
}


function pdf_redirect_url(url) {
  var re = null;
  var fn = null;
  for (var url_start in _PDF_MAP) {
    if (url.startsWith(url_start)) {
      re = _PDF_MAP[url_start][0];
      fn = _PDF_MAP[url_start][1];
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


function main(url) {
  var error_message = "Unable to find any papers on\n" + url + ".";
  var redirect_url = pdf_redirect_url(url);
  if (redirect_url === null) {
    data = get_citation(document);
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
        data = get_citation(document_root);
        if (data === null) {
          error(error_message);
        } else {
          reply(data);
        }
      } else {
        error(error_message);
      }
    };
    request.open("GET", redirect_url, true);
    request.send();
  }
}


function useful_word(word) {
  return !(["a", "an", "the"].includes(word.toLowerCase()));
}

function get_citation(document_root) {
  var x = document_root.querySelectorAll("meta[name]");
  var i;

  var authors = [];
  var year = "unknown";
  var title = "unknown";
  var arxiv_id = "unknown";
  var url = "unknown";
  var conference = "unknown";

  for (i = 0; i < x.length; i++) {
    var name = x[i].name;
    var content = x[i].content;

    if (name == "citation_title") {
      title = content;
    } else if (name == "citation_author") {
      tokens = content.split(", ")
      if (tokens.length == 1) {
        tokens = content.split(" ")
        if (tokens.length >= 2) {
          content = tokens[tokens.length - 1] + ", ";
          tokens.pop();
          content += tokens.map(function(val, index){ 
            if (val.endsWith(".")) {
              return val.substring(0, val.length - 1)
            }
            return val; 
          }).join(" ");
        }
      }
      authors.push(content);
    } else if (name == "citation_publication_date") {
      year = content.split('/')[0];
    } else if (name == "citation_date") {
      year = content.split('/')[0];
    } else if (name == "citation_online_date" && year == "unknown") {
      year = content.split('/')[0];
    } else if (name == "citation_arxiv_id") {
      arxiv_id = content;
    } else if (name == "citation_pdf_url") {
      if (content.startsWith("http")) {
        url = content;
      } else {
        var arr = current_url.split("/");
        arr.pop();
        url = arr.join("/") + "/" + content;
      }
    } else if (name == "citation_fulltext_html_url" && url == "unknown") {
      url = content;
    } else if (name == "citation_conference_title") {
      conference = content;
    } else if (name == "citation_journal_title") {
      conference = content;
    }
  }

  if (title == "unknown") {
    return null;
  }

  var first_author = authors[0].split(", ")[0].toLowerCase();
  var first_word = title.split(" ").filter(useful_word)[0].toLowerCase();
  first_word = first_word.replace("-", "");
  first_word = first_word.replace(":", "");
  var authors_string = authors.join(" and ");

  var type = null;
  for (var url_start in _TYPE_MAP) {
    if (current_url.startsWith(url_start)) {
      type = _TYPE_MAP[url_start];
      break;
    }
  }
  if (type === null) {
    type = "inproceedings";
  }

  var bibtex = "@" + type + "{";
  var is_article = type == "article";
  bibtex += first_author + year + first_word + ",\n";
  if (title != "unknown") {
    bibtex += "  title={" + title + "},\n";
  }
  if (authors_string !== "") {
    bibtex += "  author={" + authors_string + "},\n";
  }
  if (arxiv_id != "unknown") {
    bibtex += "  journal={arXiv preprint arXiv:" + arxiv_id + "},\n";
  } else if (conference != "unknown") {
    if (is_article) {
      bibtex += "  journal={" + conference + "},\n";
    } else {
      bibtex += "  booktitle={" + conference + "},\n";
    }
  }
  if (year != "unknown") {
    bibtex += "  year={" + year + "},\n";
  }
  if (url != "unknown") {
    bibtex += "  url={" + url + "}\n";
  }
  bibtex += "}";

  return {
      bibtex: bibtex,
      url: url,
      title: title,
  };
}

main(current_url);