//npm
//schema
import {selectReport} from '../../api/collections/reports/mainReport';
//pages
import './main.html';

let indexTmpl = Template.Pos_mainReport;

indexTmpl.helpers({
    schema(){
        return selectReport;
    },
    selectOptions(){
        return [
            {
                label: 'Invoice', value: 'invoiceReport'
            },
            {
                label: 'Receive Payment', value: 'paymentReport'
            },
            {
                label: 'Stock Balance', value: 'stockBalance'
            },
            {
                label: 'Location Transfer', value: 'locationTransfer'
            },
            {
                label: 'Bill', value: 'bill'
            },
            {
                label: 'Prepaid Order', value: 'prepaidOrder'
            },
            {
                label: 'Sale Order', value: 'saleOrder'
            }
        ]
    }
});

indexTmpl.events({
    'change [name="goToReport"]'(event,instance){
        if(event.currentTarget.value != ''){
            FlowRouter.go(getDefaultReportParams(event.currentTarget.value));
        }
    }
});

function getDefaultReportParams(reportName) {
    let params = '';
    switch(reportName){
        case 'invoiceReport':
            params = `/pos/report/invoice?date=${moment().format('YYYY-MM-DD 00:00:00')},${moment().format('YYYY-MM-DD 23:59:59')}`
            break;
        case 'paymentReport':
            params = `/pos/report/payment?date=${moment().format('YYYY-MM-DD 00:00:00')},${moment().format('YYYY-MM-DD 23:59:59')}`;
            break;
        case 'stockBalance':
            params = `/pos/report/stockBalance?date=${moment().format('YYYY-MM-DD 23:59:59')}&branch=${Session.get('currentBranch')}`;
            break;
        case 'locationTransfer':
            params = `/pos/report/locationTransfer?date=${moment().format('YYYY-MM-DD 00:00:00')},${moment().format('YYYY-MM-DD 23:59:59')}&fromBranch=${Session.get('currentBranch')}`;
            break;
        case 'bill':
            params = `/pos/report/billReport?date=${moment().format('YYYY-MM-DD 00:00:00')},${moment().format('YYYY-MM-DD 23:59:59')}&branch=${Session.get('currentBranch')}`;
            break;
        case 'prepaidOrder':
            params = `/pos/report/prepaidOrderReport?date=${moment().format('YYYY-MM-DD 00:00:00')},${moment().format('YYYY-MM-DD 23:59:59')}&branch=${Session.get('currentBranch')}`;
            break;
        case 'saleOrder':
            params = `/pos/report/saleOrderReport?date=${moment().format('YYYY-MM-DD 00:00:00')},${moment().format('YYYY-MM-DD 23:59:59')}&branch=${Session.get('currentBranch')}`;
            break;
    }
    return params;
}
