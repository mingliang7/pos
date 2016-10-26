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


            let contentProfit = Meteor.call("getProfitLostComparation", selector, self.showNonActive);
            let incomeExpenseTotal = Meteor.call("getProfitLostGroupByMonth", selector);

            //Total
            incomeExpenseTotal.sort(compare);
            let totalIncome = "<tr><td><b>Total Income</b></td>";
            let totalExpense = "<tr><td><b>Total Expense</b></td>";
            let netProfit = "<tr><td><b>Net Income</b></td>";
            let grandTotalIncome = 0;
            let grandTotalExpense = 0;
            let grandTotalNetIncome = 0;
            let accountTypeGrand = "";
            let m = 1;

            let lastTotalIncome=1;
            let lastTotalExpense=1;

            let netProfitList=[];


            incomeExpenseTotal.forEach(function (obj) {

                for (let k = m; k <= 12; k++) {
                    if (k == obj._id.month) {
                        if (obj._id.accountType == "Income") {
                            totalIncome += "<td>" + numeral(-obj.value).format("0,00.00") + "</td>";
                            grandTotalIncome += (-obj.value);
                            lastTotalIncome=obj._id.month+1;

                            netProfitList.push({"month": k, "value" :obj.value});

                        } else {
                            totalExpense += "<td>" + numeral(obj.value).format("0,00.00") + "</td>";
                            grandTotalExpense += obj.value;
                            lastTotalExpense=obj._id.month+1;

                            netProfitList.push({"month": k, "value" :obj.value});

                        }
                        m = 1 + obj._id.month;
                        accountTypeGrand = obj._id.accountType;
                        return false;
                    } else {
                        if (obj._id.accountType == "Income") {
                            totalIncome += "<td>" + 0 + "</td>";
                            lastTotalIncome=obj._id.month+1;

                            netProfitList.push({"month": k, "value" :0});


                        } else {
                            totalExpense += "<td>" + obj.value + "</td>";
                            lastTotalExpense=obj._id.month+1;

                            netProfitList.push({"month": k, "value" :0});


                        }
                    }
                }

            })


            for (let i = m; i <= 12; i++) {
                if (accountTypeGrand == "Income") {
                    totalIncome += '<td>' + 0 + '</td>';
                    lastTotalIncome=i+1;

                    netProfitList.push({"month": i, "value" :0});


                } else if (accountTypeGrand == "Expense") {
                    totalExpense += '<td>' + 0 + '</td>';
                    lastTotalExpense=i+1;

                    netProfitList.push({"month": i, "value" :0});


                }
            }


            for(let i=lastTotalIncome;i<=12;i++){
                totalIncome += '<td>' + 0 + '</td>';

                netProfitList.push({"month": i, "value" :0});

            }

            for(let i=lastTotalExpense;i<=12;i++){
                totalExpense += '<td>' + 0 + '</td>';

                netProfitList.push({"month": i, "value" :0});
            }


            totalIncome += "<td>" + numeral(grandTotalIncome).format("0,00.00") + "</td></tr>";
            totalExpense += "<td>" + numeral(grandTotalExpense).format("0,00.00") + "</td></tr>";

            console.log(netProfitList);

            netProfitList.reduce(function (key, val) {
                if (!key[val.month]) {
                    key[val.month] = {
                        month: val.month,
                        value: val.value
                    };
                } else {
                    key[val.month].value += val.value;
                }
                return key;
            }, {});

            console.log("Start");
            console.log(netProfitList);

            netProfitList.forEach(function (obj) {
                netProfit+="<td>"+numeral(-obj.value).format("0,00.00")+"</td>";
                grandTotalNetIncome+=obj.value;
            })


            netProfit+="<td>"+numeral(-grandTotalNetIncome).format("0,00.00")+"</td></tr>";


            //Detail
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
                + '                 <td colspan="14"><b>Income</b></td>'
                + '              </tr>'

            let exense = '      <tr>'
                + '                 <td colspan="14"><b>Expense</b></td>'
                + '              </tr>'


            let codeTemp = "";
            let j = 1;
            let accountType = "";

            let subTotalByAccount = 0;

            contentProfit.forEach(function (obj) {
                if (codeTemp != obj._id.code) {

                    if (codeTemp != "") {
                        for (let i = j; i <= 12; i++) {
                            if (obj._id.accountTypeId == "40" || obj._id.accountTypeId == "41") {
                                income += '<td>' + 0 + '</td>';
                            } else if (obj._id.accountTypeId == "50" || obj._id.accountTypeId == "51") {
                                exense += '<td>' + 0 + '</td>';
                            }
                        }


                        if (obj._id.accountTypeId == "40" || obj._id.accountTypeId == "41") {
                            income += '<td>' + numeral(subTotalByAccount).format("0,00.00") + '</td></tr>';
                        } else if (obj._id.accountTypeId == "50" || obj._id.accountTypeId == "51") {
                            exense += '<td>' + numeral(subTotalByAccount).format("0,00.00") + '</td></tr>';
                        }

                        subTotalByAccount = 0;
                    }

                    if (obj._id.accountTypeId == "40" || obj._id.accountTypeId == "41") {
                        income += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + obj._id.code + " | " + obj._id.name;
                    } else if (obj._id.accountTypeId == "50" || obj._id.accountTypeId == "51") {
                        exense += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + obj._id.code + " | " + obj._id.name;
                    }

                    j = 1;
                }

                for (let i = j; i < 13; i++) {
                    if (obj._id.month == i) {
                        if (obj._id.accountTypeId == "40" || obj._id.accountTypeId == "41") {
                            income += '<td>' + numeral(-obj.value).format("0,00.00") + '</td>';
                            subTotalByAccount += -obj.value;
                        } else if (obj._id.accountTypeId == "50" || obj._id.accountTypeId == "51") {
                            exense += '<td>' + numeral(obj.value).format("0,00.00") + '</td>';
                            subTotalByAccount += obj.value;
                        }

                        codeTemp = obj._id.code;
                        j = 1 + obj._id.month;
                        accountType = obj._id.accountTypeId;
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


            if (codeTemp != "") {
                for (let i = j; i <= 12; i++) {
                    if (accountType == "40" || accountType == "41") {
                        income += '<td>' + 0 + '</td>';
                    } else if (accountType == "50" || accountType == "51") {
                        exense += '<td>' + 0 + '</td>';
                    }
                }


                if (accountType == "40" || accountType == "41") {
                    income += '<td>' + numeral(subTotalByAccount).format("0,00.00") + '</td></tr>';
                } else if (accountType == "50" || accountType == "51") {
                    exense += '<td>' + numeral(subTotalByAccount).format("0,00.00") + '</td></tr>';
                }
            }


            content += income + totalIncome + exense + totalExpense + netProfit + '</tbody></table>';
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

let compare = function (a, b) {
    if (a._id.month < b._id.month) {
        return -1;
    } else if (a._id.month > b._id.month) {
        return 1;
    } else {
        return 0;
    }
}
