COMPONENT('fileuploader', function(self, config) {

	var input;

	self.singleton();
	self.readonly();
	self.nocompile();

	self.preparefilename = function(filename) {
		var index = filename.lastIndexOf('/');

		if (index === -1)
			index = filename.lastIndexOf('\\');

		if (index !== -1)
			filename = filename.substring(index + 1);
		return filename;
	};

	self.upload = self.browse = function(opt) {

		// opt.url
		// opt.callback {Function(response, err)}
		// opt.progress {Function(progress)}
		// opt.multiple {Boolean}
		// opt.accept {String}
		// opt.prefix = 'file{0}'
		// opt.data = { key: value }
		// opt.width {Number}
		// opt.height {Number}
		// opt.keeporiginal {Boolean}
		// opt.background {String} (hex or "transparent")
		// opt.base64 {String}
		// opt.filename {String}
		// opt.quality {Number}
		// opt.disproportionate {Boolean}

		self.opt = opt;
		self.opt.fd = new FormData();
		self.opt.indexer = 0;

		if (!opt.url)
			opt.url = config.url;

		if (opt.files) {
			self.processfiles(opt.files);
		} else if (opt.base64) {
			fetch(opt.base64).then(res => res.blob()).then(function(blob) {
				self.opt.fd.append((self.opt.prefix || 'file{0}').format(self.opt.indexer++), blob, opt.filename || opt.name);
				self.uploadfiles(null);
			});

		} else {
			input[0].value = '';
			self.find('input').attr('accept', opt.accept || '*/*').prop('multiple', !!opt.multiple);
			input.click();
		}
	};

	self.processfiles = function(files, callback) {
		if (self.opt.width || self.opt.height) {
			var queue = [];
			for (var i = 0; i < files.length; i++)
				queue.push(files[i]);
			queue.wait(function(item, next) {
				if (item.type.substring(0, 5) === 'image/') {
					self.processimage(item, function(filename, blob) {
						self.opt.fd.append((self.opt.prefix || 'file{0}').format(self.opt.indexer++), blob, filename);
						next();
					});
				} else {
					self.opt.fd.append((self.opt.prefix || 'file{0}').format(self.opt.indexer++), item, item.name);
					next();
				}

			}, () => self.uploadfiles(null, callback));
		} else
			self.uploadfiles(files, callback);
	};

	self.make = function() {
		self.aclass('hidden');
		self.append('<input type="file" multiple />');
		input = self.find('input');
		self.event('change', 'input', function(e) {
			self.processfiles(e.target.files, () => this.value = '');
		});
	};

	self.uploadfiles = function(files, callback) {

		if (files) {
			for (var i = 0; i < files.length; i++) {
				var filename = self.preparefilename(files[i].name);
				self.opt.fd.append((self.opt.prefix || 'file{0}').format(self.opt.indexer++), files[i], filename);
			}
		}

		if (self.opt.data) {
			for (var key in self.opt.data)
				self.opt.fd.append(key, self.opt.data[key]);
		}

		SETTER('loading/show');
		UPLOAD(self.opt.url, self.opt.fd, function(response, err) {

			SETTER('loading/hide', 500);

			if (!response && err)
				self.opt.callback(null, err);
			else if (response instanceof Array && response[0] && response[0].error)
				self.opt.callback(null, response[0].error);
			else
				self.opt.callback(response);

		}, function(percentage, speed, remaining) {
			self.opt.progress && self.opt.progress(percentage, speed, remaining);
			if (percentage === 100 && callback) {
				callback();
				callback = null;
			}
		});

		setTimeout(function() {
			input[0].value = '';
		}, 1500);

	};

	self.processimage = function(file, callback) {
		var name = self.preparefilename(file.name.replace(/\.(ico|png|jpeg|jpg|gif|svg|webp|heic)$/i, self.opt.background === 'transparent' ? '.png' : '.jpg'));
		self.getorientation(file, function(orient) {
			var reader = new FileReader();
			reader.onload = function () {
				var img = new Image();
				img.onload = function() {
					if (self.opt.keeporiginal && ((img.width == self.opt.width && img.height == self.opt.height) || (self.opt.width && self.opt.onlylarger && img.width <= self.opt.width))) {
						name = self.preparefilename(file.name);
						fetch(reader.result).then(res => res.blob()).then(blob => callback(name, blob));
					} else
						self.resizeimage(img, name, callback);
				};
				img.crossOrigin = 'anonymous';
				if (orient < 2)
					img.src = reader.result;
				else
					self.resetorientation(reader.result, orient, url => img.src = url);
			};
			reader.readAsDataURL(file);
		});
	};

	var resizewidth = function(w, h, size) {
		return Math.ceil(w * (size / h));
	};

	var resizeheight = function(w, h, size) {
		return Math.ceil(h * (size / w));
	};

	self.resizeimage = function(image, name, callback) {

		var opt = self.opt;
		var canvas = document.createElement('canvas');
		var ctx = canvas.getContext('2d');

		var w = 0;
		var h = 0;
		var x = 0;
		var y = 0;
		var is = false;
		var diff = 0;

		if (!opt.width)
			opt.width = (image.width * (opt.height / image.height)) >> 0;

		if (!opt.height)
			opt.height = image.height * (opt.width / image.width);

		canvas.width = opt.width;
		canvas.height = opt.height;

		if (opt.background !== 'transparent') {
			ctx.fillStyle = opt.background || '#FFFFFF';
			ctx.fillRect(0, 0, opt.width, opt.height);
		}

		if (image.width > opt.width || image.height > opt.height) {
			if (image.width > image.height) {

				if (opt.disproportionate) {
					w = opt.width;
					h = resizeheight(image.width, image.height, w);
					canvas.width = w;
					canvas.height = h;
				} else {

					w = resizewidth(image.width, image.height, opt.height);
					h = opt.height;

					if (w < opt.width) {
						w = opt.width;
						h = resizeheight(image.width, image.height, opt.width);
					}

					if (w > opt.width) {
						diff = w - opt.width;
						x -= (diff / 2) >> 0;
					}
				}

				is = true;
			} else if (image.height > image.width) {

				if (opt.disproportionate) {
					h = opt.height;
					w = resizewidth(image.width, image.height, h);
					canvas.width = w;
					canvas.height = h;
				} else {

					w = opt.width;
					h = resizeheight(image.width, image.height, opt.width);

					if (h < opt.height) {
						h = opt.height;
						w = resizewidth(image.width, image.height, opt.height);
					}

					if (h > opt.height) {
						diff = h - opt.height;
						y -= (diff / 2) >> 0;
					}
				}

				is = true;
			}
		}

		if (!is) {
			if (image.width < opt.width && image.height < opt.height) {
				w = image.width;
				h = image.height;
				x = (opt.width / 2) - (image.width / 2);
				y = (opt.height / 2) - (image.height / 2);
			} else if (image.width >= image.height) {
				w = opt.width;
				h = image.height * (opt.width / image.width);
				y = (opt.height / 2) - (h / 2);
			} else {
				h = opt.height;
				w = (image.width * (opt.height / image.height)) >> 0;
				x = (opt.width / 2) - (w / 2);
			}
		}

		ctx.drawImage(image, x, y, w, h);

		var base64 = opt.background === 'transparent' ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', (opt.quality || 90) * 0.01);
		if (base64.length > 10)
			fetch(base64).then(res => res.blob()).then(blob => callback(name, blob));

	};

	// http://stackoverflow.com/a/32490603
	self.getorientation = function(file, callback) {
		var reader = new FileReader();
		reader.onload = function(e) {
			var view = new DataView(e.target.result);
			if (view.getUint16(0, false) != 0xFFD8)
				return callback(-2);
			var length = view.byteLength;
			var offset = 2;
			while (offset < length) {
				var marker = view.getUint16(offset, false);
				offset += 2;
				if (marker == 0xFFE1) {
					if (view.getUint32(offset += 2, false) != 0x45786966)
						return callback(-1);
					var little = view.getUint16(offset += 6, false) == 0x4949;
					offset += view.getUint32(offset + 4, little);
					var tags = view.getUint16(offset, little);
					offset += 2;
					for (var i = 0; i < tags; i++)
						if (view.getUint16(offset + (i * 12), little) == 0x0112)
							return callback(view.getUint16(offset + (i * 12) + 8, little));
				} else if ((marker & 0xFF00) != 0xFF00)
					break;
				else
					offset += view.getUint16(offset, false);
			}
			return callback(-1);
		};
		reader.readAsArrayBuffer(file.slice(0, 64 * 1024));
	};

	self.resetorientation = function(src, srcOrientation, callback) {
		var img = new Image();
		img.onload = function() {
			var width = img.width;
			var height = img.height;
			var canvas = document.createElement('canvas');
			var ctx = canvas.getContext('2d');

			canvas.width = width;
			canvas.height = height;

			switch (srcOrientation) {
				case 2: ctx.transform(-1, 0, 0, 1, width, 0); break;
				case 3: ctx.transform(-1, 0, 0, -1, width, height); break;
				case 4: ctx.transform(1, 0, 0, -1, 0, height); break;
				case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
				case 6: ctx.transform(-1, 0, 0, 1, width, 0); break;
				case 7: ctx.transform(0, -1, -1, 0, height, width); break;
				case 8: ctx.transform(0, -1, 1, 0, 0, width); break;
			}

			ctx.drawImage(img, 0, 0);

			if (srcOrientation === 6) {
				var canvas2 = document.createElement('canvas');
				canvas2.width = width;
				canvas2.height = height;
				var ctx2 = canvas2.getContext('2d');
				ctx2.scale(-1, 1);
				ctx2.drawImage(canvas, -width, 0);
				callback(canvas2.toDataURL());
			} else
				callback(canvas.toDataURL());
		};
		img.src = src;
	};

});