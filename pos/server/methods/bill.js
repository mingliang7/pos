import {EnterBills} from '../../imports/api/collections/enterBill';
import {PayBills} from '../../imports/api/collections/payBill';
Meteor.methods({
    insertRemovedBill(doc){
        if (doc.billType == 'term' && (doc.status == 'partial' || doc.status == 'closed')) {
            PayBills.remove({billId: doc._id});
        }
        doc.status = 'removed';
        doc._id = `${doc._id}R${moment().format('YYYY-MMM-DD-HH:mm')}`;
        EnterBills.direct.insert(doc);
    }
});