COMPONENT('sticker', 'margin:0;marginparent:0;lg:1;md:1;sm:1;xs:0;type:offset', function(self, config) {

	var raf = W.requestAnimationFrame ? W.requestAnimationFrame : function(cb) { setTimeout(cb, 1); };
	var ca = null;
	var cb = null;
	var enabled = false;
	var is = false;
	var ready = false;
	var top = 0;
	var maxtop = 0;
	var events = {};
	var parent;

	self.readonly();

	function parentscroll(node) {
		return node ? (node.scrollHeight > node.clientHeight ? node : parentscroll(node.parentNode)) : null;
	}

	self.configure = function(key, value) {
		switch (key) {
			case 'on':
				ca = value;
				break;
			case 'off':
				cb = value;
				break;
			case 'parent':
				parent = config.parent ? self.parent(config.parent) : null;
				break;
		}
	};

	events.onscroll = function() {
		raf(self.toggle);
	};

	events.bind = function() {
		$(self.container.tagName === 'HTML' ? W : self.container).on('scroll', events.onscroll);
	};

	self.destroy = function() {
		$(self.container.tagName === 'HTML' ? W : self.container).off('scroll', events.onscroll);
	};

	self.resize = function() {

		if (self.hclass(ca))
			return;

		ready = false;

		WAIT(function() {
			top = self.element[config.type]().top;
			return top > 0;
		}, function() {
			ready = true;
			setTimeout(self.toggle, 500);
		});
	};

	self.make = function() {

		var w = WIDTH();

		if (!config[w])
			return;

		self.container = parentscroll(self.dom);

		if (self.container) {
			self.resize();
			events.bind();
		} else
			setTimeout(self.make, 500);
	};

	self.toggle = function() {

		if (!ready)
			return;

		var el = self.element;

		if (!top || !self.dom.parentNode) {
			ca && el.rclass(ca);
			cb && el.aclass(cb);
			return;
		}

		var t = top + config.margin;
		var y = W.pageYOffset || self.container.scrollTop;

		is = y >= t;

		if (is) {

			if (!enabled) {
				enabled = true;
				ca && el.rclass(ca);
				cb && el.aclass(cb);
				if (parent)
					maxtop = (parent.height() - el.height()) - config.marginparent;
			}

			if (parent && y < (maxtop + t))
				self.dom.style.top = y + 'px';

		} else if (enabled) {
			cb && el.rclass(cb);
			ca && el.aclass(ca);
			if (parent)
				self.dom.style.top = t + 'px';
			enabled = false;
		}
	};
});