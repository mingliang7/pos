//component
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
//page
import './stockDetail.html';
//import DI
import  'printthis';
//import collection
import {stockDetailSchema} from '../../api/collections/reports/stockDetail';

//methods
import {stockDetailReportMethod} from '../../../common/methods/reports/stockDetail';
import RangeDate from "../../api/libs/date";
//state
let paramsState = new ReactiveVar();
let invoiceData = new ReactiveVar();
//declare template
let indexTmpl = Template.Pos_stockDetailReport,
    invoiceDataTmpl = Template.stockDetailReportData;
Tracker.autorun(function () {
    if (paramsState.get()) {
        swal({
            title: "Pleas Wait",
            text: "Fetching Data....", showConfirmButton: false
        });
        stockDetailReportMethod.callPromise(paramsState.get())
            .then(function (result) {
                invoiceData.set(result);
                setTimeout(function () {
                    swal.close();
                }, 200);
            }).catch(function (err) {
            swal.close();
            console.log(err.message);
        })
    }
});

indexTmpl.onCreated(function () {
    createNewAlertify('invoiceReport');
    paramsState.set(FlowRouter.query.params());
    this.fromDate = new ReactiveVar(moment().startOf('days').toDate());
    this.endDate = new ReactiveVar(moment().endOf('days').toDate());
});
indexTmpl.helpers({
    schema(){
        return stockDetailSchema;
    },
    startDate(){
        let instance = Template.instance();
        return instance.fromDate.get();
    },
    endDate(){
        let instance = Template.instance();
        return instance.endDate.get();
    }
});
indexTmpl.events({
    'click .print'(event, instance){
        $('#to-print').printThis();
    },
    'change #date-range-filter'(event, instance){
        let currentRangeDate = RangeDate[event.currentTarget.value]();
        instance.fromDate.set(currentRangeDate.start.toDate());
        instance.endDate.set(currentRangeDate.end.toDate());
    }
});
invoiceDataTmpl.helpers({
    company(){
        let doc = Session.get('currentUserStockAndAccountMappingDoc');
        return doc.company;
    },
    data(){
        if (invoiceData.get()) {
            return invoiceData.get();
        }
    },
    displayStockOutQty(){
        if(this.coefficient < 0) {
            return `<td></td><td>${numeral(Math.abs(this.qty)).format('0,0.00')}</td>`;
        }
        return `<td>${numeral(this.qty).format('0,0.00')}</td><td></td>`;
    }
});


AutoForm.hooks({
    stockDetailReport: {
        onSubmit(doc){
            this.event.preventDefault();
            FlowRouter.query.unset();
            let params = {};
            params.branch = Session.get('currentBranch');
            if (doc.startDate && doc.endDate) {
                params.date = `${moment(doc.startDate).startOf('days').format('YYYY-MM-DD')}, ${moment(doc.endDate).endOf('days').format('YYYY-MM-DD')}`;
            }
            if (doc.filter) {
                params.filter = doc.filter.join(',');
            }
            if (doc.items) {
                params.items = doc.items.join(',')
            }
            if (doc.branch) {
                params.branch = doc.branch.join(',');
            }
            if (doc.location) {
                params.location = doc.location.join(',');
            }
            FlowRouter.query.set(params);
            paramsState.set(FlowRouter.query.params());
            return false;
        }
    }
});