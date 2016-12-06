//component
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
//page
import './prepaidOrderDetail.html';
//import DI
import  'printthis';
//import collection
import {prepaidOrderReportSchema} from '../../api/collections/reports/prepaidOrderReport';

//methods
import {prepaidOrderDetail} from '../../../common/methods/reports/prepaidOrderDetail';
//state
let paramsState = new ReactiveVar();
let invoiceData = new ReactiveVar();
//declare template
let indexTmpl = Template.Pos_prepaidOrderDetail,
    invoiceDataTmpl = Template.prepaidOrderDetailData;
Tracker.autorun(function () {
    if (paramsState.get()) {
        swal({
            title: "Pleas Wait",
            text: "Fetching Data....", showConfirmButton: false
        });
        prepaidOrderDetail.callPromise(paramsState.get())
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
    createNewAlertify('invoiceReport');
    paramsState.set(FlowRouter.query.params());
});
indexTmpl.helpers({
    schema(){
        return prepaidOrderReportSchema;
    }
});
indexTmpl.events({
    'click .print'(event, instance){
        $('#to-print').printThis();
    },
    'change #go-to-prepaid-order'(event, instance){
        if (event.currentTarget.value == 'prepaidOrder') {
            FlowRouter.go(`/pos/report/prepaidOrderReport?date=${moment().startOf('days').format('YYYY-MM-DD HH:mm:ss')},${moment().endOf('days').format('YYYY-MM-DD 23:59:59')}&branch=${Session.get('currentBranch')}`);
        }
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
    reduceField(){
        let td = ''
        let fieldLength = this.displayFields.length - 6;
        for (let i = 0; i < fieldLength; i++) {
            td += '<td></td>';
        }
        return td;
    },
    display(col){
        let data = '';
        this.displayFields.forEach(function (obj) {
            if (obj.field == 'prepaidOrderDate') {
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
    getTotal(totalRemainQty, total){
        let string = '';
        let fieldLength = this.displayFields.length - 3;
        for (let i = 0; i < fieldLength; i++) {
            string += '<td></td>'
        }
        string += `<td><b>Total:</td></b><td><b>${numeral(totalRemainQty).format('0,0')}</b></td></td><td><b>${numeral(total).format('0,0.00')}</b></td>`;
        return string;
    },
    checkIfZero(val){
        return val == 0 ? '' : val;
    }
});


AutoForm.hooks({
    prepaidOrderDetail: {
        onSubmit(doc){
            this.event.preventDefault();
            FlowRouter.query.unset();
            let params = {};
            if (doc.fromDate && doc.toDate) {
                let fromDate = moment(doc.fromDate).format('YYYY-MM-DD HH:mm:ss');
                let toDate = moment(doc.toDate).format('YYYY-MM-DD HH:mm:ss');
                params.date = `${fromDate},${toDate}`;
            }
            if (doc.vendorId) {
                params.vendor = doc.vendor
            }
            if(doc.branchId) {
                params.branchId = doc.branchId.join(',');
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