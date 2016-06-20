import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';
import {PayBills} from '../../imports/api/collections/payBill';

PayBills.before.insert(function (userId, doc) {
    doc._id = idGenerator.gen(PayBills, 9);
});