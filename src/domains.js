var EXTENDED_DOMAINS = {};


var DOMAIN_TYPES = {
  "arxiv.org/": "article",
  "www.medrxiv.org/": "article",
  "www.biorxiv.org/": "article",
  "science.sciencemag.org/": "article",
  "papers.nips.cc/": "incollection",
  "distill.pub/": "article",
};


var PDF_DOMAINS = {
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
