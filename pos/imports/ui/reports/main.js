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
            params = `/pos/report/invoice?date=${moment().format('YYYY-MM-DD 00:00:00')},${moment().format('YYYY-MM-DD 11:59:59')}`
    }
    return params;
}