/**
 * (AML) Asynchronous Markup Language
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 */

AML.extend(function(AML) {
	AML.registerTag('template', {
		render: function(node, template, cb) {

			node.innerHTML = AML.parseTemplate(template);

			if (typeof cb === 'function') {
				cb();
			}

		}
	});
});