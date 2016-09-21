import {Template} from  'meteor/templating';
import {TAPi18n} from 'meteor/tap:i18n';

// Chart js
import Chart from 'chart.js';

// Highcharts
import Highcharts from 'highcharts';
// Load module after Highcharts is loaded
require('highcharts/modules/exporting')(Highcharts);
// collection
import {EnterBills} from '../../api/collections/enterBill';
import {PayBills} from '../../api/collections/payBill';
import {Invoices} from '../../api/collections/invoice';
import {GroupInvoice} from '../../api/collections/groupInvoice';
import {ReceivePayment} from '../../api/collections/receivePayment';
import {GroupBill} from '../../api/collections/groupBill';
// Method
// Page
import './home.html';

// Declare template
let indexTmpl = Template.Pos_home;
let income = new ReactiveVar();
let dashboardTransactionType = new ReactiveVar('invoice');
let dashboardTransactionData = new ReactiveVar(false);
indexTmpl.onCreated(function () {
    dashboardTransactionType.set('invoice');
    this.isLoading = new ReactiveVar(true);
    this.autorun(()=> {
        let type = dashboardTransactionType.get();
        if (type == 'invoice' || type == 'receivePayment' || type == 'groupInvoice' || type == 'enterBill' || type == 'payBill' || type == 'groupBill') {
            this.subscription = Meteor.subscribe(`pos.${type}TransactionIn7days`, {limit: 10});
        }
    });
});

indexTmpl.onRendered(function () {
    this.autorun(()=> {
        if (this.subscription.ready()) {
            dashboardTransactionData.set(true);
        }
    });
    this.autorun(()=> {

        Meteor.call('posChart', {}, (err, result)=> {
            // let orders =[
            //     {name: 'Mon', y: 1900},
            //     {name: 'Tue', y: 1500},
            //     {name: 'Wed', y: 2200},
            //     {name: 'Thu', y: 1700},
            //     {name: 'Fri', y: 3000},
            //     {name: 'Sat', y: 2500}
            // ];

            let chartOpts = {
                chart: {
                    type: 'column'
                },
                title: {
                    text: 'វិក័យប័ត្រលក់សរុបប្រចាំខែ(Monthly Invoice)'
                },
                subtitle: {
                    text: `${result.company}`
                },
                xAxis: {
                    type: 'category'
                },
                yAxis: {
                    title: {
                        text: 'Amount'
                    }

                },
                legend: {
                    enabled: false
                },
                plotOptions: {
                    series: {
                        borderWidth: 0,
                        dataLabels: {
                            enabled: true,
                            format: '{point.y:.2f}$'
                        }
                    }
                },
                tooltip: {
                    headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
                    pointFormat: '<span style="color:{point.color}">{point.name}</span>: <b>{point.y:.2f}$</b><br/>'
                },

                series: [{
                    name: 'AMOUNT',
                    colorByPoint: true,
                    data: result.invoices
                }],
            };

            this.$('#container').highcharts(chartOpts);

            // Stop loading
            this.isLoading.set(false);


        });
        Meteor.call('incomeFn', function (err, result) {
            if (result) {
                income.set(result);
            } else {
                console.log(err);
            }
        });
    });


    // var ctx = document.getElementById("myChart");
    // var myChart = new Chart(ctx, {
    //     type: 'bar',
    //     data: {
    //         labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
    //         datasets: [{
    //             label: '# of Votes',
    //             data: [12, 19, 3, 5, 2, 3],
    //             backgroundColor: [
    //                 'rgba(255, 99, 132, 0.2)',
    //                 'rgba(54, 162, 235, 0.2)',
    //                 'rgba(255, 206, 86, 0.2)',
    //                 'rgba(75, 192, 192, 0.2)',
    //                 'rgba(153, 102, 255, 0.2)',
    //                 'rgba(255, 159, 64, 0.2)'
    //             ],
    //             borderColor: [
    //                 'rgba(255,99,132,1)',
    //                 'rgba(54, 162, 235, 1)',
    //                 'rgba(255, 206, 86, 1)',
    //                 'rgba(75, 192, 192, 1)',
    //                 'rgba(153, 102, 255, 1)',
    //                 'rgba(255, 159, 64, 1)'
    //             ],
    //             borderWidth: 1
    //         }]
    //     },
    //     options: {
    //         scales: {
    //             yAxes: [{
    //                 ticks: {
    //                     beginAtZero:true
    //                 }
    //             }]
    //         }
    //     }
    // });
});

indexTmpl.helpers({
    isLoading(){
        return Template.instance().isLoading.get();
    },
    income(){
        let incomeObj = income.get();
        return incomeObj;
    },
    data(){
        let getDate = dashboardTransactionData.get();
        if (getDate) {
            let type = dashboardTransactionType.get();
            let data;
            switch (type) {
                case 'invoice':
                    data = Invoices.find({}, {sort: {invoiceDate: -1}});
                    break;
                case 'enterBill':
                    data = EnterBills.find({}, {sort: {enterBillDate: -1}});
                    break;
                case 'receivePayment':
                    data = ReceivePayment.find({}, {sort: {paymentDate: -1}});
                    break;
                case 'payBill':
                    data = PayBills.find({}, {sort: {paymentDate: -1}});
                    break;
                case 'groupInvoice':
                    data = GroupInvoice.find({}, {sort: {startDate: -1}});
                    break;
                case 'groupBill':
                    data = GroupBill.find({}, {sort: {startDate: -1}});
                    break;
            }
            return data;
        }
        return false;
    },
    isData(data){
        return data.count() > 0;
    },
    checkTypeOfDate(){
        let type = dashboardTransactionType.get();
        let date;
        switch (type) {
            case 'invoice':
                date = moment(this.invoiceDate).format('YYYY-MM-DD HH:mm:ss');
                break;
            case 'enterBill':
                date = moment(this.enterBillDate).format('YYYY-MM-DD HH:mm:ss');
                break;
            case 'receivePayment':
                date = moment(this.paymentDate).format('YYYY-MM-DD HH:mm:ss')
                break;
            case 'payBill':
                date = moment(this.paymentDate).format('YYYY-MM-DD HH:mm:ss');
                break;
            case 'groupInvoice':
                date = moment(this.startDate).format('YYYY-MM-DD') + ' to ' + moment(this.endDate).format('YYYY-MM-DD');
                break;
            case 'groupBill':
                date = moment(this.startDate).format('YYYY-MM-DD') + ' to ' + moment(this.endDate).format('YYYY-MM-DD');
                break;

        }
        return date;
    }

});
indexTmpl.onDestroyed(function () {
    dashboardTransactionData.set(false);
});
indexTmpl.events({
    'change .select-transaction'(event, instance){
        dashboardTransactionData.set(false);
        dashboardTransactionType.set(event.currentTarget.value);
    }
});
