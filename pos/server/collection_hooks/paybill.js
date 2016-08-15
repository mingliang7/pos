import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';
import {PayBills} from '../../imports/api/collections/payBill';

PayBills.before.insert(function (userId, doc) {
    doc._id = idGenerator.genWithPrefix(PayBills, `${doc.branchId}-` , 9);
});

PayBills.after.remove(function(userId, doc) {
    Meteor.call('insertRemovedPayBill', doc);
});