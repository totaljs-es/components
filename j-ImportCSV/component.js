COMPONENT('importcsv', 'parent:parent;margin:0;skipfirst:1;notdefined:---;dirsearch:Search', function(self, config, cls) {

	var cls2 = '.' + cls;
	var columns;
	var container;
	var rows;
	var data;
	var preview;

	self.readonly();

	self.make = function() {
		self.aclass(cls);
		self.append('<div class="{0}-container"><div class="{0}-rows"></div></div>'.format(cls));
		container = self.find(cls2 + '-container');
		rows = self.find(cls2 + '-rows');
		self.scrollbar = SCROLLBAR(container, { visibleY: 0, visibleX: 1, orientation: 'x' });
		self.resize();

		self.event('click', '.column', function() {
			var el = $(this);
			var opt = {};
			opt.items = columns;
			opt.element = el;
			opt.placeholder = config.dirsearch;
			opt.callback = function(item) {

				self.find('.column').each(function(index) {
					var el = $(this);
					if (el.attrd('id') === item.id) {
						el.attrd('id', '');
						el.aclass(cls + '-empty');
						self.find('.column' + index).aclass(cls + '-empty');
						el.find('span').html(config.notdefined);
					}
				});

				el.attrd('id', item.id);
				el.rclass(cls + '-empty');
				self.find('.column' + el.index()).rclass(cls + '-empty');
				el.find('span').html(Thelpers.encode(item.name || item.id));

				self.rebind();
			};
			SETTER('directory/show', opt);
		});
	};

	self.configure = function(key, value) {
		var tmp;
		switch (key) {
			case 'datasource':
				setTimeout(function() {
					self.datasource(value, function(path, value) {
						self.import(value);
					});
				}, 1);
				break;
			case 'keys':
				tmp = value.split(',');
				columns = [];
				for (var i = 0; i < tmp.length; i++) {
					var a = tmp[i].split('=');
					columns.push({ id: a[0], name: a[1] });
				}
				break;
		}
	};

	self.parseCSV = function(str) {

		var delimiter = { ',': 1, ';': 1 };
		var q = '"';
		var output = [];
		var lines = str.split('\n');

		for (var j = 0; j < lines.length; j++) {

			var t = lines[j] + ',';
			var values = {};
			var skip = false;
			var p = null;
			var beg = 0;
			var index = 97;

			for (var i = 0, length = t.length; i < length; i++) {

				var c = t[i];

				if (c === q && (!p || delimiter[p])) {
					if (skip) {
						if (delimiter[t[i + 1]])
							skip = false;
					} else
						skip = true;
				}

				if (skip)
					continue;

				if (delimiter[c]) {
					var tmp = t.substring(beg, i).trim();
					values[String.fromCharCode(index++)] = (tmp[0] === q && tmp[tmp.length - 1] === q ? tmp.substring(1, tmp.length - 1) : tmp).replace(/""/g, q);
					beg = i + 1;
				}

				if (c !== ' ')
					p = c;
			}

			output.push(values);
		}

		return output;
	};

	self.import = function(csv) {

		data = self.parseCSV(csv);
		var keys = Object.keys(data[0]);

		config.skipfirst && data.shift();

		var width = (keys.length * 200);
		var builder = [];
		rows.css('width', width);

		builder.push('<div class="{0}-head">'.format(cls));
		for (var j = 0; j < keys.length; j++) {
			var col = columns[j];
			builder.push('<div data-id="{1}" class="column{2}"><i class="ti ti-columns"></i><span>{0}</span></div>'.format(col ? (col.name || col.id) : config.notdefined, col ? col.id : '', col ? '' : (' ' + cls + '-empty')));
		}
		builder.push('</div>');

		for (var i = 0; i < data.take(preview || 100).length; i++) {
			var item = data[i];
			builder.push('<div class="{0}-row">'.format(cls));
			for (var j = 0; j < keys.length; j++)
				builder.push('<div class="column{1}{2}">{0}</div>'.format(Thelpers.encode(item[keys[j]]), j, columns[j] ? '' : (' ' + cls + '-empty')));
			builder.push('</div>');
		}

		// type of data
		rows.html(builder.join(''));
		self.rebind();
	};

	self.resize = function() {
		var p = config.parent;
		var margin = config.margin;
		var responsivemargin = config['margin' + WIDTH()];
		if (responsivemargin != null)
			margin = responsivemargin;
		var parent = self.parent(p);
		var height = parent.height() - margin;
		preview = (height / 20) >> 0;
		container.css('height', height);
		self.scrollbar.resize();
	};

	self.rebind = function() {

		if (!data)
			return;

		var cols = {};

		self.find('.column').each(function(index) {
			var el = $(this);
			var id = el.attrd('id');
			if (id)
				cols[index] = id;
		});

		var keys = Object.keys(data[0]);
		var output = [];

		for (var i = 0; i < data.length; i++) {

			var row = data[i];
			var obj = {};

			for (var j = 0; j < keys.length; j++) {
				var id = cols[j];
				if (id)
					obj[id] = row[keys[j]];
			}

			output.push(obj);
		}

		self.set(output);
	};

});