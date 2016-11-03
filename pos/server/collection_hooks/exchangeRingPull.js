import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';
import {AverageInventories} from '../../imports/api/collections/inventory.js';
// Collection
import {ExchangeRingPulls} from '../../imports/api/collections/exchangeRingPull.js';
import {Item} from '../../imports/api/collections/item.js'
import {RingPullInventories} from '../../imports/api/collections/ringPullInventory.js'
import {AccountIntegrationSetting} from '../../imports/api/collections/accountIntegrationSetting.js'
import {AccountMapping} from '../../imports/api/collections/accountMapping.js'
import StockFunction from '../../imports/api/libs/stock';
ExchangeRingPulls.before.insert(function (userId, doc) {
    let todayDate = moment().format('YYYYMMDD');
    let prefix = doc.branchId + "-" + todayDate;
    doc._id = idGenerator.genWithPrefix(ExchangeRingPulls, prefix, 4);
});

ExchangeRingPulls.after.insert(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        //ExchangeRingPullManageStock(doc);
        //---------------------------------------------//
        let inventoryIdList = [];
        doc.items.forEach(function (item) {
            let id = StockFunction.minusAverageInventoryInsert(doc.branchId, item, doc.stockLocationId, 'reduce-from-exchange-rill-pull', doc._id);
            inventoryIdList.push(id);
        });
        StockFunction.increaseRingPullInventory(doc);
        //Account Integration
        let total = 0;
        doc.items.forEach(function (item) {
            let inventoryObj = AverageInventories.findOne({
                itemId: item.itemId,
                branchId: doc.branchId,
                stockLocationId: doc.stockLocationId
            }, {sort: {_id: -1}});
            let thisItemPrice = 0;
            if (inventoryObj) {
                thisItemPrice = inventoryObj.price;
            } else {
                let thisItem = Item.findOne(item.itemId);
                thisItemPrice = thisItem && thisItem.purchasePrice ? thisItem.purchasePrice : 0;
            }
            item.price = thisItemPrice;
            item.amount = item.qty * thisItemPrice;
            total += item.amount;
        });
        doc.total = total;
        ExchangeRingPulls.direct.update(doc._id,{$set:{items:doc.items,total:doc.total}});

        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let transaction = [];
            let data = doc;
            data.type = "ExchangeRingPull";
            let ringPullChartAccount = AccountMapping.findOne({name: 'Ring Pull'});
            let inventoryChartAccount = AccountMapping.findOne({name: 'Inventory'});
            transaction.push({
                account: ringPullChartAccount.account,
                dr: doc.total,
                cr: 0,
                drcr: doc.total
            }, {
                account: inventoryChartAccount.account,
                dr: 0,
                cr: doc.total,
                drcr: -doc.total
            });
            data.transaction = transaction;
            Meteor.call('insertAccountJournal', data);
            /*Meteor.call('insertAccountJournal', data, function (er, re) {
             if (er) {
             AverageInventories.direct.remove({_id: {$in: inventoryIdList}});
             StockFunction.reduceRingPullInventory(doc);
             Meteor.call('insertRemovedCompanyExchangeRingPull', doc);
             ExchangeRingPulls.direct.remove({_id: doc._id});
             throw new Meteor.Error(er.message);
             } else if (re == null) {
             AverageInventories.direct.remove({_id: {$in: inventoryIdList}});
             StockFunction.reduceRingPullInventory(doc);
             Meteor.call('insertRemovedCompanyExchangeRingPull', doc);
             ExchangeRingPulls.direct.remove({_id: doc._id});
             throw new Meteor.Error("Can't Entry to Account System.");
             }
             });*/
        }
        //End Account Integration
    });
});
ExchangeRingPulls.after.update(function (userId, doc) {
    let preDoc = this.previous;
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        returnToInventory(preDoc, 'exchangeRingPull-return');
        ExchangeRingPullManageStock(doc);
        //Account Integration
        let total = 0;
        doc.items.forEach(function (item) {
            let inventoryObj = AverageInventories.findOne({
                itemId: item.itemId,
                branchId: doc.branchId,
                stockLocationId: doc.stockLocationId
            }, {sort: {_id: -1}});
            let thisItemPrice = 0;
            if (inventoryObj) {
                thisItemPrice = inventoryObj.price;
            } else {
                let thisItem = Item.findOne(item.itemId);
                thisItemPrice = thisItem && thisItem.purchasePrice ? thisItem.purchasePrice : 0;
            }
            item.price = thisItemPrice;
            item.amount = item.qty * thisItemPrice;
            total += item.amount;
        });
        doc.total = total;
        ExchangeRingPulls.direct.update(doc._id,{$set:{items:doc.items,total:doc.total}});

        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let transaction = [];
            let data = doc;
            data.type = "ExchangeRingPull";
            let ringPullChartAccount = AccountMapping.findOne({name: 'Ring Pull'});
            let inventoryChartAccount = AccountMapping.findOne({name: 'Inventory'});
            transaction.push({
                account: ringPullChartAccount.account,
                dr: doc.total,
                cr: 0,
                drcr: doc.total
            }, {
                account: inventoryChartAccount.account,
                dr: 0,
                cr: doc.total,
                drcr: -doc.total
            });
            data.transaction = transaction;
            Meteor.call('updateAccountJournal', data);
        }
        //End Account Integration
    })
});

ExchangeRingPulls.after.remove(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        returnToInventory(doc, 'exchangeRingPull-return');
        //Account Integration
        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let data = {_id: doc._id, type: 'ExchangeRingPull'};
            Meteor.call('removeAccountJournal', data)
        }
        //End Account Integration
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
    //---Open Inventory type block "Average Inventory"---
    let totalCost = 0;
    // let exchangeRingPull = Invoices.findOne(exchangeRingPullId);
    let prefix = exchangeRingPull.stockLocationId + "-";
    let newItems = [];
    exchangeRingPull.items.forEach(function (item) {
        let inventory = AverageInventories.findOne({
            branchId: exchangeRingPull.branchId,
            itemId: item.itemId,
            stockLocationId: exchangeRingPull.stockLocationId
        }, {sort: {_id: -1}});
        if (inventory) {
            item.cost = inventory.price;
            //item.amountCost = inventory.price * item.qty;
            //item.profit = item.amount - item.amountCost;
            //totalCost += item.amountCost;
            newItems.push(item);
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
            var thisItem = Item.findOne(item.itemId);
            item.cost = thisItem.purchasePrice;
            //item.amountCost = thisItem.purchasePrice * item.qty;
            //item.profit = item.amount - item.amountCost;
            //totalCost += item.amountCost;
            newItems.push(item);
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
    //let totalProfit = exchangeRingPull.total - totalCost;
    ExchangeRingPulls.direct.update(
        exchangeRingPull._id,
        {$set: {items: newItems, totalCost: totalCost}}
    );
    //--- End Inventory type block "Average Inventory"---


}
//update inventory
function returnToInventory(exchangeRingPull, type) {
    //---Open Inventory type block "Average Inventory"---
    // let exchangeRingPull = Invoices.findOne(exchangeRingPullId);
    exchangeRingPull.items.forEach(function (item) {
        item.price = item.cost;
        averageInventoryInsert(
            exchangeRingPull.branchId,
            item,
            exchangeRingPull.stockLocationId,
            type,
            exchangeRingPull._id
        );

        //---Reduce from Ring Pull Stock---
        let ringPullInventory = RingPullInventories.findOne({
            branchId: exchangeRingPull.branchId,
            itemId: item.itemId,
        });
        if (ringPullInventory) {
            RingPullInventories.update(
                ringPullInventory._id,
                {
                    $inc: {qty: -item.qty}
                });
        } else {
            RingPullInventories.insert({
                itemId: item.itemId,
                branchId: exchangeRingPull.branchId,
                qty: 0 - item.qty
            })
        }
    });
    //--- End Inventory type block "Average Inventory"---
}

function averageInventoryInsert(branchId, item, stockLocationId, type, refId) {
    let lastPurchasePrice = 0;
    let remainQuantity = 0;
    let prefix = stockLocationId + '-';
    let inventory = AverageInventories.findOne({
        branchId: branchId,
        itemId: item.itemId,
        stockLocationId: stockLocationId
    }, {sort: {createdAt: -1}});
    if (inventory == null) {
        let inventoryObj = {};
        inventoryObj._id = idGenerator.genWithPrefix(AverageInventories, prefix, 13);
        inventoryObj.branchId = branchId;
        inventoryObj.stockLocationId = stockLocationId;
        inventoryObj.itemId = item.itemId;
        inventoryObj.qty = item.qty;
        inventoryObj.price = item.price;
        inventoryObj.remainQty = item.qty;
        inventoryObj.type = type;
        inventoryObj.coefficient = 1;
        inventoryObj.refId = refId;
        //lastPurchasePrice = item.price;
        remainQuantity = inventoryObj.remainQty;
        AverageInventories.insert(inventoryObj);
    }
    else if (inventory.price == item.price) {
        let inventoryObj = {};
        inventoryObj._id = idGenerator.genWithPrefix(AverageInventories, prefix, 13);
        inventoryObj.branchId = branchId;
        inventoryObj.stockLocationId = stockLocationId;
        inventoryObj.itemId = item.itemId;
        inventoryObj.qty = item.qty;
        inventoryObj.price = item.price;
        inventoryObj.remainQty = item.qty + inventory.remainQty;
        inventoryObj.type = type;
        inventoryObj.coefficient = 1;
        inventoryObj.refId = refId;
        //lastPurchasePrice = item.price;
        remainQuantity = inventoryObj.remainQty;
        AverageInventories.insert(inventoryObj);
        /*
         let
         inventorySet = {};
         inventorySet.qty = item.qty + inventory.qty;
         inventorySet.remainQty = inventory.remainQty + item.qty;
         AverageInventories.update(inventory._id, {$set: inventorySet});
         */
    }
    else {
        let totalQty = inventory.remainQty + item.qty;
        let price = 0;
        //should check totalQty or inventory.remainQty
        if (totalQty <= 0) {
            price = inventory.price;
        } else if (inventory.remainQty <= 0) {
            price = item.price;
        } else {
            price = ((inventory.remainQty * inventory.price) + (item.qty * item.price)) / totalQty;
        }
        let nextInventory = {};
        nextInventory._id = idGenerator.genWithPrefix(AverageInventories, prefix, 13);
        nextInventory.branchId = branchId;
        nextInventory.stockLocationId = stockLocationId;
        nextInventory.itemId = item.itemId;
        nextInventory.qty = item.qty;
        nextInventory.price = math.round(price, 2);
        nextInventory.remainQty = totalQty;
        nextInventory.type = type;
        nextInventory.coefficient = 1;
        nextInventory.refId = refId;
        //lastPurchasePrice = price;
        remainQuantity = nextInventory.remainQty;
        AverageInventories.insert(nextInventory);
    }

    //var setModifier = {$set: {purchasePrice: lastPurchasePrice}};
    var setModifier = {$set: {}};
    setModifier.$set['qtyOnHand.' + stockLocationId] = remainQuantity;
    Item.direct.update(item.itemId, setModifier);
}

