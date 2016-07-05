import {AverageInventories} from '../../imports/api/collections/inventory.js';
import {EnterBills} from '../../imports/api/collections/enterBill.js'
import {Invoices} from '../../imports/api/collections/invoice.js'
import {LocationTransfers} from '../../imports/api/collections/locationTransfer.js'
import {Item} from '../../imports/api/collections/item.js'
import {idGenerator} from 'meteor/theara:id-generator';
import 'meteor/matb33:collection-hooks';

Meteor.methods({
    enterBillManageStock: function (enterBillId) {
        if (!Meteor.userId()) {
            throw new Meteor.Error("not-authorized");
        }
        Meteor.defer(function () {
            Meteor._sleepForMs(200);
            //---Open Inventory type block "Average Inventory"---
            let enterBill = EnterBills.findOne(enterBillId);
            enterBill.items.forEach(function (item) {
                averageInventoryInsert(enterBill.branchId, item, enterBill.stockLocationId, 'enterBill', enterBill._id);
            });
            //--- End Inventory type block "Average Inventory"---
        });
    },
    invoiceManageStock: function (invoiceId) {
        if (!Meteor.userId()) {
            throw new Meteor.Error("not-authorized");
        }
        Meteor.defer(function () {
            Meteor._sleepForMs(200);
            //---Open Inventory type block "FIFO Inventory"---
            let totalCost = 0;
            let invoice = Invoices.findOne(invoiceId);
            let prefix = invoice.stockLocationId + "-";
            let newItems = [];
            invoice.items.forEach(function (item) {
                let inventory = AverageInventories.findOne({
                    branchId: invoice.branchId,
                    itemId: item.itemId,
                    stockLocationId: invoice.stockLocationId
                }, {sort: {_id: 1}});
                item.cost = inventory.price;
                item.amountCost = inventory.price * item.qty;
                item.profit = item.amount - item.amountCost;
                totalCost += item.amountCost;
                newItems.push(item);

                let newInventory = {
                    _id: idGenerator.genWithPrefix(AverageInventories, prefix, 13),
                    branchId: invoice.branchId,
                    stockLocationId: invoice.stockLocationId,
                    itemId: item.itemId,
                    qty: item.qty,
                    price: inventory.price,
                    remainQty: inventory.remainQty - item.qty,
                    coefficient: -1,
                    type: 'invoice',
                    refId: invoiceId
                };
                AverageInventories.insert(newInventory);
            });
            let totalProfit = invoice.total - totalCost;
            Invoices.direct.update(
                invoiceId,
                {$set: {items: newItems, totalCost: totalCost, profit: totalProfit}}
            );
            //--- End Invenetory type block "FIFO Inventory"---
        });
    },
    locationTransferManageStock: function (locationTransferId) {
        if (!Meteor.userId()) {
            throw new Meteor.Error("not-authorized");
        }
        Meteor.defer(function () {
            Meteor._sleepForMs(200);
            //---Open Inventory type block "FIFO Inventory"---
            let locationTransferTotalCost = 0;
            let locationTransfer = LocationTransfers.findOne(locationTransferId);
            let prefix = locationTransfer.fromStockLocationId + "-";
            let newItems = [];
            let total = 0;

            locationTransfer.items.forEach(function (item) {
                let inventory = AverageInventories.findOne({
                    branchId: locationTransfer.branchId,
                    itemId: item.itemId,
                    stockLocationId: locationTransfer.fromStockLocationId
                }, {sort: {_id: 1}});

                let newInventory = {
                    _id: idGenerator.genWithPrefix(AverageInventories, prefix, 13),
                    branchId: locationTransfer.branchId,
                    stockLocationId: locationTransfer.fromStockLocationId,
                    itemId: item.itemId,
                    qty: item.qty,
                    price: inventory.price,
                    remainQty: inventory.remainQty - item.qty,
                    coefficient: -1,
                    type: 'transfer-from',
                    refId: locationTransferId
                };

                AverageInventories.insert(newInventory);
                item.price = inventory.price;
                item.amount = inventory.price * item.qty;
                total += item.amount;
                newItems.push(item);
                averageInventoryInsert(
                    locationTransfer.branchId,
                    item,
                    locationTransfer.toStockLocationId,
                    'transfer-to',
                    locationTransferId
                );
                //inventories=sortArrayByKey()
            });
            let setObj = {};
            setObj.items = newItems;
            setObj.total = total;
            LocationTransfers.direct.update(
                locationTransferId,
                {$set: setObj}
            );
            //--- End Inventory type block "FIFO Inventory"---
        });
    },
    returnToInventory: function (invoiceId, branchId) {
        if (!Meteor.userId()) {
            throw new Meteor.Error("not-authorized");
        }
        let prefix = branchId + '-';
        Meteor.defer(function () {
            //---Open Inventory type block "Average Inventory"---
            let invoice = Invoices.findOne(invoiceId);
            invoice.items.forEach(function (item) {
                item.price = item.cost;
                averageInventoryInsert(
                    invoice.branchId,
                    item,
                    invoice.stockLocationId,
                    'invoice-return',
                    invoiceId
                );
            });
            //--- End Inventory type block "Average Inventory"---
        });
    },
    isEnoughStock: function (enterBillId) {
        let enterBill = enterBill.findOne(enterBillId);
        let enough = true;
        enterBill.items.forEach(function (item) {
            let inventory = AverageInventories.findOne({
                branchId: enterBill.branchId,
                itemId: item.itemId,
                locationId: item.locationId,
                price: item.price
            }, {fields: {_id: 1, remainQty: 1, quantity: 1}});
            if (inventory.remainQty < item.qty) {
                enough = false;
                return false;
            }
        });
        return enough;
    },
    reduceFromInventory: function (enterBillId) {
        if (!Meteor.userId()) {
            throw new Meteor.Error("not-authorized");
        }
        Meteor.defer(function () {
            let enterBill = EnterBills.findOne(enterBillId);
            enterBill.items.forEach(function (item) {
                let inventory = AverageInventories.findOne({
                    branchId: enterBill.branchId,
                    itemId: item.itemId,
                    stockLocationId: enterBill.stockLocationId
                }, {sort: {_id: 1}});
                let newInventory = {
                    _id: idGenerator.genWithPrefix(AverageInventories, prefix, 13),
                    branchId: enterBill.branchId,
                    stockLocationId: enterBill.stockLocationId,
                    itemId: item.itemId,
                    qty: item.qty,
                    price: inventory.price,
                    remainQty: inventory.remainQty - item.qty,
                    coefficient: -1,
                    type: 'enter-return',
                    refId: enterBillId
                };
                AverageInventories.insert(newInventory);
            });
        });
    }
});
function averageInventoryInsert(branchId, item, stockLocationId, type, refId) {
    let lastPurchasePrice = 0;
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
        lastPurchasePrice = item.price;
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
        lastPurchasePrice = item.price;
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
        nextInventory.price = math.round(price);
        nextInventory.remainQty = totalQty;
        nextInventory.type = type;
        nextInventory.coefficient = 1;
        nextInventory.refId = refId;
        lastPurchasePrice = price;
        AverageInventories.insert(nextInventory);
    }
    Item.direct.update(item.itemId, {$set: {enterBillPrice: lastPurchasePrice}});
}

