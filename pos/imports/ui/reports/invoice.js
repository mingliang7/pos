import './invoice.html';
//import DI
import 'meteor/theara:autoprint';


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
        if(invoiceData.get()){
            setTimeout(function () {
                swal.close()
            }, 200);
            return invoiceData.get();;
        }
    }
});