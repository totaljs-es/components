COMPONENT('iframe', 'margin:0;parent:window;scrollbar:0', function(self, config, cls) {

	var iframe;

	self.make = function() {
		self.aclass(cls);
		self.append('<iframe frameborder="0" scrolling="' + (config.scrollbar ? 'yes' : 'no') + '" allowtransparency="true" allow="geolocation *; microphone *; camera *; midi *; encrypted-media *" style="width:100%"></iframe>');
		iframe = self.find('iframe');
		self.on('resize + resize2', self.resize);
		self.resize();
	};

	self.resize = function() {
		setTimeout2(self.ID, self.resizeforce, 300);
	};

	self.resizeforce = function() {
		var parent = self.parent(config.parent);
		iframe.css({ height: parent.height() - config.margin });
	};

	self.setter = function(value) {
		iframe.attr('src', value || 'about:blank');
	};

});