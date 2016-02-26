angular.module("rubedoBlocks").lazy.controller("SearchFormControllerCustom",['$scope','$location','$log', 'RubedoPagesService',function($scope, $location, $log, RubedoPagesService){
    var me = this;
    var config = $scope.blockConfig;
    me.show = config.searchPage;
    me.placeholder = config.placeholder;
    me.onSubmit = function(){
        var paramQuery = me.query?'?query='+me.query:'';
        paramQuery +='&specialite='+me.query2;
        RubedoPagesService.getPageById(config.searchPage).then(function(response){
            if (response.data.success){
                $location.url(response.data.url+paramQuery);
            }
        });
    };
}]);