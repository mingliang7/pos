import {PayBills} from '../../imports/api/collections/payBill';
import {RemoveEnterBill} from '../../imports/api/collections/removedCollection';
import {Item} from '../../imports/api/collections/item';
import {Vendors} from '../../imports/api/collections/vendor';
Meteor.methods({
    insertRemovedBill(doc){
        if (doc.billType == 'term' && (doc.status == 'partial' || doc.status == 'closed')) {
            PayBills.remove({billId: doc._id});
        }
        doc.status = 'removed';
        doc.removeDate = new Date();
        doc._id = `${doc._id}R${moment().format('YYYY-MMM-DD-HH:mm')}`;
        RemoveEnterBill.insert(doc);
    },
    billShowItems({doc}){
        doc.staff = Meteor.users.findOne(doc.staffId).username || '';
        doc.vendor = Vendors.findOne({_id: doc.vendorId});
        doc.items.forEach(function (item) {
            item.name = Item.findOne(item.itemId).name;
        });
        return doc;
    }
});