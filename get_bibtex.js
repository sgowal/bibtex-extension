function usefulWord(word) {
  return !(["a", "an", "the"].includes(word.toLowerCase()));
}

function DOMtoBibtex(document_root) {
  if (current_url.startsWith("https://arxiv.org/pdf/")) {
    var request = new XMLHttpRequest();
    var tokens = current_url.split("/")
    var arxiv_id = tokens[tokens.length - 1]
    request.open("GET", "https://arxiv.org/abs/" + arxiv_id, false);
    request.send(null);
    if (request.status === 200) {
      parser = new DOMParser();
      document_root = parser.parseFromString(request.responseText, "text/html");
      console.log(document_root);
    } else {
      return {
          bibtex: "Unable to find any papers on this page.",
          url: "",
          title: "",
      };
    }
  } else if (current_url.startsWith("https://openreview.net/pdf?id=")) {
    var request = new XMLHttpRequest();
    var tokens = current_url.split("=")
    var openreview_id = tokens[tokens.length - 1]
    request.open("GET", "https://openreview.net/forum?id=" + openreview_id, false);
    request.send(null);
    if (request.status === 200) {
      parser = new DOMParser();
      document_root = parser.parseFromString(request.responseText, "text/html");
      console.log(document_root);
    } else {
      return {
          bibtex: "Unable to find any papers on this page.",
          url: "",
          title: "",
      };
    }
  }

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
      if (!url.startsWith("http")) {
        var arr = current_url.split("/");
        arr.pop();
        url = arr.join("/") + "/" + content;
      } else {
        url = content;
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
    return {
        bibtex: "Unable to find any papers on this page.",
        url: "",
        title: "",
    };
  }

  var first_author = authors[0].split(", ")[0].toLowerCase();
  var first_word = title.split(" ").filter(usefulWord)[0].toLowerCase();
  first_word = first_word.replace("-", "");
  first_word = first_word.replace(":", "");
  var authors_string = authors.join(" and ");

  var bibtex = "@";
  var is_article = false;
  if (arxiv_id != "unknown") {
    bibtex += "article{";
    is_article = true;
  } else if (current_url.startsWith("https://papers.nips.cc/paper/")) {
    bibtex += "incollection{";
  } else if (current_url.startsWith("https://distill.pub/")) {
    bibtex += "article{";
    is_article = true;
  } else {
    bibtex += "inproceedings{";
  }
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

chrome.runtime.sendMessage({
  action: "getBibtex",
  data: DOMtoBibtex(document)
});
