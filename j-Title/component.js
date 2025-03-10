COMPONENT('title', 'separator:-;plus:1', function(self, config) {

	self.singleton();
	self.readonly();

	self.make = function() {
		config.name = document.title;
	};

	self.setter = function(value) {
		self.rename(value);
	};

	self.rename = function(text) {
		if (!text)
			text = config.empty;
		let tmp = config.plus ? ((text ? (text + ' ' + config.separator + ' ') : '') + config.name) : text;
		document.title = tmp;
	};

});
