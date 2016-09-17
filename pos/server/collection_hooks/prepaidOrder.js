import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {PrepaidOrders} from '../../imports/api/collections/prepaidOrder.js';

PrepaidOrders.before.insert(function (userId, doc) {
    let prefix = doc.vendorId;
    doc._id = idGenerator.genWithPrefix(PrepaidOrders, prefix, 6);
});