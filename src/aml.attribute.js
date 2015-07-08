/**
 * (AML) Asynchronous Markup Language
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 */
var AML = (function(AML) {
	
	/**
	 * The AML Tag Attribute Class
	 * 
	 * @param {String} name The attribute name
	 * @param {Object|undefined} options The options hash
	 * @constructor
	 */
	AML.Attribute = function Attribute(name, options) {
		if (!(options instanceof Object)) {
			options = {};
		}
		if (options.required !== undefined) {
			this.required = !!options.required;
		}
		if (options.type !== undefined) {
			this.type = options.type;
		}
		if (options.prefix !== undefined) {
			this.prefix = !!options.prefix;
		}
		if (options.default !== undefined) {
			this.default = this.filter(options.default);
		}
		this.name = name;
	};
	
	// type constants also exported
	AML.Attribute.TYPE_STRING = AML.exports.ATTR_TYPE_STRING = 'string';
	AML.Attribute.TYPE_NUMBER = AML.exports.ATTR_TYPE_NUMBER = 'number';
	AML.Attribute.TYPE_BOOLEAN = AML.exports.ATTR_TYPE_BOOLEAN = 'boolean';
	AML.Attribute.TYPE_JSON = AML.exports.ATTR_TYPE_JSON = 'json';
	AML.Attribute.TYPE_STRING_JSON = AML.exports.ATTR_TYPE_STRING_JSON = 'string|json';
	
	/**
	 * The attribute name (or suffix)
	 *
	 * @param {String}
	 */
	AML.Attribute.prototype.name = null;
	
	/**
	 * The attribute type
	 *
	 * @param {String} Value from to Attribute TYPE_ constants
	 */
	AML.Attribute.prototype.type = AML.Attribute.TYPE_STRING;
	
	/**
	 * Know if the attribute name is only a prefix that allows multiple values "prefix-<any value>"
	 *
	 * @param {Boolean}
	 */
	AML.Attribute.prototype.prefix = false;
	
	/**
	 * Know if this attribute is required on the associated tag or not
	 * 
	 * @param {Boolean}
	 */
	AML.Attribute.prototype.required = false;
	
	/**
	 * The default value for this attribute, if not specified
	 *
	 * @param {String|Number|Boolean}
	 */
	AML.Attribute.prototype.default = null;
	
	/**
	 * Filter the attribute value based on its type
	 *
	 * @param {*} data
	 * @return {*}
	 */
	AML.Attribute.prototype.filter = function(data) {
		if (data === undefined || data === null) {
			data = this.default;
		}
		switch (this.type) {
			case AML.Attribute.TYPE_STRING :
				return data + '';
			
			case AML.Attribute.TYPE_NUMBER :
				return parseInt(data, 10);
			
			case AML.Attribute.TYPE_FLOAT :
				return parseFloat(data);
			
			case AML.Attribute.TYPE_STRING_JSON :
				try {
					return JSON.parse(data);
				} catch (e) {
					return data + '';
				}
			
			case AML.Attribute.TYPE_JSON :
				return JSON.parse(data);
				
			case AML.Attribute.TYPE_BOOLEAN :
				return !!data;
		}
		return data;
	};
	
	/**
	 * Get the suffix for this tag (returns the name with prefix stripped off)
	 * 
	 * @return {String}
	 */
	AML.Attribute.prototype.getSuffix = function(name) {
		if (!name) {
			name = this.name;
		}
		if (this.prefix) {
			return name.replace(this.prefix, '');
		}
		return name;
	};
	
	/**
	 * The Tag / HTML Element to process attributes on
	 *
	 * @param {AML.Tag} tag The AML Tag
	 * @param {Element} el The HTML Element we are processing
	 * @param {*} elAttr The HTML Element's Attribute representing this attribute
	 * @param {*} filtered The filtered value for this element's matching attribute
	 * @param {Function} cb The callback to execute
	 * @return {Object} self
	 */
	AML.Attribute.prototype.process = function(tag, el, elAttr, filtered, cb) {
		if (typeof cb === 'function') {
			cb();
		}
		return this;
	};

	return AML;
}(AML || {}));