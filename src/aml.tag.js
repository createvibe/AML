/**
 * (AML) Asynchronous Markup Language
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 */
var AML = (function(AML) {

	// member names that cannot be overloaded
	var noInherits = [
		'_super', '_construct', '_abstract', '_options', 'async', 'attributes',
		'isAbstract', 'processAttribute', 'processAttributes', 'render',
		'abstract', 'attr'
	];

	/**
	 * The AML Tag Class
	 *
	 * @param {String} name The name of the tag to register
	 * @param {Object} options The options object hash
	 * @constructor
	 */
	AML.Tag = function Tag(name, options) {

		// save the name
		this.name = name;

		// apply options
		this.applyOptions(options);

		// apply custom constructor
		if (typeof this._options.construct === 'function') {

			this._options.construct.apply(this, arguments);

		} else if (this._extends && typeof this._extends.construct === 'function') {

			this._extends.construct.apply(this, arguments);
		}

	};

	/**
	 * If this Tag extends another, _super holds the Tag reference of the parent Tag
	 *
	 * @type {AML.Tag|null}
	 */
	AML.Tag.prototype._super = null;

	/**
	 * The _super.options hash (if any) so that you can say this._extends.func.apply instead of this._super._options.func.apply
	 * @type {null}
	 * @private
	 */
	AML.Tag.prototype._extends = null;

	/**
	 * If specified in options, _construct holds the custom Constructor
	 *
	 * @type {Function}
	 */
	AML.Tag.prototype._construct = null;

	/**
	 * Know if this is an abstract class - abstract classes cannot be applied to nodes, only extended
	 *
	 * @type {Boolean}
	 */
	AML.Tag.prototype._abstract = false;

	/**
	 * Hang on to the options that were passed to this tag (for inheritance)
	 *
	 * @type {Object}
	 */
	AML.Tag.prototype._options = null;

	/**
	 * Boolean flag specifying whether or not this tag renders asynchronously
	 *
	 * @type {Boolean}
	 */
	AML.Tag.prototype.async = false;

	/**
	 * The AML Tag Name
	 *
	 * @type {String}
	 */
	AML.Tag.prototype.name = null;

	/**
	 * Attributes that this tag accepts
	 *
	 * @type {AML.Tag.Attribute[]}
	 */
	AML.Tag.prototype.attributes = [];

	/**
	 * Apply options to this tag
	 *
	 * @param {Object} options The options object hash
	 * @returns {void}
	 * @throws Error
	 */
	AML.Tag.prototype.applyOptions = function(options) {

		/*if (this._options) {
			throw new Error('Options have already been applied to tag ' + this.name);
		}*/

		if (!(options instanceof Object)) {
			return;
		}

		var i,
			m,
			n,
			len,
			inherits;

		// extend a parent tag (if we haven't already)
		if (options.inherits !== undefined) {

			if (!Array.isArray(options.inherits)) {
				options.inherits = [options.inherits];
			}

			len = options.inherits.length;
			for (i = 0; i < len; i++) {
				if (AML.tagExists(options.inherits[i])) {

					inherits = AML.getTagByName(options.inherits[i]);
					if (inherits._options) {
						for (m in inherits._options) {
							if (['abstract','async'].indexOf(m) === -1) {

								if (typeof options[m] === 'undefined') {

									options[m] = inherits._options[m];

								} else if (inherits._options[m] instanceof Object) {

									for (n in inherits._options[m]) {
										if (typeof options[m][n] === 'undefined') {
											options[m][n] = inherits._options[m][n];
										}
									}
								}
							}
						}
					}
					
					if (!this._super) {
						// NOTE: super is the first parent found
						this._super = inherits;
						this._extends = inherits._options || {};
					}
				}
			}
		}
		
		// abstract classes
		if (options.abstract !== undefined) {
			this._abstract = !!options.abstract;
		} else {
			options._abstract = false;
		}

		// mark this tag as asynchronous
		if (options.async !== undefined) {
			this.async = !!options.async;
		}

		// add Tag Attributes provided in the option hash
		if (options.attr instanceof Object) {

			for (m in options.attr) {
				this.attr(m, options.attr[m]);
			}

		} else if (Array.isArray(options.attr)) {

			len = options.attr.length;
			for (i = 0; i < len; i++) {
				this.attr(options.attr[i].name, options.attr[i]);
			}

		}

		// user defined properties and methods
		for (m in options) {
			if (noInherits.indexOf(m) === -1) {
				if (typeof this[m] === 'undefined') {

					if (typeof options[m] === 'function') {

						this[m] = options[m].bind(this);

					} else {

						this[m] = options[m];
					}

				} else if (options[m] instanceof Object) {

					for (n in options[m]) {
						if (typeof this[m][n] === 'undefined') {
							this[m][n] = options[m][n];
						}
					}

				}
			}
		}

		// save the options
		this._options = options;
	};
	
	/**
	 * See if this Tag is abstract
	 *
	 * @return {Boolean}
	 */
	AML.Tag.prototype.isAbstract = function() {
		return !!this._abstract;
	};
	
	/**
	 * Associate an attribute with this tag
	 *
	 * @param {String} name The attribute name or prefix
	 * @param {Object} options The options object hash
	 * @return {Object} self
	 */
	AML.Tag.prototype.attr = function(name, options) {
		this.attributes.push(new AML.Attribute(name, options));
		return this;
	};
	
	/**
	 * Process an attribute against this Tag
	 *
	 * @param {Element} el The HTML Element associated with this Tag
	 * @param {Tag.Attribute} attribute The Attribute associated with this Tag (or fake object for default values with keys name and value)
	 * @param {*} elAttr The HTML Element's matching attribute 
	 * @param {*} filtered The filtered value for this element's matching attribute
	 * @param {Function} cb The callback function for asynchronous operations
	 * @return {void}
	 */
	AML.Tag.prototype.processAttribute = function(el, attribute, elAttr, filtered, cb) {
		if (typeof this._options.processAttribute === 'function') {

			this._options.processAttribute.apply(this, arguments);

		} else if (typeof cb === 'function') {

			cb();
		}
	};
	
	/**
	 * Process and walk associated attributes on an HTML Element 
	 *
	 * @param {Element} el The HTML Element to process
	 * @param {Function} cb The Callback function
	 * @return {void}
	 */
	AML.Tag.prototype.processAttributes = function(el, callback) {

		var i ,
			x ,
			attribute ,
			found = [] ,
			calls = [] ,
			self = this ,
			len = this.attributes.length;
		
		var pushAttr = function(attr, elAttr) {

			attr.value = elAttr.value;

			var filtered = attr.filter(elAttr.value);

			calls.push(function(cb) {
				async.series([

					// call custom process on attribute
					function(cb2) {
						if (typeof attr.process === 'function') {
							attr.process(self, el, elAttr, filtered, cb2);
						} else {
							cb2();
						}
					} ,

					// call custom processor on Tag instance
					function(cb2) {
						self.processAttribute(el, attr, elAttr, filtered, cb2);
					}

				], function() {
					// finished with this attribute
					cb();
				});
			});
		};
		
		for (i in el.attributes) {
		
			attribute = el.attributes[i];
		
			if (!attribute.name || attribute.name === AML.prefix + '-' + this.name) {
				continue;
			}
			
			for (x = 0; x < len; x++) {
				if (attribute.name.indexOf(this.attributes[x].name) === 0) {

					// allow for boolean attributes
					if (attribute.value.toString().length === 0) {
						attribute.value = true;
					}

					// add this attribute to the processing calls
					pushAttr(this.attributes[x], attribute);

					// mark this attribute as found
					found.push(this.attributes[x].name);
					break;

				}
			}
		}
		
		// check default values for attributes not on the element
		for (x = 0; x < len; x++) {
			if (!this.attributes[x].prefix && 
				this.attributes[x].default !== null && 
				this.attributes[x].default !== undefined &&
				found.indexOf(this.attributes[x].name) === -1) {
				
				// process for default value
				pushAttr(this.attributes[x], {name: this.attributes[x].name, value: this.attributes[x].default});
			}
		}
		
		// process all of the applicable attributes that we found
		async.parallel(calls, function() {
			
			// finished processing attributes
			if (typeof callback === 'function') {
				callback();
			}

		});
	};

	/**
	 * Render this tag
	 * 
	 * @param {Element} el The HTML Element attached to the tag
	 * @param {String} template The HTML Template to render inside the node
	 * @param {Function} callback The callback function
	 * @return {*}
	 */
	AML.Tag.prototype.render = function(el, template, callback) {

		var self = this;

		this.processAttributes(el, function() {
			if (typeof self._options.render === 'function') {

				self._options.render.apply(self, [el, template, callback]);

			} else if (self._extends && typeof self._extends.render === 'function') {

				self._extends.render.apply(self, [el, template, callback]);

			} else {

				el.innerHTML = '';
				
				if (typeof callback === 'function') {
					callback();
				}

			}
		});		

	};

	return AML;
}(AML || {}));