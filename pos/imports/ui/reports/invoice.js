//component
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
import {reactiveTableSettings} from '../../../../core/client/libs/reactive-table-settings.js';
import {renderTemplate} from '../../../../core/client/libs/render-template.js';
//page
import './invoice.html';
//import DI
import 'meteor/theara:autoprint';
import PHE from "print-html-element";
//import collection
import {invoiceSchema} from '../../api/collections/reports/invoice';

//methods
import {invoiceReport} from '../../../common/methods/reports/invoice';
//state
let paramsState = new ReactiveVar();
let invoiceData = new ReactiveVar();
//declare template
let indexTmpl = Template.Pos_invoiceReport,
    invoiceDataTmpl = Template.invoiceReportData;
Tracker.autorun(function () {
    if (paramsState.get()) {
        swal({
            title: "Pleas Wait",
            text: "Fetching Data....", showConfirmButton: false
        });
        invoiceReport.callPromise(paramsState.get())
            .then(function (result) {
                invoiceData.set(result);
            }).catch(function (err) {
            console.log(err.message);
        })
    }
});

indexTmpl.onCreated(function () {
    createNewAlertify('invoiceReport');
    paramsState.set(FlowRouter.query.params());
});
indexTmpl.helpers({
    schema(){
        return invoiceSchema;
    }
});
indexTmpl.events({
    'click .print'(event,instance){
        PHE.printElement( document.getElementById('to-print'));
    }
});
invoiceDataTmpl.helpers({

    data(){
        if (invoiceData.get()) {
            setTimeout(function () {
                swal.close()
            }, 200);
            return invoiceData.get();
        }
    },

    display(col){
        let data = '';
        this.displayFields.forEach(function (obj) {
            if (obj.field == 'invoiceDate') {
                data += `<td>${moment(col[obj.field]).format('YYYY-MM-DD HH:mm:ss')}</td>`
            } else if (obj.field == 'customerId') {
                data += `<td>${col._customer.name}</td>`
            } else if (obj.field == 'total') {
                data += `<td>${numeral(col[obj.field]).format('0,0.00')}</td>`
            }
            else {
                data += `<td>${col[obj.field]}</td>`;
            }
        });

        return data;
    },
    getTotal(total){
        let string = '';
        let fieldLength = this.displayFields.length - 2;
        for(let i = 0 ; i < fieldLength; i++) {
            string += '<td></td>'
        }
        string += `<td><b>Total:</td></b><td><b>${numeral(total).format('0,0.00')}</b></td>`;
        return string;
    }
});


AutoForm.hooks({
    invoiceReport: {
        onSubmit(doc){
            this.event.preventDefault();
            FlowRouter.query.unset();
            let params = {};
            if (doc.fromDate && doc.toDate) {
                let fromDate = moment(doc.fromDate).format('YYYY-MM-DD HH:mm:ss');
                let toDate = moment(doc.toDate).format('YYYY-MM-DD HH:mm:ss');
                params.date = `${fromDate},${toDate}`;
            }
            if (doc.customer) {
                params.customer = doc.customer
            }
            if (doc.filter) {
                params.filter = doc.filter.join(',');
            }
            FlowRouter.query.set(params);
            paramsState.set(FlowRouter.query.params());
            return false;
        }
    }
});