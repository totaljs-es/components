COMPONENT('autofill', function(self) {
	self.readonly();
	self.blind();
	self.make = function() {
		var form = document.createElement('FORM');
		while (self.dom.children.length)
			form.appendChild(self.dom.children[0]);
		self.dom.appendChild(form);
		$(form).attr('action', '#').attr('method', 'POST').on('submit', function(e) {
			e.preventDefault();
			e.stopPropagation();
			return false;
		});
	};
});