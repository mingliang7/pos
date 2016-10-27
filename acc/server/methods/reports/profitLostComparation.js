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

            var startYear = fDate.getFullYear();
            var startDate = moment('01-01-' + startYear, "DD/MM/YYYY").toDate();

            let startMonth = (fDate.getMonth()) + 1;
            let endMonth = (moment(date[1], 'DD/MM/YYYY').toDate().getMonth()) + 1;

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


            let contentProfit = Meteor.call("getProfitLostComparation", selector, self.showNonActive,baseCurrency,endMonth,startYear,params.exchangeDate);
            let incomeTotalList = Meteor.call("getIncomeGroupByMonth", selector,baseCurrency,params.exchangeDate);
            let expenseTotalList = Meteor.call("getExpenseGroupByMonth", selector,baseCurrency,params.exchangeDate);

            //Total
            incomeTotalList.sort(compare);
            expenseTotalList.sort(compare);


            let totalIncome = "<tr><td><b>Total Income</td>";
            let totalExpense = "<tr><td><b>Total Expense</b></td>";
            let netProfit = "<tr><td><b>Net Income</b></td>";
            let grandTotalIncome = 0;
            let grandTotalExpense = 0;
            let grandTotalNetIncome = 0;
            let accountTypeGrand = "";
            let m = startMonth;
            let n = startMonth;

            let lastTotalIncome = startMonth;
            let lastTotalExpense = startMonth;

            let netProfitList = [];

            incomeTotalList.forEach(function (obj) {

                for (let k = m; k <= endMonth; k++) {
                    if (k == obj._id.month) {

                        totalIncome += "<td><b>" + numeral(-obj.value).format("(0,00.00)") + "</b></td>";
                        grandTotalIncome += (-obj.value);
                        lastTotalIncome = obj._id.month + 1;

                        netProfitList.push({month: k, value: obj.value});


                        m = obj._id.month + 1;
                        accountTypeGrand = obj._id.accountType;
                        return false;
                    } else {
                        totalIncome += "<td><b>" + 0 + "</b></td>";
                        lastTotalIncome = obj._id.month + 1;
                        netProfitList.push({month: k, value: 0});


                    }
                }
            })

            expenseTotalList.forEach(function (obj) {
                for (let k = n; k <= endMonth; k++) {
                    if (k == obj._id.month) {
                        totalExpense += "<td><b>" + numeral(obj.value).format("(0,00.00)") + "</b></td>";
                        grandTotalExpense += obj.value;
                        lastTotalExpense = obj._id.month + 1;

                        netProfitList.push({month: k, value: obj.value});


                        n = obj._id.month + 1;
                        accountTypeGrand = obj._id.accountType;
                        return false;
                    } else {

                        totalExpense += "<td><b>" + 0 + "</b></td>";
                        lastTotalExpense = obj._id.month + 1;

                        netProfitList.push({month: k, value: 0});

                    }
                }
            })


            for (let i = m; i <= endMonth; i++) {
                totalIncome += '<td><b>' + 0 + '</b></td>';
                lastTotalIncome = i + 1;

                netProfitList.push({month: i, value: 0});
            }
            for (let i = n; i <= endMonth; i++) {
                totalExpense += '<td><b>' + 0 + '</b></td>';
                lastTotalExpense = i + 1;

                netProfitList.push({month: i, value: 0});
            }


            for (let i = lastTotalIncome; i <= endMonth; i++) {
                totalIncome += '<td><b>' + 0 + '</b></td>';

                netProfitList.push({month: i, value: 0});

            }

            for (let i = lastTotalExpense; i <= endMonth; i++) {
                totalExpense += '<td><b>' + 0 + '</b></td>';

                netProfitList.push({month: i, value: 0});
            }


            totalIncome += "<td><b>" + numeral(grandTotalIncome).format("(0,00.00)") + "</b></td></tr>";
            totalExpense += "<td><b>" + numeral(grandTotalExpense).format("(0,00.00)") + "</b></td></tr>";

            let arrProfitLost = [];
            netProfitList.reduce(function (key, val) {
                if (!key[val.month]) {
                    key[val.month] = {
                        month: val.month,
                        value: val.value
                    };
                    arrProfitLost.push(key[val.month]);
                } else {
                    key[val.month].value += val.value;
                }
                return key;
            }, {});

            arrProfitLost.forEach(function (obj) {
                netProfit += "<td><b>" + numeral(-obj.value).format("(0,00.00)") + "</b></td>";
                grandTotalNetIncome += obj.value;
            })


            netProfit += "<td><b>" + numeral(-grandTotalNetIncome).format("(0,00.00)") + "</b></td></tr>";


            //Detail
            let contentProfitList=[];
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

                    contentProfitList.push(key[val._id.account + val._id.month + val._id.year]);
                } else {
                    key[val._id.account + val._id.month + val._id.year].value += val.value;
                }
                return key;
            }, {});


            contentProfitList.sort(sortTowParam);

            let content = '<table class="report-content">'
                + '             <thead class="report-content-header">'
                + '                  <tr>'
                + '                     <th>Account Name</th>'


            for (let i = startMonth; i <= endMonth; i++) {
                content += '<th>' + getMonthName(i) + '</th>';
            }

            content += '                     <th>សរុប</th>'
                + '                  </tr>'
                + '             </thead>'
                + '             <tbody class="report-content-body">';


            let income = '      <tr>'
                + '                 <td colspan="14"><b>Income</b></td>'
                + '              </tr>'

            let exense = '      <tr>'
                + '                 <td colspan="14"><b>Expense</b></td>'
                + '              </tr>'


            let codeTemp = "";
            let j = startMonth;
            let accountType = "";

            let subTotalByAccount = 0;

            contentProfitList.forEach(function (obj) {


                //To show column don't have value and subtotal by account
                if (codeTemp != obj.code) {

                    if (codeTemp != "") {
                        for (let i = j; i <= endMonth; i++) {
                            if (accountType == "40" || accountType == "41") {
                                income += '<td>' + 0 + '</td>';
                            } else if (accountType == "50" || accountType == "51") {
                                exense += '<td>' + 0 + '</td>';
                            }
                        }


                        if (accountType == "40" || accountType == "41") {
                            income += '<td>' + numeral(subTotalByAccount).format("(0,00.00)") + '</td></tr>';
                        } else if (accountType == "50" || accountType == "51") {
                            exense += '<td>' + numeral(subTotalByAccount).format("(0,00.00)") + '</td></tr>';
                        }

                        subTotalByAccount = 0;
                    }

                    if (obj.accountTypeId == "40" || obj.accountTypeId == "41") {
                        income += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + obj.code + " | " + obj.name;
                    } else if (obj.accountTypeId == "50" || obj.accountTypeId == "51") {
                        exense += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + obj.code + " | " + obj.name;
                    }
                    j = startMonth;
                }

                //TO show all column that have value
                for (let i = j; i <= endMonth; i++) {
                    if (obj.month == i) {

                        //To show column that have value
                        if (obj.accountTypeId == "40" || obj.accountTypeId == "41") {
                            income += '<td>' + numeral(-obj.value).format("(0,00.00)") + '</td>';
                            subTotalByAccount += -obj.value;
                        } else if (obj.accountTypeId == "50" || obj.accountTypeId == "51") {
                            exense += '<td>' + numeral(obj.value).format("(0,00.00)") + '</td>';
                            subTotalByAccount += obj.value;
                        }

                        codeTemp = obj.code;
                        j = 1 + obj.month;
                        accountType = obj.accountTypeId;
                        return false;
                    } else {

                        //To show column don't have value before column that have value
                        if (obj.accountTypeId == "40" || obj.accountTypeId == "41") {
                            income += '<td>' + 0 + '</td>';
                        } else if (obj.accountTypeId == "50" || obj.accountTypeId == "51") {
                            exense += '<td>' + 0 + '</td>';
                        }
                    }
                }
            });


            //To show the last column that don't have value
            if (codeTemp != "") {
                for (let i = j; i <= endMonth; i++) {
                    if (accountType == "40" || accountType == "41") {
                        income += '<td>' + 0 + '</td>';
                    } else if (accountType == "50" || accountType == "51") {
                        exense += '<td>' + 0 + '</td>';
                    }
                }


                if (accountType == "40" || accountType == "41") {
                    income += '<td>' + numeral(subTotalByAccount).format("(0,00.00)") + '</td></tr>';
                } else if (accountType == "50" || accountType == "51") {
                    exense += '<td>' + numeral(subTotalByAccount).format("(0,00.00)") + '</td></tr>';
                }
            }


            content += income + totalIncome + exense + totalExpense + netProfit + '</tbody></table>';
            data.content = content;
            return data;
        }
    }
});

let sortTowParam = function (a, b) {
    if (a.code == b.code) {
        return (a.month < b.month) ? -1 : (a.month > b.month) ? 1 : 0;
    }
    else {
        return (a.code < b.code) ? -1 : 1;
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


let getMonthName = (number) => {
    let month = '';
    switch (number) {
        case 1:
            month = 'មករា'
            break;
        case 2:
            month = 'កុម្ភៈ​'
            break;
        case 3:
            month = 'មិនា'
            break;
        case 4:
            month = 'មេសា'
            break;
        case 5:
            month = 'ឧសភា'
            break;
        case 6:
            month = 'មិថុនា'
            break;
        case 7:
            month = 'កក្កដា'
            break;
        case 8:
            month = 'សីហា'
            break;
        case 9:
            month = 'កញ្ញា'
            break;
        case 10:
            month = 'តុលា'
            break;
        case 11:
            month = 'វិច្ឆិកា'
            break;
        case 12:
            month = 'ធ្នូ'
            break;

    }
    return month;
}


