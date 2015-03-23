(function() {
    // Internal counter for steps
    var counter = 0;

    /**
     * For a given table name, find all related tables which
     * references, or are referenced to this table.
     *
     * @param search The table name to search links
     * @param links Raw links to search inside
     * @return an array containing every relations where the table appear to
     * be linked to
    */
    function getLinkedForeigns(search, links) {
        var results = [];

        for(var table in links) {
            for(var i = 0, l = links[table].foreigns.length; i < l; ++i) {
                var foreign = links[table].foreigns[i],
                    fo = foreign['foreign'],
                    ref = foreign['reference'];

                if(_.startsWith(ref, search)) {
                    results.push(foreign);
                }
                if(_.startsWith(fo, search)) {
                    results.push(foreign);
                }
            }
        }

        return results;
    };

    /**
     * Restrict a getLinkedForeigns results to a subset (basically this
     * does a double table constraint).
     *
     * @param search The table link to search
     * @param links The result from getLinkedForeigns
    */
    function getSubLinkedForeigns(search, links) {
        var results = [];

        for(var i = 0, l = links.length; i < l; ++i) {
            var foreign = links[i]['foreign'],
                reference = links[i]['reference'],
                tbForeign = foreign.substr(0, foreign.indexOf('.')),
                tbReference = reference.substr(0, reference.indexOf('.'));

            if(tbForeign == search) {
                results.push(links[i]);
                continue;
            }
            if(tbReference == search) {
                results.push(links[i]);
            }
        }

        return results;
    };

    /**
     * From the getLinkedForeigns return, extract an array of table
     * able to link with.
     *
     * @param search The table name to search relations
     * @param foreigns The result of getLinkedForeigns
     * @return An array containing all possible tables links
    */
    function getLinkedTables(search, foreigns) {
        var results = [];

        for(var i = 0, l = foreigns.length; i < l; ++i) {
            var foreign = foreigns[i]['foreign'],
                reference = foreigns[i]['reference'],
                tbForeign = foreign.substr(0, foreign.indexOf('.')),
                tbReference = reference.substr(0, reference.indexOf('.'));

            if(tbForeign != search) {
                results.push(tbForeign);
            }
            if(tbReference != search) {
                results.push(tbReference);
            }
        }

        return results;
    };

    /**
     * When a foreign relations is selected, get the corresponding SQL
     *
     * @param table The previous table we are linking
     * @param foreign The foreign element
     * @return A SQL string compatible with user request
    */
    function getRelatedSQL(table, foreign) {
        var fo = foreign['foreign'],
            re = foreign['reference'],
            tbForeign = fo.substr(0, fo.indexOf('.')),
            tbReference = re.substr(0, re.indexOf('.'));
            fdForeign = fo.substring(fo.indexOf('.') + 1),
            fdReference = re.substring(re.indexOf('.') + 1);

        if(table == tbForeign) {
            tbForeign = '__parent__';
            return '`' + fdReference + '` IN {{' + tbForeign + '.' + fdForeign + '}}';
        } else {
            tbReference = '__parent__';
            return '`' + fdForeign + '` IN {{' + tbReference + '.' + fdReference + '}}';
        }
    };

    a.state.add({
        id: 'visual-create',
        hash: '/visual/create',
        entry: '#page-container',
        type: 'replace',
        include: {
            html: 'resources/html/visual/create.html'
        },
        data: {
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
        bind: {
            'div.add a | click': function() {
                a.state.load('visual-step');
            },
            'button.create | click': function(e) {
                var form = $(e.target).closest('#page-container').find('form');
                var object = a.form.get(form);

                // We remove duplicate here
                var types = [],
                    i = 0,
                    l = object["tables[]"].length;
                while(types.length != l) {
                    var tmp = 'type-' + i;
                    if (tmp in object) {
                        types.push(object[tmp]);
                        delete object[tmp];
                    }
                    ++i;
                }

                object['types[]'] = types;

                // We remove unecessary element
                var i = types.length;
                while(i--) {
                    if(types[i] == 'quick') {
                        object['customs[]'].splice(i, 1);
                    } else {
                        object['queries[]'].splice(i, 1);
                        object['tables[]'].splice(i, 1);
                    }
                }

                a.state.inject({
                    pending: object
                });
                a.route.go('/render');
            },
            'button.cancel | click': function() {
                a.route.go('/visual/clean');
            }
        },
        postLoad: function() {
            var listing = this.data.listing;

            // If listing is empty (does not contains any relations
            // or has no table), print a message.
            if(listing == null || listing.length == 0) {
                smoke.alert('The listing received from server is empty, please check config.php file and/or your database tables.');
            }

            if('error' in listing) {
                smoke.alert('SQL error: ' + listing['error']);
            }
        },
        children: {
            id: 'visual-step',
            entry: 'div.content',
            type: 'append',
            include: {
                html: 'resources/html/visual/step.html'
            },
            data: {
                id: function(chain) {
                    chain.next(counter++);
                },
                // If it's the first element included or not
                first: function(chain) {
                    chain.next($(this.parent.entry).find(this.entry)
                                                .children().length == 0);
                },
                // Know if we should see or not the separator element
                separator: function(chain) {
                    var s = $(this.parent.entry).find(this.entry)
                                                .children().length;
                    chain.next((s == 0) ? 'none': 'block');
                }
            },
            bind: {
                'a.remove | click': function(e) {
                    var root = $(e.target).closest('fieldset.table');
                    if(root.next().length > 0) {
                        root.next('.separator').remove();
                    } else {
                        root.prev('.separator').remove();
                    }
                    root.remove();
                },
                'button.popup-auto | click': function(e) {
                    e.preventDefault();
                    var root     = $(e.target).closest('fieldset.table'),
                        prev     = root.prevUntil('fieldset.table').prev().last(),
                        previous = '';

                    // Getting previous table if possible
                    if(prev.length > 0) {
                        previous = prev.find('select.quick-table').val();
                    }

                    // If previous is empty, this popup is 100% useless...
                    if(!previous) {
                        if(prev.length == 0) {
                            smoke.alert('Cannot use this on first step, please try with second step');
                            return;
                        } else {
                            smoke.alert('You need to select a table on previous step before');
                            return;
                        }
                    }

                    var linking = this.parent.data.listing,
                        foreigns = getLinkedForeigns(previous, linking),
                        tables = getLinkedTables(previous, foreigns);

                    if(tables.length == 0) {
                        smoke.alert('There is no possible link, the table ' + previous + ' has no dependencies...');
                        return;
                    }

                    var html     = $('div.template[data-template-id="visual-create-auto"]').clone().removeClass('hidden'),
                        select   = html.find('select.auto-table'),
                        internal = html.find('.internal'),
                        valid    = html.find('.valid'),
                        content  = html.find('.append');

                    // Just to be sure
                    internal.html('');

                    // We populate html with founded tables
                    for(var i = 0, l = tables.length; i < l; ++i) {
                        select.append($('<option value="' + tables[i] + '">' + tables[i] + '</option>'));
                    }

                    // When the user select a table, we search for link
                    // and purpose one or more binding
                    select.on('change', function(e) {
                        internal.html('');
                        var value = select.val(),
                            subForeigns = getSubLinkedForeigns(value, foreigns);

                        if (subForeigns.length >= 1) {
                            content.html('<p>We find the following relation: ' + subForeigns[0].foreign + ' = '
                                    + subForeigns[0].reference);
                            internal.html(getRelatedSQL(previous, subForeigns[0]));

                            // We update the height (stupid system)
                            var win = select.closest('.window'),
                                newHeight = win.find('.caption').height() +
                                    win.find('.template').height();

                            // 20: template padding + new padding
                            win.height(newHeight + 35);
                        }
                    });

                    // We run select change for a first time
                    select.trigger('change');

                    valid.on('click', function(e) {
                        e.preventDefault();

                        // Something valid has been setted
                        if(internal.html() != '') {
                            root.find('select.quick-table').val(select.val());
                            root.find('input.quick-query').val(internal.html());
                        }

                        $.Dialog.close();
                    })

                    $.Dialog({
                        overlay: true,
                        shadow: true,
                        flat: true,
                        title: 'Auto configure',
                        height: 'auto',
                        content: '',
                        onShow: function(_dialog) {
                            var content = _dialog.children('.content');
                            content.html(html);
                        }
                    });
                },
                'button.erase | click': function(e) {
                    e.preventDefault();
                    var target = $(e.target);
                    // Get the textbox
                    target.prev().val('');
                },
                'select.quick-table | change': function(e) {
                    var target   = $(e.target),
                        value    = target.val(),
                        root     = target.closest('fieldset.table'),
                        prev     = root.prevUntil('fieldset.table').prev().last(),
                        previous = '';

                    // Getting previous table if possible
                    if(prev.length > 0) {
                        previous = prev.find('select.quick-table').val();
                    }

                    if(!previous) {
                        return;
                    }

                    var linking     = this.parent.data.listing,
                        foreigns    = getLinkedForeigns(previous, linking),
                        tables      = getLinkedTables(previous, foreigns),
                        subForeigns = getSubLinkedForeigns(value, foreigns);

                    if (subForeigns.length >= 1) {
                        root.find('.quick-query').val(getRelatedSQL(previous, subForeigns[0]));
                    } else {
                        root.find('.quick-query').val('');
                    }
                },
                'input.quick | change': function(e) {
                    var target = $(e.target),
                        root = target.closest('fieldset.table'),
                        d = 'disabled';

                    root.find('select.quick-table').attr(d, false);
                    root.find('textarea.custom-query').attr(d, true);
                    root.find('input.quick-query').attr(d, false);
                },
                'input.custom | change': function(e) {
                    var target = $(e.target),
                        root = target.closest('fieldset.table'),
                        d = 'disabled',
                        textarea = root.find('textarea.custom-query');

                    textarea.attr(d, false);
                    root.find('select.quick-table').attr(d, true);
                    root.find('input.quick-query').attr(d, true);

                    // When textarea is empty, we fill it with
                    // data from quick
                    if(!textarea.val()) {
                        textarea.val('SELECT * FROM ' +
                            root.find('select.quick-table').val() +
                            ' WHERE ' + root.find('input.quick-query').val())
                    }
                }
            },
            postLoad: function() {
                // We append tables to select.quick-table
                var listing      = this.parent.data.listing,
                    root         = $('fieldset[data-step-id="' + this.data.id + '"]'),
                    select       = root.find('select.quick-table'),
                    firstName    = '',
                    firstContent = null,
                    primaryQuery = '';

                for(var table in listing) {
                    if(!firstName) {
                        firstName = table;
                        firstContent = listing[table];
                    }
                    select.append('<option value="' + table + '">' + table + '</option>');
                }

                // Searching the select for the first element
                if(firstContent != null) {
                    var primaries = firstContent['primaries'];

                    for(var i = 0, l = primaries.length; i < l; ++i) {
                        if(i != 0) {
                            primaryQuery += ' AND ';
                        }
                        primaryQuery += '`' + primaries[i] + '` = 1';
                    }
                }

                root.find('textarea.custom-query').val('');

                if(this.data.first) {
                    root.find('input.quick-query').val('`id` = 1');
                }
            }
        }
    });

    a.state.add({
        id: 'visual-clean',
        hash: '/visual/clean',
        preLoad: function() {
            counter = 0;
            a.route.go('/home');
        }
    });
})();