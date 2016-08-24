import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';
import {AverageInventories} from '../../imports/api/collections/inventory.js';
// Collection
import {ExchangeRingPulls} from '../../imports/api/collections/exchangeRingPull.js';
import {Item} from '../../imports/api/collections/item.js'
import {RingPullInventories} from '../../imports/api/collections/ringPullInventory.js'
ExchangeRingPulls.before.insert(function (userId, doc) {
    let todayDate = moment().format('YYYYMMDD');
    let prefix = doc.branchId + "-" + todayDate;
    doc._id = idGenerator.genWithPrefix(ExchangeRingPulls, prefix, 4);
});

ExchangeRingPulls.after.insert(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        //ExchangeRingPullManageStock(doc);
    });
});


// after.insert: reduceForInventory and Add to RingPull Inventory

/*
 after.update:
 returnToInventory and reduceFrom RingPull Inventory (preDoc)
 reduceForInventory and Add to RingPull Inventory (doc)
 */

//after.remove: returnToInventory and reduceFrom RingPull Inventory

function ExchangeRingPullManageStock(exchangeRingPull) {

    let totalCost = 0;
    // let exchangeRingPull = Invoices.findOne(exchangeRingPullId);
    let prefix = exchangeRingPull.stockLocationId + "-";
    let newItems = [];
    exchangeRingPull.items.forEach(function (item) {
        //---Open Inventory type block "Average Inventory"---
        let inventory = AverageInventories.findOne({
            branchId: exchangeRingPull.branchId,
            itemId: item.itemId,
            stockLocationId: exchangeRingPull.stockLocationId
        }, {sort: {_id: 1}});
        if (inventory) {
            let newInventory = {
                _id: idGenerator.genWithPrefix(AverageInventories, prefix, 13),
                branchId: exchangeRingPull.branchId,
                stockLocationId: exchangeRingPull.stockLocationId,
                itemId: item.itemId,
                qty: item.qty,
                price: inventory.price,
                remainQty: inventory.remainQty - item.qty,
                coefficient: -1,
                type: 'exchangeRingPull',
                refId: exchangeRingPull._id
            };
            AverageInventories.insert(newInventory);
        }
        else {
            let thisItem = Item.findOne(item.itemId);
            let newInventory = {
                _id: idGenerator.genWithPrefix(AverageInventories, prefix, 13),
                branchId: exchangeRingPull.branchId,
                stockLocationId: exchangeRingPull.stockLocationId,
                itemId: item.itemId,
                qty: item.qty,
                price: thisItem.purchasePrice,
                remainQty: 0 - item.qty,
                coefficient: -1,
                type: 'exchangeRingPull',
                refId: exchangeRingPull._id
            };
            AverageInventories.insert(newInventory);
        }
        //--- End Inventory type block "Average Inventory"---

        //---insert to Ring Pull Stock---
        let ringPullInventory = RingPullInventories.findOne({
            branchId: exchangeRingPull.branchId,
            itemId: item.itemId,
        });
        if (ringPullInventory) {
            RingPullInventories.update(
                ringPullInventory._id,
                {
                    $inc: {qty: item.qty}
                });
        } else {
            RingPullInventories.insert({
                itemId: item.itemId,
                branchId: exchangeRingPull.branchId,
                qty: item.qty
            })
        }

    });

}