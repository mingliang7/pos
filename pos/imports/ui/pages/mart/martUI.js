import './martUI.html';
//collection
import {Invoices} from '../../../api/collections/invoice';
let indexTmpl = Template.pos_martUi;
let indexFooter = Template.pos_martUiFooter;
indexTmpl.onCreated(function () {

    Meteor.subscribe('pos.martPubInvoiceByUnsaved', {unsaved: false, status: {$ne: 'closed'}});
    Meteor.subscribe('pos.martPubInvoiceByHoldOrder', {holdOrder: true, status: {$ne: 'closed'}});
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
    holdOrderInvoices(){
        let invoiceId = FlowRouter.query.get('inv');
        let invoices = Invoices.find({_id: {$ne: invoiceId || ''}, holdOrder: true}, {limit: 10});
        return invoices;
    },
    unsavedInvoices(){
        let invoiceId = FlowRouter.query.get('inv');
        let invoices = Invoices.find({_id: {$ne: invoiceId || ''}, unsaved: false}, {limit: 10});
        return invoices;
    }
});

indexTmpl.events({
    'click .unsavedInvoiceId'(event, instance){
        FlowRouter.query.set({inv: this._id});
    },
    'click .holderInvoiceId'(event, instance){
        FlowRouter.query.set({inv: this._id});
    },
    'click .handleCancel'(event, instance){
        let invoiceId = FlowRouter.query.get('inv');
        let currentInvoice = Invoices.findOne(invoiceId);
        if (currentInvoice) {
            Meteor.call('mart.handleCancel', {invoiceId: currentInvoice._id}, function (err, result) {
                if (result) {
                    FlowRouter.query.unset('inv');
                    alertify.success('Successfully Cancel')
                }
            });
        }
    },
    'click .handleHoldOrder'(event, instance){
        let invoiceId = FlowRouter.query.get('inv');
        let currentInvoice = Invoices.findOne(invoiceId);
        console.log(currentInvoice)
        if (currentInvoice) {
            Meteor.call('mart.handleHoldOrder', {invoiceId: currentInvoice._id}, function (err, result) {
                if (result) {
                    FlowRouter.query.unset('inv');
                    alertify.success('Successfully Holder Invoice #' + invoiceId);
                }
            });
        }
    },
    'click .handlePay'(event, instance){
        let invoice = Invoices.findOne(FlowRouter.query.get('inv'));
        if (invoice) {
            FlowRouter.go(`/pos/mart-ui/customer/${invoice.customerId}/receive-payment/${invoice._id}`);
        }
    },
    'click .removeProduct'(event, instance){
        let invoiceId = FlowRouter.query.get('inv');
        Meteor.call('mart.removeProduct', {currentSelectItem: this, invoiceId}, function (err, result) {
        });
    },
    'change .changeQty'(event, instance){
        let currentValue = event.currentTarget.value;
        let val = currentValue == '' ? 0 : parseFloat(currentValue);
        if (val <= 0) {
            $(event.currentTarget).val(this.qty)
        } else {
            this.qty = val;
            this.amount = this.price * val;
            Meteor.call('mart.updateProductQty', {currentSelectItem: this, invoiceId: FlowRouter.query.get('inv')});
        }
    }
});

indexFooter.helpers({
    invoiceId(){
        let invoiceId = FlowRouter.query.get('inv') || '';
        return invoiceId;
    }
});