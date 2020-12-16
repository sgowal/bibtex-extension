// <h1 class="citation__title">The shading probe: fast appearance acquisition for mobile AR</h1>
// <a id="arnd_4475654242726196_Ctrl" href="javascript:void(0);" aria-controls="arnd_4475654242726196" aria-haspopup="true" class="author-name" title="Dan A. Calian">
// <a id="arnd_4475654242981159_Ctrl" href="javascript:void(0);" aria-controls="arnd_4475654242981159" aria-haspopup="true" class="author-name" title="Kenny Mitchell">
// <span class="epub-section__title">SA '13: SIGGRAPH Asia 2013 Technical Briefs</span>
// <span class="epub-section__date">November 2013  </span>

// https://dl.acm.org/doi/10.1145/3394486.3403181
// <a href="/doi/pdf/10.1145/3394486.3403181" title="PDF" target="_blank" class="btn red"><i class="icon-pdf-file"></i><span>PDF</span></a>

function acm_canonicalize_author(author) {
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


function acm_get_citation(document_root, current_url) {
  var title = document_root.querySelector("h1.citation__title").textContent;

  var authors = [];
  var author_tags = document_root.querySelectorAll("a.author-name");
  for (i = 0; i < author_tags.length; i++) {
    authors.push(acm_canonicalize_author(author_tags[i].title));
  }

  var conference = document_root.querySelector("span.epub-section__title").textContent;

  // Extract year.
  var year = document_root.querySelector("span.epub-section__date").textContent;
  year = year.match(/\d{4}/ig);

  // Use current url.
  re = /^(.*\/)doi\/([^\/]*)\/([^\/]*)$/
  matches = current_url.match(re);
  if (matches === null || matches.length < 2) {
    var pdf_url = current_url;
  } else {
    var pdf_url = matches[1] + "doi/pdf/" + matches[2] + "/" + matches[3];
  }

  return {
      url: pdf_url,
      title: title,
      authors: authors,
      journal_or_conference: conference,
      year: year,
      type: "inproceedings",
      message: "Successfully retrieved citation information.",
  };
}


function acm(current_url) {
  return acm_get_citation(document, current_url);
}


EXTENDED_DOMAINS["https://dl.acm.org/doi/"] = acm;
PDF_DOMAINS["dl.acm.org/doi/"] = [
    /^(.*\/)doi\/pdf\/([^\/]*)\/([^\/]*)$/,
    function (m) {
      return m[1] + "doi/" + m[2] + "/" + m[3];
    },
    acm_get_citation,
];