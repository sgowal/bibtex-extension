function ieeexplore_retrieve_window_variables(names) {
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


function ieeexplore(current_url) {
  var g = ieeexplore_retrieve_window_variables(["xplGlobal"])["xplGlobal"];

  var title = g.document.metadata.title;
  var authors = g.document.metadata.authors.map(function(val, index){
    return canonicalize_author(val.name);
  });
  var conference = g.document.metadata.publicationTitle;
  var year = g.document.metadata.publicationYear;
  var url = g.document.metadata.pdfPath;
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


EXTENDED_DOMAINS["https://ieeexplore.ieee.org/document/"] = ieeexplore;
