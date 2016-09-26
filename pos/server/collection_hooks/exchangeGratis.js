import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {ExchangeGratis} from '../../imports/api/collections/exchangeGratis.js';
import {AverageInventories} from '../../imports/api/collections/inventory.js';
import {Item} from '../../imports/api/collections/item.js';
import {GratisInventories} from '../../imports/api/collections/gratisInventory.js';

ExchangeGratis.before.insert(function (userId, doc) {
    let prefix = doc.vendorId;
    doc._id = idGenerator.genWithPrefix(ExchangeGratis, prefix, 6);
});


ExchangeGratis.after.insert(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        doc.items.forEach(function (item) {
            reduceGratisInventory(item, doc.branchId, doc.stockLocationId);
        });
    });
});

ExchangeGratis.after.update(function (userId, doc) {
    let preDoc = this.previous;
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        preDoc.items.forEach(function (item) {
            increaseGratisInventory(item, preDoc.branchId, preDoc.stockLocationId);
        });
        doc.items.forEach(function (item) {
            reduceGratisInventory(item, doc.branchId, doc.stockLocationId);
        })
    });
});

//remove
ExchangeGratis.after.remove(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        doc.items.forEach(function (item) {
            increaseGratisInventory(item, doc.branchId, doc.stockLocationId);
        });
    });
});


/*
 Insert: reduce from gratis inventory(doc)
 Update: increase gratis inventory(preDoc)
 reduce from ring pull inventory(doc);
 Remove: increase from ring pull inventory(doc)
 */


function increaseGratisInventory(item, branchId, stockLocationId) {
    let prefix = stockLocationId + '-';
    let gratisInventory = GratisInventories.findOne({
        branchId: branchId,
        itemId: item.itemId,
        stockLocationId: stockLocationId
    }, {sort: {createdAt: -1}});
    if (gratisInventory == null) {
        let gratisInventoryObj = {};
        gratisInventoryObj._id = idGenerator.genWithPrefix(GratisInventories, prefix, 13);
        gratisInventoryObj.branchId = branchId;
        gratisInventoryObj.stockLocationId = stockLocationId;
        gratisInventoryObj.itemId = item.itemId;
        gratisInventoryObj.qty = item.qty;
        GratisInventories.insert(gratisInventoryObj);
    }
    else {
        GratisInventories.update(
            gratisInventory._id,
            {
                $inc: {qty: item.qty}
            });
    }
}
function reduceGratisInventory(item, branchId, stockLocationId) {
    let prefix = stockLocationId + '-';
    let gratisInventory = GratisInventories.findOne({
        branchId: branchId,
        itemId: item.itemId,
        stockLocationId: stockLocationId
    }, {sort: {createdAt: -1}});
    if (gratisInventory) {
        GratisInventories.update(
            gratisInventory._id,
            {
                $inc: {qty: -item.qty}
            }
        );
    }
    else {
        let gratisInventoryObj = {};
        gratisInventoryObj._id = idGenerator.genWithPrefix(GratisInventories, prefix, 13);
        gratisInventoryObj.branchId = branchId;
        gratisInventoryObj.stockLocationId = stockLocationId;
        gratisInventoryObj.itemId = item.itemId;
        gratisInventoryObj.qty = -item.qty;
        GratisInventories.insert(gratisInventoryObj);
    }
}