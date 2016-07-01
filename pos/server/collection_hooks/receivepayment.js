import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';
import {ReceivePayment} from '../../imports/api/collections/receivePayment';

ReceivePayment.before.insert(function (userId, doc) {
    doc._id = idGenerator.genWithPrefix(ReceivePayment,`${doc.branchId}-`, 9);
});