import './martUI.html';
//collection
import {Invoices} from '../../../api/collections/invoice';
let indexTmpl = Template.pos_martUi;
let indexFooter = Template.pos_martUiFooter;
indexTmpl.onCreated(function () {

    Meteor.subscribe('pos.martPubInvoiceByUnsaved', {unsaved: false});
    Meteor.subscribe('pos.martPubInvoiceByHoldOrder', {holdOrder: true});
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
        let invoices = Invoices.find({_id: {$ne: invoiceId || ''},unsaved: false}, {limit: 10});
        return invoices;
    }
});

indexTmpl.events({
    'click .unsavedInvoiceId'(event,instance){
        FlowRouter.query.set({inv: this._id});
    },
    'click .holderInvoiceId'(event,instance){
        FlowRouter.query.set({inv: this._id});
    },
    'click .handleCancel'(event, instance){
         let invoiceId = FlowRouter.query.get('inv');
         let currentInvoice = Invoices.findOne(invoiceId);
         if(currentInvoice){
             Meteor.call('mart.handleCancel', {invoiceId: currentInvoice._id}, function(err,result){
                if(result){
                    FlowRouter.query.unset('inv');                    
                    alertify.success('Successfully Cancel')
                }
             });
         }
    },
    'click .handleHoldOrder'(event,instance){
         let invoiceId = FlowRouter.query.get('inv');
         let currentInvoice = Invoices.findOne(invoiceId);
         console.log(currentInvoice)
        if(currentInvoice){
             Meteor.call('mart.handleHoldOrder', {invoiceId: currentInvoice._id}, function(err,result){
                if(result){
                    FlowRouter.query.unset('inv');
                    alertify.success('Successfully Holder Invoice #'+ invoiceId);
                }
             });
         }
    }
});

indexFooter.helpers({
    invoiceId(){
        let invoiceId = FlowRouter.query.get('inv') || '';
        return invoiceId;
    }
});