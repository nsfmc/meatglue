// Meatglue.js 0.2.1
//
// (c) 2012 Marcos Ojeda, <marcos@khanacademy.org>
// Meatglue may be freely distributed under the MIT license.
// Portions of Meatglue are inspired by Bret Victor's Tangle.js
// For more information, see http://nsfmc.github.com/meatglue/
//
// TODO show-guess support from khan-exercises needs to be added in
// TODO problems that use the same data but over multiple questions
// TODO remove hard dependency on jQuery UI (should use vmouse)
//
// Requires:
//	jQuery 1.7+
//	jQuery UI 1.8.16+
//	Backbone 0.5.3+
//	Underscore 1.2.1+


(function( $ ) {

	var trapper = {

		initialize: function() {
			// run the user-supplied init function
			if (_.isFunction(this.init)) { this.init(); }
		},

		reveal: function(section) {
			// use to reveal a named div with data-section attribute
			var hiddenSection = $(this.problem)
				.find("[data-section=" + section + "]:hidden");
			hiddenSection.show("slow");
		},

		createVars: function(varNames, varType, where) {
			// createVals allows variables of certain types to be created during runtime. 
			// I.e. you pick three vars and the three of them are added to the dom elt
			// that where represents
			$(where).empty();
			for (var i = 0, len = varNames.length; i < len; i += 1) {
				var elt = jQuery("<span>")
					.attr({"data-type": varType, "data-name": varNames[i]})
					.appendTo(where);
				bindMeat(elt, null, this);
			}
		},

		getget: function(varName) {
			// for droppables, their value is the value of the thing dropped on them
			// but maybe you want the value the dropped object represents
			return this.get(this.get(varName));
		},

		inheritExerciseVars: function() {
			// for khan-exercises: absorb all the exercise's variables
			var ev = KhanUtil.tmpl.getVARS();
			this.set(ev);
		}

	};

	// with help from
	// http://stackoverflow.com/questions/543533/restricting-eval-to-a-narrow-scope
	// and also
	// http://www.yuiblog.com/blog/2006/04/11/with-statement-considered-harmful/
	// evaluates some text in the context of an empty scope var
	// TODO document propWhitelist behavior, usage...
	var scopedEval = function(src, propWhitelist, callback) {
		var scope = {};

		// if you normally eval some code in a scope as is done below, if you don't set
		// the values ahead of time they are not kept at the end of execution. This just
		// prepopulates them so that they can live outside of their eval'd scope.
		if (_.isArray(propWhitelist)) {
			for (var i = 0; i < propWhitelist.length; i += 1) {
				scope[propWhitelist[i]] = true;
			}
		}

		// eval in scope
		(new Function("with(this) { " + src + "};")).call(scope);

		var callbackScope = scope;
		// either return the restricted scope the code ran in or it fed through a callback
		return (callback !== undefined) ? callback(callbackScope) : callbackScope;
	}

	// set up the default environment on startup and return the created model
	var initialize = function(problem) {
		// evaluate all the trapper scripts in a protected context
		var defaultSrc = problem.find("script[type='text/meatglue']");

		var whitelisted = _.map(problem.find("[data-onchange]"), function(elt) {
			return $(elt).data("onchange");
		});
		var whitelist = _.union(["defaults", "update", "init"], whitelisted);

		if (defaultSrc) {
			var scope = scopedEval(defaultSrc.html(), whitelist);
			$.extend(trapper, scope);
		}

		// be able to access the problem area
		$.extend(trapper, {problem: problem});

		var MeatBinder = Backbone.Model.extend(trapper);
		return new MeatBinder;

	}

	var VarView = Backbone.View.extend({

		// VarViews are rendered once and when the model is altered they are rendered again
		initialize: function() {
			this.varName = $(this.el).data("name");

			if (_.isFunction(this.render)) {
				this.model.bind("change", this.render, this);
			}
		},

		// a shortcut for grabbing the value
		val: function() {
			return this.model.get(this.varName);
		},

		// abstract this.model.set's behavior and avoid the varname lookup
		save: function(value){
			var attrs = {};
			attrs[this.varName] = value;
			this.model.set(attrs);
			// TODO could call this.update() here, but perhaps that should be opt-in?
		},

		// call the user-defined update function
		update: function(){
			if (_.isFunction(this.model.update)) { this.model.update(); }
		},

		// place the var's value in the span
		render: function() {
			var val = _.isNumber( this.val() ) ? this.val().toString() : this.val();
			$(this.el).text( val || "" );
		}
	});

	var InputVar = VarView.extend({
		// the InputVar won't react to being changed programmatically outside of
		// meatglue i.e. by $("sel input").val(something)

		saveState: function(evt){
			this.save( this.$("input").val() );
			this.update();
		},

		initialize: function(){
			VarView.prototype.initialize.call(this);
			// cross-browserish text input events
			var kbevent = ($.browser.msie ? "keyup paste cut drop" : "input");

			// create the input with any attrs passed in
			var preferredType = $(this.el).data("format")
			$(this.el).html($("<input>", {type: preferredType, value: this.val()}))

			// bind saveState to this context
			var boundSave = _.bind(this.saveState, this)
			this.$("input").bind(kbevent, boundSave);
		},

		render: function(){
			if (this.val() !== this.$("input").val()){
				this.$("input").val( this.val() );
			}
		}
	})

	var BinaryVar = VarView.extend({
		// a BinaryVar tests the truthiness of its variable. If true, it renders
		// the first child span, if false, it renders the second child span.

		initialize: function(){
			VarView.prototype.initialize.call(this);
		},

		render: function(){
			var visIndex = this.val() ? 0 : 1;
			this.$("span").hide(0).eq(visIndex).show(0);
		}
	})

	var EditableVar = VarView.extend({
		events: {
			"keyup": "saveState",
			"click": "toggleEdit"
		},

		toggleEdit: function() {
			$(this.el).html($("<input>").attr({"value": this.val()}));

			var that = this;
			this.$("input").focus().on("blur", function() { that.saveState()});
		},

		saveState: function(evt) {
			var val = this.$("input").val();

			// is it a number?
			// TODO this expects a number but maybe it doesn't need to?
			if (isNaN(Number(val))) {
				// this may be handled otherwise
				$(this.el).addClass("invalid");
			}else {
				$(this.el).removeClass("invalid");
				this.save( Number(val) )
				this.update()
				this.render();
			}
		},

		render: function() {
			if (this.$("input:focus").length === 0) {
				$(this.el).text(this.val());
			}
			return this;
		}
	});

	var SlidableVar = VarView.extend({
		initialize: function() {
			VarView.prototype.initialize.call(this);
			var opts = {"value": this.val(), "view": this};
			var min = $(this.el).data("min")
			if (min) { opts = _.extend( opts, {"min": min} ); }
			var max = $(this.el).data("max")
			if (max) { opts = _.extend( opts, {"max": max} ); }
			$(this.el).slidable( opts );
		},

		render: function(){
			var val = _.isNumber( this.val() ) ? this.val().toString() : this.val();
			$(this.el).text( val );
		}
	});

	var DraggableVar = VarView.extend({
		initialize: function() {
			VarView.prototype.initialize.call(this);

			$(this.el).text(this.varName);
			$(this.el).draggable();
		},
		render: function() {
			// noop
		}
	});

	var DroppableVar = VarView.extend({
		initialize: function() {
			VarView.prototype.initialize.call(this)

			// TODO move this out into a separate constructor
			$(this.el).text(this.varName);
			var that = this;

			var actions = {
				drop: _.bind(this.dropAction, this),
				out: _.bind(this.outAction, this)
			}

			$(this.el).droppable( actions );
		},

		dropAction : function(e, u) {
			// dropping a var onto the droppable causes the target to
			// inherit the value of the droppable
			// TODO remove redundant elements (i.e. dropping a second elements should clear out the first)
			var droppedVar = $(u.draggable).data("name");
			var droppedVal = this.model.get(droppedVar);
			this.save(droppedVar); // save the draggable's varname as the target's value
			this.update();
		},

		outAction : function(e, u) {
			var targetName = this.varName;
			var droppableName = $(u.draggable).data("name");

			// clear out a var if it leaves the target
			if (droppableName === this.val()) {
				this.save(undefined);
				this.update();
			} // else... ignore other droppables flying over this target
		},

		render: function() {
			// noop
		}
	});

	var SelectableVar = VarView.extend({
		// SelectableVars allow you to create a series of checkbox controls and then let you pick n
		// of those values. Use case:
		// pick the values you'd need to solve this equation
		// pick out all variables which are prime
		// it will save, on each click, the value
		events: {
			"change": "render"
		},

		initialize: function() {
			VarView.prototype.initialize.call(this)
			var validator = _.bind(this.doublecheck, this);
			var opts = $(this.el).data("options").split(",");
			var form = $("<form>");
			var that = this;

			_(opts).each(function(elt) {
				var sp = $("<span>");
				var pfx = _.uniqueId("elt");
				var label = $("<label>", {"for": pfx}).text(elt);
				var button = $("<input>", {
					type: "checkbox",
					id: pfx,
					name: elt,
					value: elt
				});
				button.on("click", validator);
				sp.append(label).append(button);
				form.append(sp);
			});

			// attach a change handler to the selectable var via the data-onchange
			var changeHandler = $(this.el).data("onchange");
			if (changeHandler && _.isFunction(this.model[changeHandler])) {
				// make sure the handler runs in the model context
				var onchange = _.bind(this.model[changeHandler], this.model);
				$(this.el).on("postchange", onchange);
			}

			$(this.el).html(form);
		},

		doublecheck: function dc(evt) {
			// simple validation to prevent more checkboxes selected than 
			// specified in the data-max attribute
			if ($(this.el).data("max")) {
				var selected = $(this.el).find("form input:checkbox:checked");
				return (selected.length <= $(this.el).data("max"));
			}
		},

		render: function() {
			var opts = $(this.el).data("options").split(",");
			var inputVal = function(elt) { return $(elt).val(); };
			var checked = _( $(this.el)
					.find("form input:checkbox:checked"))
				.map(inputVal);

			this.save(checked)
			// trigger the data-onchange handler for this control
			$(this.el).trigger("postchange");
			this.update();
			return this;
		}
	});


	// this ka-slidable widget needs to get rewritten because it's basically only usable
	// on the desktop. thankfully there's a lot of prebuilt wiring in $.mobile, so will do that
	$.widget("ka.slidable", $.ui.mouse, {
		_create: function() {
			this._mouseInit();
		},
		destroy: function() {
			this._mouseDestroy();
			$.Widget.prototype.destroy.call(this);
		},

		// defaults at zero, with a min/max of 100
		// make sure these are settable via data-attrs?
		options: { value: 0, min: -100, max: 100, width: 10, view: {} },
		_setOption: function(k, v) {
			$.Widget.prototype._setOption.apply(this, arguments);
		},
		setValue: function(value) {
			if (value >= this.options.min && value <= this.options.max) {
				this.options.value = value;
				this.options.view.save(value);
				this.options.view.update();
			}
		},

		_mouseStart: function(evt) {
			this.clickStart = evt.pageX;
			this.value = this.options.value;
			$("html").addClass("sliding");
		},
		_mouseStop: function() {
			$("html").removeClass("sliding");
		},
		_mouseDrag: function(evt) {
			var apparentValue = Math.floor(this.value + (evt.pageX - this.clickStart) / this.options.width);
			this.setValue(apparentValue);
		}

	});

	var bindMeat = function(elt, binder) {
		var bundle = {el: $(elt), model: binder};
		var type = ($(elt).data("type") || "").toLowerCase();
		var inst;

		switch (type) {
			case "input":
				inst = new InputVar(bundle);
				break;
			case "binary":
				inst = new BinaryVar(bundle);
				break;
			case "editable":
				inst = new EditableVar(bundle);
				break;
			case "slidable":
				inst = new SlidableVar(bundle);
				break;
			case "draggable":
				inst = new DraggableVar(bundle);
				break;
			case "droppable":
				inst = new DroppableVar(bundle);
				break;
			case "selectable":
				inst = new SelectableVar(bundle);
				break;
			default:
				inst = new VarView(bundle);
				break;
		}
		inst.render();
	}


	// this is the default signature of all Khan-Exercises extensions where
	// elts is typically the problem. It represents a jQuery wrapped element
	jQuery.fn["meatglue"] = function(elts, info) {
		// map across all meatglue blocks and assign them their own views
		var scripts = this.length > 0 ? this : jQuery(elts)
		return scripts.each(function(idx, elt){
			prob = $(elt);
			var binder = initialize(prob);
			var bindIt = function(e) { bindMeat(e, binder); }
			_(prob.find("span[data-name]")).each(bindIt);
		})
	}
	jQuery.fn["meatglueLoad"] = jQuery.fn["meatglue"];

})( jQuery );
