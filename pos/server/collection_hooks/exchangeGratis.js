import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {ExchangeGratis} from '../../imports/api/collections/exchangeGratis.js';

ExchangeGratis.before.insert(function (userId, doc) {
    let prefix = doc.vendorId;
    doc._id = idGenerator.genWithPrefix(ExchangeGratis, prefix, 6);
});

/*

ExchangeGratis.after.insert(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        let sumRemainQty = 0;
        doc.items.forEach(function (item) {
            sumRemainQty += item.remainQty;
        });
        ExchangeGratis.direct.update(doc._id, {
            $set: {
                sumRemainQty: sumRemainQty
            }
        });
    });
});

ExchangeGratis.after.update(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        let sumRemainQty = 0;
        doc.items.forEach(function (item) {
            sumRemainQty += item.remainQty;
        });
        ExchangeGratis.direct.update(doc._id, {
            $set: {
                sumRemainQty: sumRemainQty
            }
        });
    });
});*/
