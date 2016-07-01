/*
import {AverageInventories} from '../../imports/api/collections/inventory.js';
import {EnterBills} from '../../imports/api/collections/enterBill.js'
import {Invoices} from '../../imports/api/collections/invoice.js'
import {idGenerator} from 'meteor/theara:id-generator';

Meteor.methods({
    purchaseManageStock: function (enterBillId) {
        if (!Meteor.userId()) {
            throw new Meteor.Error("not-authorized");
        }
        Meteor.defer(function () {
            //---Open Inventory type block "Average Inventory"---
            var enterBill = EnterBills.findOne(enterBillId);
            enterBill.items.forEach(function (item) {
                averageInventoryInsert(enterBill.branchId, item, enterBill.stockLocationId);
            });
            //--- End Inventory type block "Average Inventory"---
        });
    },
    invoiceManageStock: function (invoiceId) {
        if (!Meteor.userId()) {
            throw new Meteor.Error("not-authorized");
        }
        Meteor.defer(function () {
            //---Open Inventory type block "FIFO Inventory"---
            let totalCost = 0;
            let invoice = Invoices.findOne(invoiceId);
            let prefix = invoice.stockLocationId + "-";
            let newItems = [];
            invoice.items.forEach(function (item) {
                let inventory = AverageInventories.findOne({
                    branchId: invoice.branchId,
                    itemId: item.itemId,
                    stockLocationId: invoice.locationId
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
                {$set: {items: newItems, totalCost: totalCost, profit: invoice.total - totalCost}}
            );
            //--- End Invenetory type block "FIFO Inventory"---
        });
    },
    locationTransferManageStock: function (locationTransferId, branchId) {
        if (!Meteor.userId()) {
            throw new Meteor.Error("not-authorized");
        }
        Meteor.defer(function () {
            //---Open Inventory type block "FIFO Inventory"---
            var locationTransferTotalCost = 0;
            var locationTransferDetails = Pos.Collection.LocationTransferDetails.find({locationTransferId: locationTransferId});
            var prefix = branchId + "-";
            locationTransferDetails.forEach(function (ltd) {
                    var transaction = [];
                    var inventories = AverageInventories.find({
                        branchId: branchId,
                        productId: ltd.productId,
                        locationId: ltd.fromLocationId,
                        isSale: false
                    }, {sort: {_id: 1}}).fetch();
                    //var enoughQuantity = ltd.quantity;
                    for (var i = 0; i < inventories.length; i++) {
                        //or if(enoughQuantity==0){ return false; //to stop the loop.}
                        var inventorySet = {};
                        var remainQty = (inventories[i].remainQty - ltd.quantity);
                        var quantityOfThisPrice = 0;
                        if (remainQty <= 0) {
                            inventorySet.remainQty = 0;
                            inventorySet.isSale = true;
                            if ((inventories[i].remainQty - inventories[i].quantity) >= 0) {
                                quantityOfThisPrice = inventories[i].quantity - 0;
                            } else {
                                quantityOfThisPrice = inventories[i].remainQty - 0;
                            }
                        }
                        else {
                            inventorySet.remainQty = remainQty;
                            inventorySet.isSale = false;
                            if ((inventories[i].remainQty - inventories[i].quantity) >= 0) {
                                quantityOfThisPrice = inventories[i].quantity - remainQty;
                            } else {
                                quantityOfThisPrice = inventories[i].remainQty - remainQty;
                            }
                        }
                        //if (enoughQuantity != 0) {
                        if (quantityOfThisPrice > 0) {
                            transaction.push({quantity: quantityOfThisPrice, price: inventories[i].price});
                            // transaction.push({quantity: quantityOfThisPrice, price: inventories[i].price})
                            var purchaseDetailObj = {};
                            purchaseDetailObj.locationId = ltd.toLocationId;
                            purchaseDetailObj.productId = ltd.productId;
                            purchaseDetailObj.quantity = quantityOfThisPrice;
                            purchaseDetailObj.price = inventories[i].price;
                            purchaseDetailObj.imei = ltd.imei;
                            fifoInventoryInsert(branchId, purchaseDetailObj, prefix);
                        }
                        //}
                        //enoughQuantity -= quantityOfThisPrice;
                        if (i == inventories.length - 1) {
                            inventorySet.imei = subtractImeiArray(inventories[i].imei, ltd.imei);
                        }
                        AverageInventories.update(inventories[i]._id, {$set: inventorySet});
                        // var quantityOfThisPrice = inventories[i].quantity - remainQty;
                    }
                    var setObj = {};
                    setObj.transaction = transaction;
                    setObj.status = "Saved";
                    Pos.Collection.LocationTransferDetails.direct.update(
                        ltd._id,
                        {$set: setObj}
                    );
                    //inventories=sortArrayByKey()
                }
            );
            //--- End Inventory type block "FIFO Inventory"---
        });
    },
    returnToInventory: function (saleId, branchId) {
        if (!Meteor.userId()) {
            throw new Meteor.Error("not-authorized");
        }
        var prefix = branchId + '-';
        Meteor.defer(function () {
            //---Open Inventory type block "FIFO Inventory"---
            var saleDetails = Pos.Collection.SaleDetails.find({saleId: saleId});
            saleDetails.forEach(function (sd) {
                sd.transaction.forEach(function (tr) {
                    sd.price = tr.price;
                    sd.quantity = tr.quantity;
                    //fifoInventoryInsert(branchId,sd,prefix);
                    var inventory = AverageInventories.findOne({
                        branchId: branchId,
                        productId: sd.productId,
                        locationId: sd.locationId
                        //price: pd.price
                    }, {sort: {createdAt: -1}});
                    if (inventory == null) {
                        var inventoryObj = {};
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
                        var inventorySet = {};
                        inventorySet.quantity = tr.quantity + inventory.quantity;
                        inventorySet.imei = inventory.imei.concat(sd.imei);
                        inventorySet.remainQty = inventory.remainQty + sd.quantity;
                        inventorySet.isSale = false;
                        AverageInventories.update(inventory._id, {$set: inventorySet});
                    }
                    else {
                        var nextInventory = {};
                        nextInventory._id = idGenerator.genWithPrefix(AverageInventories, prefix, 13);
                        nextInventory.branchId = branchId;
                        nextInventory.productId = sd.productId;
                        inventoryObj.locationId = sd.locationId;
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
        var purchaseDetails = Pos.Collection.PurchaseDetails.find({purchaseId: purchaseId});
        var enough = true;
        purchaseDetails.forEach(function (pd) {
            var inventories = AverageInventories.find({
                branchId: branchId,
                productId: pd.productId,
                locationId: pd.locationId,
                price: pd.price,
                isSale: false
            }, {fields: {_id: 1, remainQty: 1, quantity: 1}});
            var remainQuantity = 0;
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
            var purchaseDetails = Pos.Collection.PurchaseDetails.find({purchaseId: purchaseId});
            purchaseDetails.forEach(function (pd) {
                var inventories = AverageInventories.find({
                    branchId: branchId,
                    productId: pd.productId,
                    locationId: pd.locationId,
                    isSale: false
                }, {sort: {_id: -1}}).fetch();
                var enoughQuantity = pd.quantity;
                for (var i = 0; i < inventories.length; i++) {
                    var inventorySet = {};
                    if (inventories[i].price == pd.price && enoughQuantity != 0) {
                        var remainQuantity = inventories[i].quantity - enoughQuantity;
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
        inventoryObj.coefficient = -1;
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
        AverageInventories.insert(inventoryObj);

        /!*
         var inventorySet = {};
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
        AverageInventories.insert(nextInventory);
    }
}
*/
