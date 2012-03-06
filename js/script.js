
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

  $(".nondemocode code").each(function( i, e){
    $(e).html( dedent( $(e).html() ))
  })

  // apply syntax highlighting ( will probably switch this later, but i'm a sucker
  // for solarized )
  $(".codesnippets pre code, .nondemocode code").each(function(i,e){ hljs.highlightBlock(e, '  '); })

  // actually eval meatglue scripts for each given meatglue block
  // $(".meatglue").meatglueLoad()
  $.fn.meatglueLoad( $(".meatglue") )

  // prettify the header
  var historify = function(){
    $("header h1:gt(0)").remove();
    $("h1").each(function(i,e){
      var otherFonts =  _(
        _.shuffle(["one", "seventeen", "thirteen", "eleven", "six"]))
        .first(3);

      var colours = _.first(
        _("orange, pink, yelloworange".split(",")).shuffle(),
        3)

      _(otherFonts).each(function(elt, idx){
        var dup = $(e).clone().addClass( elt+" "+colours[idx] );
        $("header").append(dup)
      });
    })
  }
  $("header").on("click", historify)
  historify();


})
