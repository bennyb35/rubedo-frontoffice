angular.module("rubedoBlocks").lazy.controller('DirectoryController',["$scope","$location","$routeParams","RubedoSearchService",
    function($scope,$location,$routeParams,RubedoSearchService){
        var me = this;
        var config = $scope.blockConfig;
        var themePath="/theme/"+window.rubedoConfig.siteTheme;
        me.data = [];
        me.facets = [];
        me.activeFacets = [];
        me.start = 0;
        me.limit = $routeParams.limit?$routeParams.limit:10;
        me.orderBy = $routeParams.orderby?$routeParams.orderby:"_score";
        var resolveOrderBy = {
            '_score': $scope.rubedo.translate('Search.Label.OrderByRelevance'),
            'lastUpdateTime': $scope.rubedo.translate('Search.Label.OrderByDate'),
            'authorName': $scope.rubedo.translate('Search.Label.OrderByAuthor'),
            'text': $scope.rubedo.translate('Blocks.Search.Label.OrderByTitle')
        };
        me.displayOrderBy = $routeParams.orderby?resolveOrderBy[$routeParams.orderby]:$scope.rubedo.translate('Search.Label.OrderByRelevance');
        me.template = themePath+"/templates/blocks/directory/"+config.userDisplayMode+".html";
        me.activateSearch = config.activateSearch;
        me.alphabeticIndex =  config.alphabeticIndex;
        var predefinedFacets = config.predefinedFacets==""?{}:JSON.parse(config.predefinedFacets);
        var facetsId = ['objectType','type','damType','userType','author','userName','lastupdatetime','query'];
        var defaultOptions = {
            start: me.start,
            limit: me.limit,
            constrainToSite: config.constrainToSite,
            predefinedFacets: config.predefinedFacets,
            displayMode: config.displayMode,
            displayedFacets: config.displayedFacets,
            orderby: me.orderBy,
            pageId: $scope.rubedo.current.page.id,
            siteId: $scope.rubedo.current.site.id
        };
        if (config.profilePage){
            defaultOptions.profilePageId = config.profilePage;
        }
        var options = angular.copy(defaultOptions);
        var parseQueryParamsToOptions = function(){
            angular.forEach($location.search(), function(queryParam, key){
                if(typeof queryParam !== "boolean"){
                    if(key == 'taxonomies'){
                        options[key] = JSON.parse(queryParam);
                    } else {
                        if(key == 'query'){
                            me.query = queryParam;
                        }
                        options[key] = queryParam;
                    }
                }
            });
        };
        if(predefinedFacets.query) {
            me.query = options.query = predefinedFacets.query;
            $location.search('query',me.query);
        }
        $scope.$on('$routeUpdate', function(scope, next, current) {
            options = angular.copy(defaultOptions);
            options.start = me.start;
            options.limit = me.limit;
            options.orderBy = me.orderBy;
            parseQueryParamsToOptions();
            me.searchByQuery(options, true);
        });
        me.disabled = function(term){
            var disabled = false;
            angular.forEach(me.notRemovableTerms,function(notRemovableTerm){
                disabled = notRemovableTerm.term == term;
            });
        };
        me.changePageAction = function(){
            options.start = me.start;
            me.searchByQuery(options);
        };
        me.onSubmit = function(){
            me.start = 0;
            options = angular.copy(defaultOptions);
            options.start = me.start;
            options.limit = me.limit;
            options.query = me.query;
            options.orderBy = me.orderBy;
            $location.search('query',me.query);
        };
        me.changeOrderBy = function(orderBy){
            if(me.orderBy != orderBy){
                me.orderBy = orderBy;
                me.displayOrderBy = resolveOrderBy[orderBy];
                me.start = 0;
                $location.search('orderby',me.orderBy);
            }
        };
        me.changeLimit = function(limit){
            if(me.limit != limit){
                me.limit = limit;
                me.start = 0;
                $location.search('limit',me.limit);
            }
        };
        me.clickOnFacets =  function(facetId,term){
            if(term) {
                var del = false;
                angular.forEach(me.activeTerms, function (activeTerm) {
                    if (!del) {
                        del = (activeTerm.term == term && activeTerm.facetId == facetId);
                    }
                });
                if (del) {
                    if (facetsId.indexOf(facetId) == -1) {
                        options.taxonomies[facetId].splice(options.taxonomies[facetId].indexOf(term), 1);
                        if (options.taxonomies[facetId].length == 0) {
                            delete options.taxonomies[facetId];
                        }
                        if (Object.keys(options['taxonomies']).length == 0) {
                            $location.search('taxonomies', null);
                        } else {
                            $location.search('taxonomies', JSON.stringify(options.taxonomies));
                        }
                    } else if (facetId == 'query') {
                        $location.search('query', null);
                        delete options.query;
                    } else if (facetId == 'lastupdatetime') {
                        delete options[facetId];
                        $location.search(facetId, null);
                    } else {
                        if (angular.isArray(options[facetId + '[]'])) {
                            options[facetId + '[]'].splice(options[facetId + '[]'].indexOf(term), 1);
                        } else {
                            delete options[facetId + '[]'];
                        }
                        if (!options[facetId + '[]'] || options[facetId + '[]'].length == 0) {
                            $location.search(facetId + '[]', null)
                        } else {
                            $location.search(facetId + '[]', options[facetId + '[]']);
                        }
                    }
                } else {
                    if (facetsId.indexOf(facetId) == -1) {
                        if (!options.taxonomies) {
                            options.taxonomies = {};
                        }
                        if (!options.taxonomies[facetId]) {
                            options.taxonomies[facetId] = [];
                        }
                        options.taxonomies[facetId].push(term);
                        $location.search('taxonomies', JSON.stringify(options.taxonomies));
                    } else if (facetId == 'lastupdatetime') {
                        options[facetId] = term;
                        $location.search(facetId, options[facetId]);
                    } else {
                        if (!options[facetId + '[]']) {
                            options[facetId + '[]'] = [];
                        }
                        options[facetId + '[]'].push(term);
                        $location.search(facetId + '[]', options[facetId + '[]']);
                    }
                }
                me.start = 0;
                options.start = me.start;
            }
        };

        me.searchByQuery = function(options){
            RubedoSearchService.searchUsers(options).then(function(response){
                if(response.data.success){
                    var alphabetTerms = {'A':{label:'A'},'B':{label:'B'},'C':{label:'C'},'D':{label:'D'},'E':{label:'E'},
                        'F':{label:'F'},'G':{label:'G'},'H':{label:'H'},'I':{label:'I'},'J':{label:'J'},'K':{label:'K'},
                        'L':{label:'L'},'M':{label:'M'},'N':{label:'N'},'O':{label:'O'},'P':{label:'P'},'Q':{label:'Q'},
                        'R':{label:'R'},'S':{label:'S'},'T':{label:'T'},'U':{label:'U'},'V':{label:'V'},'W':{label:'W'},
                        'X':{label:'X'},'Y':{label:'Y'},'Z':{label:'Z'}};
                    me.query = response.data.results.query;
                    me.count = response.data.count;
                    me.data =  response.data.results.data;
                    me.facets = [];
                    angular.forEach(response.data.results.facets,function(facet){
                        if(facet.id == 'userName'){
                            me.alphabet = facet;
                            angular.forEach(me.alphabet.terms, function(term){
                                if(alphabetTerms[term.label]){
                                    alphabetTerms[term.label] = term;
                                }
                            });
                            me.alphabet.terms = alphabetTerms;
                        } else {
                            me.facets.push(facet);
                        }
                    });
                    me.notRemovableTerms = [];
                    me.activeTerms = [];
                    var previousFacetId;
                    response.data.results.activeFacets.forEach(function(activeFacet){
                        if(activeFacet.id != 'navigation'){
                            activeFacet.terms.forEach(function(term){
                                var newTerm = {};
                                newTerm.term = term.term;
                                newTerm.label = term.label;
                                newTerm.facetId = activeFacet.id;
                                if(previousFacetId == activeFacet.id){
                                    newTerm.operator =(activeFacet.operator);
                                } else if (previousFacetId && me.notRemovableTerms.length != 0){
                                    newTerm.operator = ', ';
                                }
                                if(predefinedFacets.hasOwnProperty(activeFacet.id) && predefinedFacets[activeFacet.id]==term.term){
                                    me.notRemovableTerms.push(newTerm);
                                } else {
                                    me.activeTerms.push(newTerm);
                                }
                                previousFacetId = activeFacet.id;
                            });
                        }
                    });
                }
            })
        };
        parseQueryParamsToOptions();
        me.searchByQuery(options);
    }]);
