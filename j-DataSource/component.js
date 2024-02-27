COMPONENT('datasource', 'delay:0', function(self, config) {

	var fn = null;

	self.nocompile();
	self.readonly();

	self.make = function() {
		var scr = self.find('scr' + 'ipt');
		if (scr.length)
			fn = new Function('value', scr.html());
	};

	self.reload = function(url) {
		if (!url.includes(' '))
			url = 'GET ' + url;
		AJAX(url, response => SET(self.makepath(config.path), fn ? fn(response) : response));
	};

	self.configure = function(key, value) {
		switch (key) {
			case 'url':
				if (config.delay)
					setTimeout2(self.ID, () => self.reload(value), config.delay);
				else
					self.reload(value);
				break;
		}
	};

	self.setter = function(value) {
		if (value) {
			if (config.delay)
				setTimeout2(self.ID, () => self.reload(value), config.delay);
			else
				self.reload(value);
		}
	};

});