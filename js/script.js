
// dedent a block of text so that everything starts at least 0 spaces from the
// start of the line (but retain actual indenting inside the block)
var dedent = function( somecode ){
  var pieced = somecode.split("\n");
  var testre = /^(\s*)/gm;

  var spacey = /^(\s*)\S*/;
  var defaultindent = _(pieced)
    .map( function(line){ return spacey.exec(line); } )
    .filter(function(match){ return match[0].length !== match[1].length; })
    .map(function(match){ return match[1].length })
  var minIndent = _(defaultindent).min()
  cutitout = new RegExp("^\\s{"+minIndent+"}","gm")
  somecode = $.trim(somecode).replace(cutitout, "")
  return somecode;
}

$(document).ready(function(){
// for each meatglue block, gather the documentation and append it to 
// the codesnippets div
  $(".example").each(function(i,e){
    var demoblock = $(e);

    var codeholder = $("<div>",{class:"codesnippets"});

    // grab code in each block, dedent it, and add to the pre
    demoblock.find(".demo").each(function( idx, elt ){
      var somecode = dedent( $(elt).html() );
      var snippet = $("<pre>").append($("<code>").text( somecode ))
      codeholder.append(snippet)
    })
    demoblock.append(codeholder);
  })

  // apply syntax highlighting ( will probably switch this later, but i'm a sucker
  // for solarized )
  $(".codesnippets pre code").each(function(i,e){ hljs.highlightBlock(e, '  '); })

  // actually eval meatglue scripts for each given meatglue block
  $.fn.meatglueLoad( $(".meatglue") )

  // prettify the header
  $("h1").each(function(i,e){
    // var otherFonts = $(e).data("overlay").split(",");
    var otherFonts =  _(
	  _.shuffle(["one", "seventeen", "thirteen", "eleven", "six"]))
	.first(3); 
    var colours = _.first(
      _(["bluegreen", "orange", "pink", "green", "blue"]).shuffle(),
      3)
    _(otherFonts).each(function(elt, idx){
      var dup = $(e).clone().addClass( elt+" "+colours[idx] );
      $("header").append(dup)
    });
  })

})
