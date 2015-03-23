(function() {
a.state.add({
    id: 'home',
    hash: '/home',
    entry: '#page-container',
    type:  'replace',
    include: {
        html: 'resources/html/home.html'
    }
});
})();