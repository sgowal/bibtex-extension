function bibtex_build(type, title, authors, journal_or_conference, year, pdf_url, current_url) {
  var first_author = authors[0].split(", ")[0].toLowerCase();
  var first_word = title.split(" ").filter(bibtex_useful_word)[0].toLowerCase();
  first_word = first_word.replace(/-/g, "");
  first_word = first_word.replace(/:/g, "");
  first_word = first_word.replace(/\+/g, "");
  var authors_string = authors.join(" and ");

  var bibtex = "@" + type + "{";
  var is_article = type == "article";
  bibtex += first_author.replace(/ /g, "") + year + first_word + ",\n";
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


function bibtex_useful_word(word) {
  return !(["a", "an", "the", "on", "is", "are"].includes(word.toLowerCase()));
}
