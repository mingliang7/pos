import './martUI.html';
//collection
import {Invoices} from '../../../api/collections/invoice';
let indexTmpl = Template.pos_martUi;

indexTmpl.onCreated(function () {

    Meteor.subscribe('pos.martPubInvoiceByUnsaved', {unsaved: true});
    Meteor.subscribe('pos.martPubInvoiceByHolder', {holdOrder: true});
    this.autorun(() => {
        let invoiceId = FlowRouter.query.get('inv');
        if (invoiceId) {
            Meteor.subscribe('pos.martPubInvoiceById', {invoiceId});
        }
    });
});

indexTmpl.onRendered(function () {

});
indexTmpl.helpers({
    invoiceById(){
        let invoiceId = FlowRouter.query.get('inv');
        return Invoices.findOne(invoiceId);
    },
});