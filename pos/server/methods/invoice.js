import {Invoices} from '../../imports/api/collections/invoice';
import {ReceivePayment} from '../../imports/api/collections/receivePayment';
Meteor.methods({
    insertRemovedInvoice(doc){
        if (doc.invoiceType == 'term' && (doc.status == 'partial' || doc.status == 'closed')) {
            ReceivePayment.remove({invoiceId: doc._id});
        }
        doc.status = 'removed';
        doc._id = `${doc._id}R${moment().format('YYYY-MMM-DD-HH:mm')}`;
        Invoices.direct.insert(doc);
    }
});