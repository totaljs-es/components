COMPONENT('offline', function(self, config, cls) {

	self.singleton();
	self.make = function() {
		self.aclass(cls);
		self.element.wrapInner('<div class="{0}-message"></div>'.format(cls));
		self.tclass('hidden', navigator.onLine);
		$(W).on('online', function() {
			self.aclass('hidden');
		}).on('offline', function() {
			self.rclass('hidden');
		});
	};

});