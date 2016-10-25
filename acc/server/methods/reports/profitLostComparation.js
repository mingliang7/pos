import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';

// Collection
import {Company} from '../../../../core/imports/api/collections/company.js';
import {Setting} from '../../../../core/imports/api/collections/setting';

import {CloseChartAccount} from '../../../imports/api/collections/closeChartAccount';
import {ChartAccount} from '../../../imports/api/collections/chartAccount';
import {SpaceChar} from '../../../common/configs/space';

Meteor.methods({
    acc_profitLostComparation: function (params) {
        if (!this.isSimulation) {
            var data = {
                title: {},
                header: {},
                content: [{
                    index: 'No Result'
                }],
                footer: {}
            };

            var date = s.words(params.date, ' - ');
            var fDate = moment(date[0], 'DD/MM/YYYY').toDate();
            var tDate = moment(date[1], 'DD/MM/YYYY').add(1, 'days').toDate();

            var startYear = new Date(fDate).getFullYear();
            var startDate = moment('01-01-' + startYear, "DD/MM/YYYY").toDate();

            /****** Title *****/
            data.title = Company.findOne();

            /****** Header *****/
            data.header = params;
            /****** Content *****/

            var self = params;
            var selector = {};


            if (!_.isEmpty(self.date)) {
                selector.journalDate = {
                    $gte: fDate,
                    $lt: tDate
                };
            }


            if (self.currencyId != "All") {
                selector.currencyId = self.currencyId;
            }
            if (self.branchId != "All") {
                selector.branchId = self.branchId;
            }

            if (self.currencyId != "All") {
                var baseCurrency = self.currencyId;
            } else {
                baseCurrency = Setting.findOne().baseCurrency;
            }


            var contentProfit = Meteor.call("getProfitLostComparation", selector, self.showNonActive);

            contentProfit.reduce(function (key, val) {
                if (!key[val._id.account + val._id.month + val._id.year]) {

                    key[val._id.account + val._id.month + val._id.year] = {
                        accountTypeId: val._id.accountTypeId,
                        name: val._id.name,
                        currency: val._id.currencyId,
                        code: val._id.code,
                        level: val._id.level,
                        month: val._id.month,
                        year: val._id.year,
                        value: val.value
                    };


                } else {
                    key[val.account + val._id.month + val._id.year].value += val.value;
                }
                return key;
            }, {});

            contentProfit.sort(sortTowParam);

            console.log(contentProfit);


            let content = '<table class="report-content">'
                + '             <thead class="report-content-header">'
                + '                  <tr>'
                + '                     <th>Account Name</th>'
                + '                     <th>មករា</th>'
                + '                     <th>កុម្ភះ</th>'
                + '                     <th>មិនា</th>'
                + '                     <th>មេសា</th>'
                + '                     <th>ឧសភា</th>'
                + '                     <th>មិថុនា</th>'
                + '                     <th>កក្កដា</th>'
                + '                     <th>សីហា</th>'
                + '                     <th>កញ្ញា</th>'
                + '                     <th>តុលា</th>'
                + '                     <th>វិច្ឆិកា</th>'
                + '                     <th>ធ្នូ</th>'
                + '                     <th>សរុប</th>'
                + '                  </tr>'
                + '             </thead>'
                + '             <tbody class="report-content-body">'


            let income = '      <tr>'
                + '                 <td><b>Income</b></td>'
                + '                     <td></td>'
                + '                     <td></td>'
                + '              </tr>;'

            let exense = '      <tr>'
                + '                 <td><b>Expense</b></td>'
                + '                     <td></td>'
                + '                     <td></td>'
                + '              </tr>;'


            let codeTemp = "";
            let j = 1;
            contentProfit.forEach(function (obj) {
                if (codeTemp != obj._id.code) {
                    income += '<tr><td>' + obj._id.code + " | " + obj._id.name;
                    exense += '<tr><td>' + obj._id.code + " | " + obj._id.name;
                } else {
                    if (codeTemp != "") {
                        income += '</tr>';
                        exense += '</tr>';
                    }
                    j = 1;

                }

                for (let i = j; i < 13; i++) {
                    if (obj._id.month == i) {
                        if (obj._id.accountTypeId == "40" || obj._id.accountTypeId == "41") {
                            income += '<td>' + obj.value + '</td>';
                        } else if (obj._id.accountTypeId == "50" || obj._id.accountTypeId == "51") {
                            exense += '<td>' + obj.value + '</td>';
                        }

                        codeTemp = obj._id.code;
                        j = 1 + obj._id.month;
                        
                        return false;
                    } else {
                        if (obj._id.accountTypeId == "40" || obj._id.accountTypeId == "41") {
                            income += '<td>' + 0 + '</td>';
                        } else if (obj._id.accountTypeId == "50" || obj._id.accountTypeId == "51") {
                            exense += '<td>' + 0 + '</td>';
                        }
                    }


                }




            });

            content += income + exense + '</tbody></table>';
            data.content = content;
            return data;
        }
    }
});

let sortTowParam = function (a, b) {
    if (a._id.code == b._id.code) {
        return (a._id.month < b._id.month) ? -1 : (a._id.month > b._id.month) ? 1 : 0;
    }
    else {
        return (a._id.code < b._id.code) ? -1 : 1;
    }
}
