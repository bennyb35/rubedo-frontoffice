angular.module("rubedoBlocks").lazy.controller("CalendarController",["$scope","$route","RubedoContentsService","$element",function($scope,$route,RubedoContentsService, $element){
    var me = this;

    var config = $scope.blockConfig;
    var pageId=$scope.rubedo.current.page.id;
    var siteId=$scope.rubedo.current.site.id;
    me.contents = [];
    me.calendarId = 'block-'+$scope.block.id+'-calendar';
    var options = {
        dateFieldName: config['date'],
        endDateFieldName: config['endDate'],
        limit: 1000,
        'fields[]':['text',config['date'],config['endDate'],'summary','image']
    };
    me.getContents = function (queryId, pageId, siteId, options, cb){
        RubedoContentsService.getContents(queryId,pageId,siteId, options).then(function(response){
            if (response.data.success){
                cb(response.data);
            }
        })
    };
    me.init = function(){
        me.calendar = $element.find('#'+me.calendarId);
        me.calendar.fullCalendar({
            lang: $route.current.params.lang,
            weekMode: 'liquid',
            timezone: false,
            viewRender: function(view){
                options.date = moment(view.start.format()).unix();
                options.endDate = moment(view.end.format()).unix();
                if(config.query){
                    me.getContents(config.query, pageId, siteId, options, function(data){
                        me.contents = data.contents;
                        var newEvents = [];
                        angular.forEach(me.contents,function(content){
                            var event = {};
                            event.title = content.fields.text;
                            event.start = moment.unix(content.fields[config['date']]).format('YYYY-MM-DD');
                            event.end = content.fields[config['endDate']]?
                                moment.unix(content.fields[config['endDate']]).format('YYYY-MM-DD'):
                                moment.unix(content.fields[config['date']]).format('YYYY-MM-DD');
                            newEvents.push(event);
                        });
                        me.calendar.fullCalendar('removeEvents');
                        me.calendar.fullCalendar('addEventSource', newEvents);
                        me.calendar.fullCalendar('refetchEvents');
                    });
                }
            }
        });
    };
}]);