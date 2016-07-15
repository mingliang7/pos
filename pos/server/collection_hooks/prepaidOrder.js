import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {PrepaidOrders} from '../../imports/api/collections/prepaidOrder.js';

PrepaidOrders.before.insert(function (userId, doc) {
    let prefix = doc.vendorId;
    doc._id = idGenerator.genWithPrefix(PrepaidOrders, prefix, 6);
});


PrepaidOrders.after.insert(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        let sumRemainQty = 0;
        doc.items.forEach(function (item) {
            sumRemainQty += item.remainQty;
        });
        PrepaidOrders.direct.update(doc._id, {
            $set: {
                sumRemainQty: sumRemainQty
            }
        });
    });
});

PrepaidOrders.after.update(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        let sumRemainQty = 0;
        doc.items.forEach(function (item) {
            sumRemainQty += item.remainQty;
        });
        PrepaidOrders.direct.update(doc._id, {
            $set: {
                sumRemainQty: sumRemainQty
            }
        });
    });
});