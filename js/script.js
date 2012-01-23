/* Author: 

*/

$(document).ready(function(){

  var trapper = {

    vars: [],

    initialize: function(){
      if(this.init){ this.init(); }
    },

    redraw: function(){
      // if (this.update) { this.update(); }
      // for(var i=0; i<this.vars.length; i+=1){
      //   var k = this.vars[i];
      //   $("[data-name='"+k+"']").text(this.get(k))
      // }
    },
    
  }

  // gather all the vars on the page
  _.map( $("var[data-name]", $("#equation")), function(e){
    $el = $(e);
    var name = $el.data("name");
    trapper.vars.push(name);
  })

  // with help from 
  // http://stackoverflow.com/questions/543533/restricting-eval-to-a-narrow-scope
  // and also
  // http://www.yuiblog.com/blog/2006/04/11/with-statement-considered-harmful/
  var scopedEval = function( src, propWhitelist, callback){
    var scope = {};
    for (prop in this){ if (prop !== "console") scope[prop] = undefined; }

    // capture whitelisted properties in scope if defined
    if(propWhitelist !== undefined){
      for (var i=0; i<propWhitelist.length; i+=1){ scope[propWhitelist[i]] = true; }
    }

    // eval in scope
    (new Function( "with(this) { "+ src +"};" )).call(scope);

    // execute callback with scope
    if(propWhitelist !== undefined){
      var callbackScope = {};
      for(var i=0; i<propWhitelist.length; i+=1){
        callbackScope[propWhitelist[i]] = scope[propWhitelist[i]];
      }
    }
    else{
      var callbackScope = $.extend({}, scope)
    }

    // either return the restricted scope the code ran in or it fed through a callback
    return (callback !== undefined) ? callback(callbackScope) : callbackScope;
  }

  var defaultSrc = $("script[type='trapper/script']");
  if (defaultSrc){
    try {
      var scopey = scopedEval(defaultSrc.text(), ["defaults", "update", "init"]);
      if(scopey.defaults){ 
        $.extend(trapper, scopey)
      }
    }
    catch(e) { 
      console.error("omg wtf problem with trapper script")
    }
  }

  var TrapperKeeper = Backbone.Model.extend(trapper);

  binder = new TrapperKeeper;

  var VarView = Backbone.View.extend({ 
    model: binder, 

    initialize: function(){
      if(this.model.update){
        this.model.bind("change", this.render)
      }
    },

    render: function(){
      console.log("render VarView")
      var name = $(this.el).data("name");
      var value = this.model.get(name);
      console.log("render: ", name, value)
      $(this.el).text(value)
      return this;
    }
  });


  var EditableVar = VarView.extend({
    events: {
      "keyup": "saveState",
      "click": "toggleEdit",
    },

    toggleEdit: function(){
      var name = $(this.el).data("name");
      var val = this.model.get(name);
      $(this.el).html($("<input />").attr({'type':"text", 'value':val}));

      var that = this;
      this.$("input").focus().on("blur", function(){ that.saveState(3)})
      console.log("heh")
    },

    saveState: function(evt){
      var name = $(this.el).data("name");
      var val = this.$("input").val();
      var tosave = {};
      tosave[name] = val;

      this.model.set(tosave);
      this.render()
    },

    render: function(){
      console.log("rendertastic!")
      var name = $(this.el).data("name");
      var val = this.model.get(name);
      if (this.$("input:focus").length === 0){
        $(this.el).text(val);
      }
      return this;
    }
  });

  _.map( $("var[data-name]", $("#equation")), function(e){
    var bundle = {el: $(e)};
    if($(e).data("type") === "editable"){
      var inst = new EditableVar( bundle )
    }
    else{
      var inst = new VarView( bundle )
    }
    inst.render()
  })

})





















