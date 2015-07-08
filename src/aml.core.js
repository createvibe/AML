var AML = (function(AML) {
	
	/**
	 * The current version
	 *
	 * @type {String}
	 */
    AML.VERSION = "0.0.1";

	/**
	 * The prefix to use for tags
	 * 
	 * @type {String}
	 * @private
	 */
	AML._prefix = 'aml';

	/**
	 * Array of registered tags
	 * 
	 * @type {AML.Tag[]} 
	 */
	AML.tags = [];
	
	/**
	 * Array of registered tag names
	 *
	 * @type {String[]}
	 */
	AML.tagNames = [];
	
	/**
	 * Array of registered nodes matching registered tags
	 *
	 * @type {AML.Node[]}
	 */
	AML.nodes = [];
	
	/**
	 * Global template params
	 *
	 * @type {Object}
	 */
	AML.params = {};
	
	/**
	 * The prefix getter / setter
	 * 
	 * @type {String}
	 */
	Object.defineProperty(AML, 'prefix', {
		get: function() {
			return AML._prefix;
		} ,
		set: function(value) {
			// do nothing if the value is the same
			if (value === AML._prefix) {
				return;
			}
			
			// change the prefix
			var oldPrefix = AML._prefix;
			AML._prefix = value;
			
			// update registered tag names
			AML.tagNames = [];
			for (var i = 0, len = AML.tags.length; i < len; i++) {
				AML.tagNames.push(AML.prefix + '-' + AML.tags[i].name);
			}
		}
	});

	/**
	 * For deferring return objects on asynchronous operations
	 * 
	 * @type {Function}
	 * @return {{resolve: {Function}, reject: {Function}, promise: {{then: {Function}, fail: {Function}}}}}
	 */
	AML.defer = function defer() {
		var resolved = false;
		var rejected = false;
		var args = null;
		var success = null;
		var err = null;
		return {
			resolve: function() {
				if (!resolved) {
					if (typeof success === 'function') {
						success.apply(success, arguments);
					} else {
						args = arguments;
					}
					resolved = true;
				}
			} ,
			reject: function(e) {
				if (!rejected) {
					if (typeof err === 'function') {
						if (!(e instanceof Error)) {
							e = new Error(e);
						}
						err(e);
					} else {
						args = arguments;
					}
					rejected = true;
				}
			} ,
			promise: {
				then: function(cb) {
					if (resolved) {
						cb.apply(cb, args || []);
						return this;
					}
					if (rejected) {
						return this;
					}
					if (success) {
						throw new Error("Success callback already set");
					}
					success = cb;
					return this;
				} ,
				fail: function(cb) {
					if (rejected) {
						cb.apply(cb, args || []);
						return this;
					}
					if (resolved) {
						return this;
					}
					if (err) {
						throw new Error('Error callback already set');
					}
					err = cb;
					return this;
				}
			}
		};
	};
	
	/**
	 * Provide a way to extend the core AML namespace
	 * 
	 * @param {Function} fn A function that accepts AML as a parameter
	 * @return {void}
	 */
	AML.extend = function(fn) {
		fn(AML);
	};
	
	/**
	 * Register a new tag
	 * 
	 * @param {String} name The name of the tag you are registering
	 * @param {Object} options The options object hash, for tag options
	 * @return {Object} self
	 * @throws Error
	 */
	AML.registerTag = function(name, options) {
 		var tagName = AML.prefix + '-' + name;
		if (AML.tagExists(tagName)) {
			throw new Error('Tag name ' + name + ' is already registered');
		}
		
		var tag = new AML.Tag(name, options);

		AML.tags.push(tag);
		AML.tagNames.push(tagName);

		return this;
	};
	
	/**
	 * See if a tag exists (has been registered) by name
	 *
	 * @param {String} name The tag name
	 * @return {Boolean}
	 */
	AML.tagExists = function(name) {
		return (AML.tagNames.indexOf(AML.prefix + '-' + name) > -1);
	};
	
	/**
	 * Get a registered Tag by its name
	 *
	 * @param {String} name The tag name
	 * @return {String|null}
	 */
	AML.getTagByName = function(name) {
		var i ,
			len = AML.tags.length;
		
		for (i = 0; i < len; i++) {
			if (AML.tags[i].name === name) {
				return AML.tags[i];
			}
		}
		
		return null;
	};
	
	/**
	 * Register an HTML Element DOM node
	 *
	 * @param {Element} amlNode
	 * @return {Object} self
	 */
	AML.registerNode = function(amlNode) {
		AML.nodes.push(amlNode);
		return this;
	};

	/**
	 * Get a query selector to find all register tags in the DOM
	 * @returns {String}
	 */
	AML.getQuerySelector = function() {
		var i ,
			names = [] ,
			len = this.tags.length;

		for (i = 0; i < len; i++) {
			if (!this.tags[i].isAbstract()) {
				names.push(AML.prefix + '-' + this.tags[i].name);
			}
		}

		return names.join(',') + ',[' + names.join('],[') + ']';
	};
	
	/**
	 * Register an HTML Element DOM node
	 *
	 * @param {Element} domNode
	 * @return {Object} self
	 */
	AML.registerDOMNode = function(domNode) {
		if (domNode && !domNode.getAttribute(AML.prefix + '-registered')) {

			for (var i = 0, len = AML.nodes.length; i < len; i++) {
				if (AML.nodes[i].el === domNode) {
					return this;
				}
			}
		
			AML.nodes.push(new AML.Node(domNode));

		}
		return this;
	};
	
	/**
	 * Register DOM nodes
	 *
	 * @return {Object} self
	 */
	AML.registerDOMNodes = function() {
		var nodes = document.querySelectorAll(this.getQuerySelector());
		for (var i = 0, len = nodes.length; i < len; i++) {
			AML.registerDOMNode(nodes[i]);
		}
		return this;
	};
	
	/**
	 * Compile an html template
	 *
	 * @param {Object} hash The object hash for the compiler
	 * @return {*} The compiled template
	 */
	AML.compileTemplate = function(hash) {
		return twig(hash);
	};

	/**
	 * Compile and render a template
	 * @param {String} template The template to compile
	 * @param {Object|undefined} data The data to send to the template
	 * @returns {String}
	 */
	AML.renderTemplate = function(template, data) {
		return this.compileTemplate({data: template || ''}).render(data || {});
	};
	
	/**
	 * Parse an html template (from a tag)
	 * 
	 * @param {String} template The html template to parse
	 * @param {Object} data The data context for the template
	 * @return {String}
	 */
	AML.parseTemplate = function(template, data) {
		if (!data) {
			data = AML.params;
		} else {
			for (var m in AML.params) {
				if (!data[m]) {
					data[m] = AML.params[m];
				}
			}
		}
		template = template.replace(new RegExp('<img(.*?)' + this._prefix + '\-src=', 'gmi'), '<img$1src=');
		template = template.replace(new RegExp('background:(.*?)' + this._prefix + '\\-url\\(', 'gmi'), 'background:$1url(');
		template = template.replace(new RegExp('background\-image:\\s*' + this._prefix + '\\-url\\(', 'gmi'), 'background-image: url(');
		return this.renderTemplate(template, data);
	};
	
	/**
	 * Render all registered nodes
	 *
	 * @param {Function} cb The callback to execute when all nodes have rendered
	 * @return {void}
	 */
	AML.renderNodes = function(cb) {
		var calls = [];
		AML.nodes.forEach(function(node, idx) {
			calls.push(function(callback) {
				node.render(callback);
			});
		});
		async.parallel(calls, function(err) {
			if (typeof cb === 'function') {
				if (err) {
					cb(err);
				} else {
					cb();
				}
			}
		});
	};
	
	/**
	 * Exports are what get exposed as window.AML (must be included after core)
	 *
	 * @type {Object}
	 */
	AML.exports = {
		VERSION: AML.VERSION ,
		
		defer: AML.defer ,
		
		extend: AML.extend ,
		
		registerTag: AML.registerTag ,

		getQuerySelector: AML.getQuerySelector ,

		registerNode: AML.registerNode ,
		registerDOMNode: AML.registerDOMNode ,
		registerDOMNodes: AML.registerDOMNodes ,
		
		renderNodes: AML.renderNodes ,
		
		compileTemplate: AML.compileTemplate ,
		parseTemplate: AML.parseTemplate 
	};

	return AML;
	
}(AML || {}));