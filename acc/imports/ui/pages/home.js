import {Template} from 'meteor/templating';
import {AutoForm} from 'meteor/aldeed:autoform';
import {Roles} from  'meteor/alanning:roles';
import {alertify} from 'meteor/ovcharik:alertifyjs';
import {sAlert} from 'meteor/juliancwirko:s-alert';
import {fa} from 'meteor/theara:fa-helpers';
import {lightbox} from 'meteor/theara:lightbox-helpers';
import {TAPi18n} from 'meteor/tap:i18n';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';
import {moment} from 'meteor/momentjs:moment';

// Lib
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
import {reactiveTableSettings} from '../../../../core/client/libs/reactive-table-settings.js';
import {renderTemplate} from '../../../../core/client/libs/render-template.js';
import {destroyAction} from '../../../../core/client/libs/destroy-action.js';
import {displaySuccess, displayError} from '../../../../core/client/libs/display-alert.js';
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';

// Component
import '../../../../core/client/components/loading.js';
import '../../../../core/client/components/column-action.js';
import '../../../../core/client/components/form-footer.js';

import './home.html';

// Declare template


var indexTpl = Template.acc_chartDailyIncomeExpense;


var Highcharts = require('highcharts/highstock');

indexTpl.onRendered(function () {

});

indexTpl.events({})

if (Meteor.isClient) {
    indexTpl.helpers({
        createChartDailyIncomeExpense: function () {

            Meteor.call('chart_dailyIncomeExpense', function (err,obj) {
                console.log(obj);
                if (obj != undefined) {
                    Meteor.defer(function () {
                        // Create standard Highcharts chart with options:
                        Highcharts.chart('dailyIncomeExpense', {
                            chart: {
                                type: 'column'
                            },

                            title: {
                                text: 'Daily Income Expense'
                            },

                            xAxis: {
                                categories: obj[1].dayList
                            },

                            yAxis: {
                                allowDecimals: true,
                                title: {
                                    text: 'Value'
                                }
                            },

                            tooltip: {
                                formatter: function () {
                                    return '<b>' + this.x + '</b><br/>' +
                                        this.series.name + ': ' + this.y + '<br/>' +
                                        'Total: ' + this.point.stackTotal;
                                }
                            },

                            plotOptions: {
                                column: {
                                    stacking: 'normal'
                                }
                            },
                            credits: {
                                enabled: false
                            },
                            series: [{
                                name: 'Income',
                                data: obj[0].thb,
                                stack: 'daily'
                            }, {
                                name: 'Expense',
                                data: obj[1].thb,
                                stack: 'daily'
                            }]
                        })
                    })
                }
            })

        }

    })
}

indexTpl.onDestroyed(function () {
    Session.set('chart', undefined);
});


