import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {PurchaseOrder} from '../../imports/api/collections/purchaseOrder.js';

PurchaseOrder.before.insert(function (userId, doc) {
    let prefix = doc.vendorId;
    doc._id = idGenerator.genWithPrefix(PurchaseOrder, prefix, 6);
});
