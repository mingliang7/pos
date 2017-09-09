//component
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
import {reactiveTableSettings} from '../../../../core/client/libs/reactive-table-settings.js';
import {renderTemplate} from '../../../../core/client/libs/render-template.js';
//page
import './purchaseByItem.html';
//import DI
import  'printthis';
//import collection
import {purchaseByItemSummary} from '../../api/collections/reports/purchaseByItemSummary';
//methods
import {purchaseByItemSummaryFn} from '../../../common/methods/reports/purchaseByItemSummary';
import RangeDate from "../../api/libs/date";
//state
let paramsState = new ReactiveVar();
let invoiceData = new ReactiveVar();
//declare template
let indexTmpl = Template.pos_purchaseByItem,
    invoiceDataTmpl = Template.pos_purchaseByItem;
Tracker.autorun(function () {
    if (paramsState.get()) {
        swal({
            title: "Pleas Wait",
            text: "Fetching Data....", showConfirmButton: false
        });
        purchaseByItemSummaryFn.callPromise(paramsState.get())
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
    paramsState.set(FlowRouter.query.params());
});
indexTmpl.helpers({
    schema(){
        return purchaseByItemSummary;
    },
    defaultType(){
        return ['EnterBills', 'ReceiveItems', 'LocationTransfers']
    }
});
indexTmpl.events({});

invoiceDataTmpl.events({
    'click .print'(event, instance){
        window.print();
    }
});
invoiceDataTmpl.helpers({
    data(){
        return invoiceData.get();
    },
    company(){
        let doc = Session.get('currentUserStockAndAccountMappingDoc');
        return doc && doc.company;
    }
});

AutoForm.hooks({
    purchaseByItemSummary: {
        onSubmit(doc){
            this.event.preventDefault();
            FlowRouter.query.unset();
            let params = {};
            params.branchId = Session.get('currentBranch');
            if (doc.type) {
                params.type = doc.type.join(",");
            }
            FlowRouter.query.set(params);
            paramsState.set(FlowRouter.query.params());
            return false;
        }
    }
});
