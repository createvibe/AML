/**
 * (AML) Asynchronous Markup Language
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 */
var AML = (function(AML) {

	/**
	 * A registered node, matching a tag
	 *
	 * @param {Element} el HTML Element
	 * @param {String|undefined} template Optional HTML Template, otherwise it's taken from the node's innerHTML
	 * @constructor
	 */
	AML.Node = function Node(el, template) {
		this.el = el;
		if (template) {
			this.template = template;
		} else {
			var i,
				str = '' ,
				len = el.childNodes.length;

			for (i = 0; i < len; i++) {
				switch (el.childNodes[i].nodeType) {
					case 3 :
						str += el.childNodes[i].nodeValue;
						break;

					default:
						str += el.childNodes[i].outerHTML;
						break;
				}
			}

			this.template = str;
		}
		this.initTag();
		el.innerHTML = '';
		if (el.hasAttribute(AML.prefix + '-rendered')) {
			this._rendered = !!el.getAttribute(AML.prefix + '-rendered');
		}
		el.setAttribute(AML.prefix + '-registered', true);
	};
	
	/**
	 * Know if this node is already rendered
	 *
	 * @param {Boolean}
	 */
	AML.Node.prototype._rendered = false;
	
	/**
	 * The HTML Element attached to this Node
	 *
	 * @param {Element}
	 */
	AML.Node.prototype.el = null;
	
	/**
	 * The matching tag for this node
	 *
	 * @type {AML.Tag|null}
	 */
	AML.Node.prototype.tag = null;
	
	/**
	 * The template to render inside this node
	 *
	 * @type {String}
	 */
	AML.Node.prototype.template = null;
	
	/**
	 * See if this node has been rendered
	 *
	 * @return {Boolean}
	 */
	AML.Node.prototype.isRendered = function() {
		return !!this._rendered;
	};
	
	/**
	 * Initialize the tag that matches this node
	 * 
	 * @return {void}
	 * @throws Error
	 */
	AML.Node.prototype.initTag = function() {
		if (!this.el) {
			return;
		}
		
		var i , 
			m ,
			attribute ,
			tag = null ,
			len = AML.tags.length ,
			tagName = this.el.tagName.toLowerCase();
		
		for (i = 0; i < len; i++) {
			if (AML.prefix + '-' + AML.tags[i].name === tagName) {
				tag = AML.tags[i];
				break;
			}
			if (this.el.hasAttribute(tagName)) {
				tag = AML.tags[i];
				break;
			}
		}
		
		if (!tag) {
			// see if prefix-tagName is in the element attributes
			for (m in this.el.attributes) {
				attribute = this.el.attributes[m];
				if (attribute.name && attribute.name.indexOf(AML.prefix) === 0) {
					// found something that matches, see if the tag is registered
					for (i = 0; i < len; i++) {
						if (AML.prefix + '-' + AML.tags[i].name === attribute.name) {
							// found a registered tag matching an attribute
							tag = AML.tags[i];
							break;
						}
					}
					if (tag) {
						break;
					}
				}
			}
			if (!tag) {
				throw new Error('Invalid Tag Name: ' + tagName);
			}
		}
		
		if (tag.isAbstract()) {
			throw new Error('Tag Is Abstract: ' + AML.prefix + '-' + tag.name);
		}
		
		this.tag = tag;
	};
	
	/**
	 * Render this node with a callback
	 * 
	 * @param {Function} cb The callback to run after the node is rendered
	 */ 
	AML.Node.prototype.render = function(cb) {
		if (!this.tag || this.isRendered()) {
			cb();
		}
		this._rendered = true;
		this.el.setAttribute(AML.prefix + '-rendered', true);
		this.tag.render(this.el, this.template, cb);
	};
	
	return AML;
}(AML || {}));