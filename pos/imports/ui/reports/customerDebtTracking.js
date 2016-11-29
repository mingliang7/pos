//component
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
import {reactiveTableSettings} from '../../../../core/client/libs/reactive-table-settings.js';
import {renderTemplate} from '../../../../core/client/libs/render-template.js';
//page
import './customerDebtTracking.html';
//import DI
import  'printthis';
//import collection
import {customerBalanceSchema} from '../../api/collections/reports/customerBalance';

//methods
import {customerDebtTrackingReport} from '../../../common/methods/reports/customerDebtTrackingReport';
//state
let paramsState = new ReactiveVar();
let invoiceData = new ReactiveVar();
//declare template
let indexTmpl = Template.Pos_customerDebtTracking,
    invoiceDataTmpl = Template.customerDebtTrackingData;
Tracker.autorun(function () {
    if (paramsState.get()) {
        swal({
            title: "Pleas Wait",
            text: "Fetching Data....", showConfirmButton: false
        });
        customerDebtTrackingReport.callPromise(paramsState.get())
            .then(function (result) {
                invoiceData.set(result);
                setTimeout(function () {
                    swal.close()
                }, 200);
            }).catch(function (err) {
            swal.close();
            console.log(err.message);
        })
    }
});

indexTmpl.onCreated(function () {
    createNewAlertify('customerHistory');
    paramsState.set(FlowRouter.query.params());
});
indexTmpl.helpers({
    schema(){
        return customerBalanceSchema;
    }
});
indexTmpl.events({
    'click .fullScreen'(event,instance){
        $('.rpt-header').addClass('rpt');
        $('.rpt-body').addClass('rpt');
        alertify.customerHistory(fa('', ''), renderTemplate(invoiceDataTmpl)).maximize();
    }
});
invoiceDataTmpl.events({
    'click .print'(event, instance){
        $('#to-print').printThis();
    }
});
invoiceDataTmpl.onDestroyed(function () {
    $('.rpt-header').removeClass('rpt');
    $('.rpt-body').removeClass('rpt');
});
invoiceDataTmpl.helpers({
    data(){
        if (invoiceData.get()) {
            return invoiceData.get();
        }
    },
    company(){
        let doc = Session.get('currentUserStockAndAccountMappingDoc');
        return doc.company;
    },
});


AutoForm.hooks({
    customerDebtTrackingReport: {
        onSubmit(doc){
            this.event.preventDefault();
            FlowRouter.query.unset();
            let params = {};
            params.branchId = Session.get('currentBranch');
            if (doc.date) {
                let formatDate = moment(doc.date).format('YYYY-MM-DD');
                params.date = `${formatDate}`;
            }
            if (doc.customer) {
                params.customer = doc.customer
            }
            if (doc.filter) {
                params.filter = doc.filter.join(',');
            }
            if(doc.branchId){
                params.branchId = doc.branchId.join(',');
            }
            FlowRouter.query.set(params);
            paramsState.set(FlowRouter.query.params());
            return false;
        }
    }
});