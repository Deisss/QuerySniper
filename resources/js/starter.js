// This part allow system to startup (decide what to startup, in which situation)
/*
-------------------------------
  GLOBAL ERROR CATCH
-------------------------------
*/
(function() {
    var oldErrorHandler = window.onerror;
    if(a.environment.get('debug') === true) {
        window.onerror = function(message, url, line) {
            if(oldErrorHandler) {
                return oldErrorHandler(message, url, line);
            }

            BootstrapDialog.show({
                type: BootstrapDialog.TYPE_DANGER,
                title: 'DEBUG MODE - Error',
                message: 'Message: ' + message + '\n url: ' + url + '\n line: ' + line
            });
            return false;
        };
    }
})();


/*
-------------------------------
  HANDLEBARS
-------------------------------
*/
Handlebars.registerHelper('select', function( value, options ){
    var $el = $('<select />').html( options.fn(this) );
    $el.find('[value*="' + value + '"]').attr({'selected':'selected'});
    return $el.html();
});
Handlebars.registerHelper('debug', function(optionalValue) {
    console.log('===== CONTEXT ======');
    console.log(this);
 
    if(!a.isUndefined(optionalValue)) {
        console.log('====== VALUE =======');
        console.log(optionalValue);
    }
});


/*
-------------------------------
  APPSTORM
-------------------------------
*/
// Handling start
(function() {
    // Environment setup
    a.environment.set('console', 'warn');
    a.environment.set('verbose', 1);

    // Form setup
    a.form.skipNoValidate = true;

    // Hash starter
    var currentHash = a.hash.getHash(),
        timerId = null,
        max = 1000;

    // Initialise page event hash system
    a.hash.setPreviousHash('');
    window.location.href = '#';

    /**
     * handle "state change" for every browser
    */
    function firstHandle() {
        if(a.hash.getHash() !== currentHash) {
            a.route.go(currentHash);
            max = 0;
        }
        if(max-- <= 0) {
            a.timer.remove(timerId);
        }
    };

    // The main starter is here, we will customize it soon
    if(currentHash === null || currentHash === '' || !a.state.hashExists(currentHash)) {
        currentHash = '/home';
    }

    // Some browser don't get hash change with onHashchange event, so we decide to use timer
    // Note : a.page.event.hash is more complex, here is little example
    timerId = a.timer.add(firstHandle, null, 10);
})();


// Handling appstorm state change
(function() {
    a.message.bind('a.state.begin', function() {
        $('#page-loading').css('display', 'inline-block');
    });
    a.message.bind('a.state.error', function() {
        $('#page-loading').css('display', 'none');
    });
    a.message.bind('a.state.end', function() {
        $('#page-loading').css('display', 'none');
    });
})();