COMPONENT('exec', function(self, config) {

	var regparent = /\?\d/;
	var extensions = [];
	var skiptimeout = null;

	self.readonly();
	self.blind();
	self.singleton();

	self.register = function(fn) {
		extensions.push(fn);
	};

	self.make = function() {

		var fn = function(plus, forceprevent) {
			return function execlick(e) {

				var el = $(this);

				if (!plus && skiptimeout)
					return;

				if (!e.$force && !plus && el.hclass('exec2')) {
					skiptimeout && clearTimeout(skiptimeout);
					skiptimeout = setTimeout(function(ctx, e) {
						skiptimeout = null;
						e.$force = true;
						execlick.call(ctx, e);
					}, 300, this, e);
					return;
				}

				var attr = el.attrd('exec' + plus);
				var href = el.attrd('href' + plus);

				if (skiptimeout) {
					clearTimeout(skiptimeout);
					skiptimeout = null;
				}

				var prevent = forceprevent ? '1' : el.attrd('prevent' + plus);
				if (prevent === 'true' || prevent === '1') {
					e.preventDefault();
					e.stopPropagation();
				}

				if (attr) {
					if (extensions.length) {
						for (var ext of extensions) {
							if (ext(attr, el, e, plus))
								return;
						}
					}
					if (M.is20) {
						// el.EXEC() tries to find the closest plugin
						el.EXEC(attr, el, e);
					} else {
						if (attr.includes('?'))
							attr = el.scope().makepath(attr);
						EXEC(attr, el, e);
					}
				}

				href && REDIRECT(href);
			};
		};

		var el = $(document.body);
		el.on('contextmenu', config.selector3 || '.exec3', fn('3', true));
		el.on('dblclick', config.selector2 || '.exec2', fn('2'));
		el.on('click', config.selector || '.exec', fn(''));
	};
});