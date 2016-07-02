/*
import {AverageInventories} from '../../imports/api/collections/inventory.js';
import {EnterBills} from '../../imports/api/collections/enterBill.js'
import {Invoices} from '../../imports/api/collections/invoice.js'
import {LocationTransfers} from '../../imports/api/collections/locationTransfer.js'
import {idGenerator} from 'meteor/theara:id-generator';
import 'meteor/matb33:collection-hooks';

Meteor.methods({
    purchaseManageStock: function (enterBillId) {
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
                }, {sort: {_id: 1}}).fetch();
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
            let ///////////////
            locationTransfer.items.forEach(function (item) {
                let transaction = [];
                let inventory = AverageInventories.findOne({
                    branchId: locationTransfer.branchId,
                    itemId: item.itemId,
                    stockLocationId: locationTransfer.fromStockLocationId
                }, {sort: {_id: 1}}).fetch();

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
            setObj.transaction = transaction;
            setObj.status = "Saved";
            Pos.Collection.LocationTransferDetails.direct.update(
                item._id,
                {$set: setObj}
            );
            //--- End Inventory type block "FIFO Inventory"---
        });
    },
    returnToInventory: function (saleId, branchId) {
        if (!Meteor.userId()) {
            throw new Meteor.Error("not-authorized");
        }
        let prefix = branchId + '-';
        Meteor.defer(function () {
            //---Open Inventory type block "FIFO Inventory"---
            let saleDetails = Pos.Collection.SaleDetails.find({saleId: saleId});
            saleDetails.forEach(function (sd) {
                sd.transaction.forEach(function (tr) {
                    sd.price = tr.price;
                    sd.quantity = tr.quantity;
                    //fifoInventoryInsert(branchId,sd,prefix);
                    let inventory = AverageInventories.findOne({
                        branchId: branchId,
                        productId: sd.productId,
                        locationId: sd.locationId
                        //price: pd.price
                    }, {sort: {createdAt: -1}});
                    if (inventory == null) {
                        let inventoryObj = {};
                        inventoryObj._id = idGenerator.genWithPrefix(AverageInventories, prefix, 13);
                        inventoryObj.branchId = branchId;
                        inventoryObj.productId = sd.productId;
                        inventoryObj.quantity = tr.quantity;
                        inventoryObj.locationId = sd.locationId;
                        inventoryObj.price = tr.price;
                        inventoryObj.imei = sd.imei;
                        inventoryObj.remainQty = tr.quantity;
                        inventoryObj.isSale = false;
                        AverageInventories.insert(inventoryObj);
                    }
                    else if (inventory.price == tr.price) {
                        let inventorySet = {};
                        inventorySet.quantity = tr.quantity + inventory.quantity;
                        inventorySet.imei = inventory.imei.concat(sd.imei);
                        inventorySet.remainQty = inventory.remainQty + sd.quantity;
                        inventorySet.isSale = false;
                        AverageInventories.update(inventory._id, {$set: inventorySet});
                    }
                    else {
                        let nextInventory = {};
                        nextInventory._id = idGenerator.genWithPrefix(AverageInventories, prefix, 13);
                        nextInventory.branchId = branchId;
                        nextInventory.productId = sd.productId;
                        nextInventory.locationId = sd.locationId;
                        nextInventory.quantity = tr.quantity;
                        nextInventory.price = tr.price;
                        nextInventory.imei = inventory.imei.concat(sd.imei);
                        nextInventory.remainQty = inventory.remainQty + tr.quantity;
                        nextInventory.isSale = false;
                        AverageInventories.insert(nextInventory);
                    }
                });
            });
            //--- End Inventory type block "FIFO Inventory"---
        });
    },
    isEnoughStock: function (purchaseId, branchId) {
        let purchaseDetails = Pos.Collection.PurchaseDetails.find({purchaseId: purchaseId});
        let enough = true;
        purchaseDetails.forEach(function (pd) {
            let inventories = AverageInventories.find({
                branchId: branchId,
                productId: pd.productId,
                locationId: pd.locationId,
                price: pd.price,
                isSale: false
            }, {fields: {_id: 1, remainQty: 1, quantity: 1}});
            let remainQuantity = 0;
            inventories.forEach(function (inventory) {
                if (inventory.remainQty - inventory.quantity < 0) {
                    remainQuantity += inventory.remainQty;
                } else {
                    remainQuantity += inventory.quantity;
                }
            });
            if (remainQuantity < pd.quantity) {
                enough = false;
                return false;
            }
        });
        return enough;
    },
    reduceFromInventory: function (purchaseId, branchId) {
        if (!Meteor.userId()) {
            throw new Meteor.Error("not-authorized");
        }
        Meteor.defer(function () {
            let purchaseDetails = Pos.Collection.PurchaseDetails.find({purchaseId: purchaseId});
            purchaseDetails.forEach(function (pd) {
                let inventories = AverageInventories.find({
                    branchId: branchId,
                    productId: pd.productId,
                    locationId: pd.locationId,
                    isSale: false
                }, {sort: {_id: -1}}).fetch();
                let enoughQuantity = pd.quantity;
                for (let i = 0; i < inventories.length; i++) {
                    let inventorySet = {};
                    if (inventories[i].price == pd.price && enoughQuantity != 0) {
                        let remainQuantity = inventories[i].quantity - enoughQuantity;
                        if (remainQuantity > 0) {
                            inventorySet.quantity = remainQuantity;
                            inventorySet.remainQty = inventories[i].remainQty - enoughQuantity;
                            inventorySet.imei = subtractImeiArray(inventories[i].imei, pd.imei);
                            enoughQuantity = 0;
                            AverageInventories.update(inventories[i]._id, {$set: inventorySet});
                        } else {
                            enoughQuantity -= inventories[i].quantity;
                            AverageInventories.direct.remove(inventories[i]._id);
                        }
                    } else {
                        inventorySet.remainQty = inventories[i].remainQty - enoughQuantity;
                        inventorySet.imei = subtractImeiArray(inventories[i].imei, pd.imei);
                        AverageInventories.update(inventories[i]._id, {$set: inventorySet});
                    }
                }
            })
        });
    }
});
function averageInventoryInsert(branchId, item, stockLocationId, type, refId) {
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
        AverageInventories.insert(inventoryObj);
        /!*
         let
         inventorySet = {};
         inventorySet.qty = item.qty + inventory.qty;
         inventorySet.remainQty = inventory.remainQty + item.qty;
         AverageInventories.update(inventory._id, {$set: inventorySet});
         *!/
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
        AverageInventories.insert(nextInventory);
    }
}
*/
