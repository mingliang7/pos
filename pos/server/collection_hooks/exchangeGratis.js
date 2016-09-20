import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {ExchangeGratis} from '../../imports/api/collections/exchangeGratis.js';
import {AverageInventories} from '../../imports/api/collections/inventory.js';
import {Item} from '../../imports/api/collections/item.js';
import {RingPullInventories} from '../../imports/api/collections/ringPullInventory.js';

ExchangeGratis.before.insert(function (userId, doc) {
    let prefix = doc.vendorId;
    doc._id = idGenerator.genWithPrefix(ExchangeGratis, prefix, 6);
});


ExchangeGratis.after.insert(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
    });
});

ExchangeGratis.after.update(function (userId, doc) {
    let preDoc = this.previous;
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
    });
});

//remove
ExchangeGratis.after.remove(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
    });
});

/*
 Insert: reduce from gratis inventory(doc)
 Update: increase gratis inventory(preDoc)
 reduce from ring pull inventory(doc);
 Remove: increase average inventory and reduce from ring pull inventory(doc)
 */

function reduceGratisInventory() {

}