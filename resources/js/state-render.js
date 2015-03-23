(function() {
    var counter = 0;

    a.state.add({
        id: 'visual-render',
        hash: '/render',
        entry: '#page-container',
        type: 'replace',
        include: {
            html: 'resources/html/render/render.html'
        },

        data: {
            pending: '{{inject: pending}}',
            request: function(chain) {
                if(a.isTrueObject(this.data.pending)) {
                    // We create a request from this
                    this.requestVisual(a.parser.json.stringify(this.data.pending), function(data) {
                        chain.next(data);
                    }, function(url, status) {
                        smoke.alert('There is an error with your request');
                    });
                } else {
                    chain.next(null);
                }
            },
            listing: {
                url: 'api.php',
                options: {
                    template: ['POST', 'json'],
                    header: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    data: 'listing=true'
                }
            }
        },

        /**
         * Get the unique ID for given row.
         *
         * @param table The table to get primaries from
         * @param content The content to search primaries inside
         * @return A String containing a unique id generated for the occasion
        */
        getUniqueId: function(table, content) {
            var primaries = this.data.listing[table]['primaries'],
                ids       = [];

            for(var i = 0, l = primaries.length; i < l; ++i) {
                ids.push(content[primaries[i]]);
            }

            return ids.join('-');
        },

        /**
         * Get the reference relationship with table.
         *
         * @param table The table to search related references.
        */
        getReference: function(table) {
            var listing = this.data.listing,
                found   = [];

            for(var table in listing) {
                var tmpForeigns = listing[table]['foreigns'];

                for(var i = 0, l = tmpForeigns.length; i < l; ++i) {
                    var tmpForeign = tmpForeigns[i];

                    if(tmpForeign['reference'].indexOf(table + '.') === 0 ||
                        tmpForeign['foreign'].indexOf(table + '.') === 0) {
                        found.push(tmpForeign);
                    }
                }
            }

            return found;
        },

        /**
         * Get the related print for the table.
         *
         * @param table The table to get related print
         * @return An array of prints...
        */
        getPrint: function(table) {
            var listing = this.data.listing;

            if(listing != null && table in listing) {
                return listing[table]['prints'];
            }
            return null;
        },

        /**
         * Check if given element is a parent of the submitted data.
         *
         * @param parent The graphical element to search in
         * @param table The table to get data for
         * @param data The specific line data
         * @return True there is a link, false they are not related.
        */
        isParent: function(parent, table, data) {
            var references = this.getReference(table),
                found      = false,
                content    = a.parser.json.parse(parent.attr('data-content'));

            // We got couples of reference to search inside...
            for(var i = 0, l = references.length; i < l && !found; ++i) {
                var foreign = references[i]['foreign'],
                    reference = references[i]['reference'];
                // no need to check more
                if(foreign.indexOf(parent.attr('data-table') + '.') === 0 &&
                    reference.indexOf(table + '.') === 0) {
                    // We search for relationship

                    var foreignKey = foreign.substring(foreign.indexOf('.') + 1),
                        referenceKey = reference.substring(reference.indexOf('.') + 1);

                    if(content[foreignKey] === data[referenceKey]) {
                        found = true;
                    }
                } else if(reference.indexOf(parent.attr('data-table') + '.') === 0 &&
                    foreign.indexOf(table + '.') === 0) {
                    // We search for relationship

                    var foreignKey = foreign.substring(foreign.indexOf('.') + 1),
                        referenceKey = reference.substring(reference.indexOf('.') + 1);

                    if(data[foreignKey] === content[referenceKey]) {
                        found = true;
                    }
                }
            }

            return found;
        },

        /**
         * Link to a parent, the given element.
         *
         * @param parent The parent to link with
         * @param el The element to link with
        */
        linkParent: function(parent, el) {
            jsPlumb.connect({
                source: el.attr('id'),
                target: parent.attr('id'),
                anchor: ['Left', 'Right'],
                connector: 'Straight'
            });
        },

        /**
         * When a user ask to modify an entry
        */
        modifyVisual: function(table, data) {
            var originalId = [],
                _this      = this,
                primaries  = this.data.listing[table]['primaries'];

            // Populating original id primaries keys
            for(var i = 0, l = primaries.length; i < l; ++i) {
                originalId.push('`' + primaries[i] + '` = "' + data[primaries[i]] + '"');
            }

            $.Dialog({
                overlay: true,
                shadow: true,
                flat: true,
                title: 'Modify entry in ' + table,
                content: '',
                onShow: function(_dialog){
                    var leftDiv  = $('<div/>'),
                        rightDiv = $('<div/>'),
                        content  = _dialog.children('.content'),
                        i = 0;

                    content.css('min-width', '500px');
                    content.css('padding', '10px');

                    leftDiv.css('float', 'left');
                    leftDiv.css('width', '50%');
                    leftDiv.css('margin-top', '30px');
                    leftDiv.css('padding-right', '10px');
                    rightDiv.css('margin-top', '30px');
                    rightDiv.css('float', 'right');
                    rightDiv.css('width', '50%');
                    rightDiv.css('padding-left', '10px');

                    var inputs = [];
                    for(var key in data) {
                        var div = $('<div/>'),
                            lbl = $('<label class="bold"/>'),
                            suv = $('<div class="input-control text"/>'),
                            txt = $('<input/>');

                        txt.attr('data-key', key);

                        lbl.html(key);
                        txt.val(data[key]);

                        div.append(lbl);
                        suv.append(txt);
                        div.append(suv);
                        inputs.push(txt);

                        if(i % 2 == 0) {
                            div.appendTo(leftDiv);
                        } else {
                            div.appendTo(rightDiv);
                        }

                        i++;
                    }

                    content.append(leftDiv).append(rightDiv);
                    content.append('<div class="clearfix"/>');

                    var btnDiv = $('<div class="align-right"/>'),
                        ok     = $('<button class="info valid">OK</button>'),
                        del    = $('<button class="danger delete">Delete</button>');

                    ok.on('click', function() {
                        // We create the sql statement
                        var sql = 'UPDATE `' + table + '` SET ';

                        var update = [];
                        for(var i = 0, l = inputs.length; i < l; ++i) {
                            update.push('`' + inputs[i].attr('data-key')
                                + '` = "' + inputs[i].val() + '"');
                        }

                        sql += update.join(',') + ' WHERE '
                            + originalId.join(' AND ');

                        // We send it
                        var request = new a.ajax({
                                url: 'api.php',
                                method: 'POST',
                                data: 'execute=true&json=' + a.parser.json.stringify({
                                    'types[]': ['custom'],
                                    'customs[]': [sql]
                                }),
                                template: ['json'],
                                header: {
                                    'Content-Type': 'application/x-www-form-urlencoded'
                                }
                        }, function(data, status) {
                            if(data != null && 'error' in data) {
                                smoke.alert('An error in your SQL request occurs: ' + data['error']);
                            } else {
                                // We close
                                $.Dialog.close();
                                // And refresh graphic
                                _this.requestVisual(a.parser.json.stringify(_this.data.pending), function(data) {
                                    _this.data.request = data;
                                    _this.applyVisual(data);

                                }, function(url, status) {
                                    smoke.alert('There is an error in your import');
                                });
                            }
                            
                        }, function(url, status) {
                            smoke.alert('An error occurs: ' + url + '(status: ' + status + ')');
                        });
                        
                        request.send();
                    });

                    del.on('click', function() {
                        smoke.confirm('Are you sure you want to delete ?', function(e) {
                            if(e) {
                                var sql = 'DELETE FROM `' + table + '` WHERE ' + originalId.join(' AND ');
                                var request = new a.ajax({
                                        url: 'api.php',
                                        method: 'POST',
                                        data: 'execute=true&json=' + a.parser.json.stringify({
                                            'types[]': ['custom'],
                                            'customs[]': [sql]
                                        }),
                                        template: ['json'],
                                        header: {
                                            'Content-Type': 'application/x-www-form-urlencoded'
                                        }
                                }, function(data, status) {
                                    if(data != null && 'error' in data) {
                                        smoke.alert('An error in your SQL request occurs: ' + data['error']);
                                    } else {
                                        // We close
                                        $.Dialog.close();
                                        // And refresh graphic
                                        _this.requestVisual(a.parser.json.stringify(_this.data.pending), function(data) {
                                            _this.data.request = data;
                                            _this.applyVisual(data);

                                        }, function(url, status) {
                                            smoke.alert('There is an error in your import');
                                        });
                                    }
                                }, function(url, status) {
                                    smoke.alert('An error occurs: ' + url + '(status: ' + status + ')');
                                });
                                
                                request.send();
                            }
                        });
                    });

                    btnDiv.append(ok);
                    btnDiv.append(del);
                    content.append(btnDiv);
                }
            });
        },

        /**
         * Call the server to get related data to visual.
         *
         * @param text The visual as text element
         * @param success The success function
         * @param error The error function
        */
        requestVisual: function(text, success, error) {
            var request = new a.ajax({
                    url: 'api.php',
                    method: 'POST',
                    data: 'execute=true&json=' + encodeURIComponent(text),
                    header: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
            }, function(data, status) {
                if(a.isFunction(success)) {
                    success(a.parser.json.parse(data));
                }
                
            }, function(url, status) {
                if(a.isFunction(error)) {
                    error(url, status);
                }
            });
            request.send();
        },

        /**
         * Export current visual as an image
         *
         * @param data The data to export
        */
        exportVisual: function(data) {
            var clone = $('.template[data-template-id="visual-render"]')
                                .clone().removeClass('hidden');
            $.Dialog({
                overlay: true,
                shadow: true,
                flat: true,
                title: 'Export Visual',
                content: '',
                onShow: function(_dialog) {
                    _dialog.css('z-index', 2002);
                    var content = _dialog.children('.content');
                    content.html(clone);
                    content.find('textarea').val(a.parser.json.stringify(data));
                    content.find('.valid').on('click', function() {
                        $.Dialog.close();
                    });
                }
            });
        },

        /**
         * Export data as SQL insert statement
         *
         * @param data The data to export
        */
        sqlVisual: function(data) {
            var clone = $('.template[data-template-id="visual-render"]')
                                .clone().removeClass('hidden');
            $.Dialog({
                overlay: true,
                shadow: true,
                flat: true,
                title: 'Export Visual',
                content: '',
                onShow: function(_dialog){
                    var content = _dialog.children('.content');
                    content.html(clone);
                    content.find('textarea').val(data);
                    content.find('.valid').on('click', function() {
                        $.Dialog.close();
                    });
                }
            });
        },

        importVisual: function() {
            var clone = $('.template[data-template-id="visual-render"]')
                                .clone().removeClass('hidden'),
                _this = this;
            $.Dialog({
                overlay: true,
                shadow: true,
                flat: true,
                title: 'Import Visual',
                content: '',
                onShow: function(_dialog){
                    var content = _dialog.children('.content');
                    content.html(clone);

                    clone.find('.valid').on('click', function() {
                        var text = clone.find('textarea').val();

                        try {
                            _this.requestVisual(text, function(data) {
                                _this.data.pending = a.parser.json.parse(text);
                                _this.data.request = data;
                                _this.applyVisual(data);

                            }, function(url, status) {
                                smoke.alert('There is an error in your import');
                            });

                        } catch(e) {
                            smoke.alert('Cannot import: ' + e.message);
                        }

                        $.Dialog.close();
                    });
                }
            });
        },

        applyVisual: function(data) {
            var root = $(this.entry).find('div.graphic');
            jsPlumb.empty(root);


            // Menu bars on top offset (45 + 45 + marge of 20)
            var topOffset = 110,
                // If one day...
                leftOffset = 0,
                parents    = [];

            for(var i = 0, l = data.length; i < l; ++i) {
                var name    = data[i].name,
                    content = data[i].content,
                    table   = this.createBlockTable(root, name);

                var currents = [];
                for(var j = 0, m = content.length; j < m; ++j) {
                    // TODO: change offset
                    // TODO: check if we can get back root as "table" and not 'root'
                    var line = this.createBlockLine(root, parents, name, content[j], {
                        offsetX: i * 250 + leftOffset,
                        // Tiny separator at the end j * 20
                        offsetY: (j * 100) + (j * 20) + topOffset
                    });
                    currents.push(line);
                }

                // Erasing
                parents = currents;
            }
        },

        screenshotVisual: function() {
            var root = $('body');
            $('.navigation-bar').css('display', 'none');

            var el = root.get(0); // get flow container div
            html2canvas(el, {
                onrendered: function(canvas) {
                    var ctx = canvas.getContext('2d');
                    // # Render Flows/connections on top of same canvas
                    var flows = $('> svg', el);
                    flows.each(function() {
                        var svg    = $(this),
                            offset = svg.position(),
                            svgStr = this.outerHTML;
                        ctx.drawSvg(svgStr, offset.left, offset.top);
                    });
                    // # Render Endpoints
                    var endpoints = $('._jsPlumb_endpoint > svg', el);
                    endpoints.each(function() {
                        var svg    = $(this),
                            offset = svg.parent().position(),
                            svgStr = this.outerHTML;
                        ctx.drawSvg(svgStr, offset.left, offset.top);
                    });
                    //# Convert canvas to Blob
                    var img    = canvas.toDataURL('image/png'),
                        output = encodeURIComponent(img);

                    var request = new a.ajax({
                        url: 'img.php',
                        method: 'POST',
                        data: 'image=' + output,
                        header: {
                            'Accept': 'image/png',
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    }, function() {
                        // Opening image
                        window.open('img.php', '_blank');
                    });
                    
                    request.send();

                    $('.navigation-bar').css('display', 'block');
                }
            });
        },

        // Add menu options (render-options in index.html) onclick and related content
        globalBind: {
            '.render-options .export-options | click': function() {
                var data = this.data.pending;

                if(data == null) {
                    smoke.alert('There is no visual to export');
                    return;
                }

                this.exportVisual(data);
            },
            '.render-options .data-options | click': function() {
                var data = this.data.request,
                    sql = '';

                if(data == null) {
                    smoke.alert('There is no data to export');
                    return;
                }

                for(var i = 0, l = data.length; i < l; ++i) {
                    var table   = data[i]['name'],
                        content = data[i]['content'];

                    for(var j = 0, k = content.length; j < k; ++j) {
                        var keys    = a.keys(content[j]),
                            values  = a.values(content[j]);

                        sql += 'INSERT INTO `' + table + '`(`' + keys.join('`, `')
                            + '`) VALUES ("' + values.join('", "') + '")\n';
                    }

                }

                this.sqlVisual(sql);
            },
            '.render-options .screenshot-options | click': function() {
                this.screenshotVisual();
            },
            '.render-options .import-options | click': function() {
                this.importVisual();
            }
        },


        createBlockTable: function(root, name) {
            var div = $('<div class="block-table"/>');
            var title = $('<h2 class="title" />');
            title.html(name);
            div.append(title);
            div.attr('id', 'block-' + name + '-' + counter++);
            root.append(div);
            return div;
        },
        createBlockLine: function(root, parents, name, data, offset) {
            var div   = $('<div class="block-line"/>'),
                id    = this.getUniqueId(name, data),
                clone = parents.slice(0);

            // Setting data
            div.attr('id', 'block-line-' + counter++);
            div.attr('data-table', name);
            div.attr('data-id', id);
            div.attr('data-content', a.parser.json.stringify(data));

            var title = $('<a class="title"/>');
            title.html(id);
            div.append(title);
            root.append(div);

            // Creating prints
            var prints = this.getPrint(name);

            if(prints) {
                for(var i = 0, l = prints.length; i < l; ++i) {
                    var dt = data[prints[i]] || null;
                    if(dt) {
                        div.append($('<br/>'));
                        var ct = $('<a class="content"/>');
                        if(dt.length > 16) {
                            ct.html(dt.substr(0, 16) + '...');
                        } else {
                            ct.html(dt);
                        }
                        div.append(ct);
                    }
                }
            }

            // 75: (250 width - 100 div width) / 2
            div.css('left', offset.offsetX + 75);
            // For title position
            div.css('top', offset.offsetY);

            // Attach to jsPlumb
            jsPlumb.draggable(div.attr('id'));

            // Create links between parents and son
            // First, we need to remove parents which are not linked to...
            for(var i = 0, l = parents.length; i < l; ++i) {
                if(this.isParent(parents[i], name, data)) {
                    this.linkParent(parents[i], div);
                }
            }

            // Adding the double click
            var _this = this;
            div.on('dblclick', function() {
                _this.modifyVisual(name, data);
            });

            return div;
        },
        postLoad: function() {
            // Making render button visible
            $('.render-options').removeClass('hidden');
            // We go to another url
            var data = this.data.request,
                listing = this.data.listing;

            // If listing is empty (does not contains any relations
            // or has no table), print a message.
            if(listing == null || listing.length == 0) {
                smoke.alert('The listing received from server is empty, please check config.php file and/or your database tables.');
            }

            // Nothing to draw, we should start an alert
            if(data === null) {
                this.importVisual();
                return;
            }

            if(a.isTrueObject(listing) && 'error' in listing) {
                smoke.alert('SQL error: ' + listing['error']);
            }

            if(a.isTrueObject(data) && 'error' in data) {
                smoke.alert('SQL error: ' + data['error']);
            }

            // Render
            this.applyVisual(data);
        },

        preUnload: function() {
            // Hiding class again
            $('.render-options').addClass('hidden');

            // Removing jsPlumb
            var root = $(this.entry).find('div.graphic');
            jsPlumb.empty(root);
        }
    });
})();