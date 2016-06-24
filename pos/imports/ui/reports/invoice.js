import './invoice.html';
//import DI
import 'meteor/theara:autoprint';
//import collection
import {invoiceSchema} from '../../api/collections/reports/invoice';

//methods
import {invoiceReport} from '../../../common/methods/reports/invoice';
//state
let paramsState = new ReactiveVar();
let invoiceData = new ReactiveVar();
//declare template
let indexTmpl = Template.Pos_invoiceReport;
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
    paramsState.set(FlowRouter.query.params());
});


indexTmpl.helpers({
    data(){
        if (invoiceData.get()) {
            setTimeout(function () {
                swal.close()
            }, 200);
            return invoiceData.get();
        }
    },
    schema(){
        return invoiceSchema;
    },
    display(col){
        debugger
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
    }
});

function cb(start, end) {
    $('[name="date"]').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
}

AutoForm.hooks({
    invoiceReport: {
        onSubmit(doc){
            this.event.preventDefault();
            let params = {};
            if (doc.date) {
                params.date = moment(doc.date).format('YYYY-MM-DD HH:mm:ss')
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