//component
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
//page
import './saleOrderReport.html';
//import DI
import 'printthis';
//import collection
import {saleOrderReportSchema} from '../../api/collections/reports/saleOrder';

//methods
import {saleOrderReport} from '../../../common/methods/reports/saleOrder';
import {renderTemplate} from "../../../../core/client/libs/render-template";
//state
let paramsState = new ReactiveVar();
let invoiceData = new ReactiveVar();
//declare template
let indexTmpl = Template.Pos_saleOrderReport,
    invoiceDataTmpl = Template.saleOrderReportData,
    saleOrderTmpl = Template.saleOrderContentReport;
Tracker.autorun(function () {
    if (paramsState.get()) {
        swal({
            title: "Pleas Wait",
            text: "Fetching Data....", showConfirmButton: false
        });
        saleOrderReport.callPromise(paramsState.get())
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
    this.locations = new ReactiveVar([]);
    Meteor.call('fetchLocationList', true, (err, result) => {
        if (!err) {
            this.locations.set(result);
        }
    });
});
indexTmpl.helpers({
    locationsOption() {
        let instance = Template.instance();
        return instance.locations.get();
    },
    schema() {
        return saleOrderReportSchema;
    }
});
indexTmpl.events({
    'click .print'(event, instance) {
        $('#to-print').printThis();
    },

});
invoiceDataTmpl.onCreated(function () {
    createNewAlertify('saleOrderDetailContent');
});
invoiceDataTmpl.events({
    'click .invoiceId'(event, instance) {
        let invoiceId = $(event.currentTarget).attr('data-invoiceId')
        let {content} = invoiceData.get();
        if (content && content.length > 0) {
            let itemDetails = content[0];
            alertify.saleOrderDetailContent(fa('', 'Show Items'), renderTemplate(saleOrderTmpl, itemDetails));
        }
    }
});
invoiceDataTmpl.helpers({

    company() {
        let doc = Session.get('currentUserStockAndAccountMappingDoc');
        return doc.company;
    },
    data() {
        if (invoiceData.get()) {
            return invoiceData.get();
        }
    },
    reduceField() {
        let td = ''
        let fieldLength = this.displayFields.length - 6;
        for (let i = 0; i < fieldLength; i++) {
            td += '<td></td>';
        }
        return td;
    },
    display(col) {
        let data = '';
        this.displayFields.forEach(function (obj) {
            if (obj.field == 'orderDate') {
                data += `<td>${moment(col[obj.field]).format('YYYY-MM-DD')}</td>`
            }
            else if (obj.field === '_id') {
                data += `<td class="invoiceId" data-invoiceId="${col[obj.field]}">
                    <a class="cursor-pointer">${col[obj.field]}</a>
                    </td>`
            }
            else if (obj.field == 'customerId') {
                data += `<td>${col._customer.name}</td>`
            } else if (obj.field === 'total' || obj.field === 'deposit') {
                data += `<td>${numeral(col[obj.field]).format('0,0.000')}</td>`
            }
            else {
                data += `<td>${col[obj.field]}</td>`;
            }
        });

        return data;
    },
    getTotal(totalDeposit, total) {
        let string = '';
        let fieldLength = this.displayFields.length - 3;
        for (let i = 0; i < fieldLength; i++) {
            string += '<td></td>'
        }
        string += `<td><b>Total:</td></b></td><td><b>${numeral(totalDeposit).format('0,0.000')}</b></td><td><b>${numeral(total).format('0,0.000')}</b></td>`;
        return string;
    }
});


AutoForm.hooks({
    saleOrderReport: {
        onSubmit(doc) {
            this.event.preventDefault();
            FlowRouter.query.unset();
            let params = {};
            if (doc.fromDate && doc.toDate) {
                let fromDate = moment(doc.fromDate).startOf('days').format('YYYY-MM-DD HH:mm:ss');
                let toDate = moment(doc.toDate).endOf('days').format('YYYY-MM-DD HH:mm:ss');
                params.date = `${fromDate},${toDate}`;
            }
            if (doc.customer) {
                params.customer = doc.customer
            }
            if (doc.filter) {
                params.filter = doc.filter.join(',');
            }
            if (doc.locationId) {
                params.locationId = doc.locationId;
            }
            FlowRouter.query.set(params);
            paramsState.set(FlowRouter.query.params());
            return false;
        }
    }
});