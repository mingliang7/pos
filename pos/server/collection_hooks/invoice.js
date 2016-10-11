import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {Invoices} from '../../imports/api/collections/invoice.js';
import {ReceivePayment} from '../../imports/api/collections/receivePayment.js';
import {Order} from '../../imports/api/collections/order';
import {GroupInvoice} from '../../imports/api/collections/groupInvoice';
import {AverageInventories} from '../../imports/api/collections/inventory.js';
import {Item} from '../../imports/api/collections/item.js'
import {GratisInventories} from '../../imports/api/collections/gratisInventory.js'
import {AccountIntegrationSetting} from '../../imports/api/collections/accountIntegrationSetting.js'
//import invoice state
import {invoiceState} from '../../common/globalState/invoice';
//import methods
import {updateItemInSaleOrder} from '../../common/methods/sale-order';
Invoices.before.insert(function (userId, doc) {
    if (doc.total == 0) {
        doc.status = 'closed';
        doc.invoiceType = 'saleOrder'
    } else if (doc.termId) {
        doc.status = 'active';
        doc.invoiceType = 'term'
    } else {
        doc.status = 'active';
        doc.invoiceType = 'group';
    }
    let tmpInvoiceId = doc._id;
    let todayDate = moment().format('YYYYMMDD');
    let prefix = doc.branchId + "-" + todayDate;
    doc._id = idGenerator.genWithPrefix(Invoices, prefix, 4);
    invoiceState.set(tmpInvoiceId, {customerId: doc.customerId, invoiceId: doc._id, total: doc.total});
});

Invoices.after.insert(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        let totalRemain = 0;
        if (doc.saleId) {
            doc.items.forEach(function (item) {
                Order.direct.update(
                    {
                        _id: doc.saleId,
                        "items.itemId": item.itemId
                    },
                    {
                        $inc: {
                            sumRemainQty: -item.qty,
                            "items.$.remainQty": -item.qty
                        }
                    });
            });
            let saleOrder = Order.findOne(doc.saleId);
            if (saleOrder.sumRemainQty == 0) {
                Order.direct.update(saleOrder._id, {$set: {status: 'closed'}});
            }
        } else {
            invoiceManageStock(doc);
            doc.items.forEach(function (item) {
                if (item.price == 0) {
                    increaseGratisInventory(item, doc.branchId, doc.stockLocationId);
                }
            });
        }
        if (doc.invoiceType == 'group') {
            Meteor.call('pos.generateInvoiceGroup', {doc});
        }
        //Account Integration
        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let transaction = [];
            let data = doc;
            data.type = "Invoice";
            data.items.forEach(function (item) {
                let itemDoc = Item.findOne(item.itemId);
                if (itemDoc.accountMapping.accountReceivable && itemDoc.accountMapping.inventoryAsset) {
                    transaction.push({
                        account: itemDoc.accountMapping.accountReceivable,
                        dr: item.amount,
                        cr: 0,
                        drcr: item.amount
                    }, {
                        account: itemDoc.accountMapping.inventoryAsset,
                        dr: 0,
                        cr: item.amount,
                        drcr: -item.amount
                    })
                }
            });
            data.transaction = transaction;
            Meteor.call('insertAccountJournal', data);
        }
        //End Account Integration
    });
});

Invoices.after.update(function (userId, doc) {
    let preDoc = this.previous;
    let type = {
        saleOrder: doc.invoiceType == 'saleOrder',
        term: doc.invoiceType == 'term',
        group: doc.invoiceType == 'group'
    };
    if (type.saleOrder) {
        Meteor.defer(function () {
            recalculateQty(preDoc);
            updateQtyInSaleOrder(doc);
            let saleOrder = Order.aggregate([{$match: {_id: doc.saleId}}, {$projection: {sumRemainQty: 1}}]);
            if (saleOrder.sumRemainQty == 0) {
                Order.direct.update(doc.saleId, {$set: {status: 'closed'}});
            } else {
                Order.direct.update(doc.saleId, {$set: {status: 'active'}});
            }
        });
    } else if (type.group) {
        Meteor.defer(function () {
            removeInvoiceFromGroup(preDoc);
            pushInvoiceFromGroup(doc);
            recalculatePayment({preDoc, doc});
            preDoc.items.forEach(function (item) {
                if (item.price == 0) {
                    reduceGratisInventory(item, preDoc.branchId, preDoc.stockLocationId);
                }
            });

            //average inventory calculate
            returnToInventory(preDoc);
            invoiceManageStock(doc);
            doc.items.forEach(function (item) {
                if (item.price == 0) {
                    increaseGratisInventory(item, doc.branchId, doc.stockLocationId);
                }
            });

            // invoiceState.set(doc._id, {customerId: doc.customerId, invoiceId: doc._id, total: doc.total});
        });

    } else {
        Meteor.defer(function () {
            Meteor._sleepForMs(200);
            recalculatePayment({preDoc, doc});
            preDoc.items.forEach(function (item) {
                if (item.price == 0) {
                    reduceGratisInventory(item, preDoc.branchId, preDoc.stockLocationId);
                }
            });

            //average inventory calculate
            returnToInventory(preDoc);
            invoiceManageStock(doc);
            doc.items.forEach(function (item) {
                if (item.price == 0) {
                    increaseGratisInventory(item, doc.branchId, doc.stockLocationId);
                }
            });
        })
    }
    Meteor.defer(function () {
        //Account Integration
        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let transaction = [];
            let data = doc;
            data.type = "Invoice";
            data.items.forEach(function (item) {
                let itemDoc = Item.findOne(item.itemId);
                if (itemDoc.accountMapping.accountReceivable && itemDoc.accountMapping.inventoryAsset) {
                    transaction.push({
                        account: itemDoc.accountMapping.accountReceivable,
                        dr: item.amount,
                        cr: 0,
                        drcr: item.amount
                    }, {
                        account: itemDoc.accountMapping.inventoryAsset,
                        dr: 0,
                        cr: item.amount,
                        drcr: -item.amount
                    })
                }
            });
            data.transaction = transaction;
            Meteor.call('updateAccountJournal', data);
        }
        //End Account Integration
    });

});

//remove
Invoices.after.remove(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        let type = {
            saleOrder: doc.invoiceType == 'saleOrder',
            term: doc.invoiceType == 'term',
            group: doc.invoiceType == 'group'
        };
        if (type.saleOrder) {
            recalculateQty(doc);
            Order.direct.update(doc.saleId, {$set: {status: 'active'}});
        } else if (type.group) {
            removeInvoiceFromGroup(doc);
            let groupInvoice = GroupInvoice.findOne(doc.paymentGroupId);
            if (groupInvoice.invoices.length <= 0) {
                GroupInvoice.direct.remove(doc.paymentGroupId);
            } else {
                recalculatePaymentAfterRemoved({doc});
            }
            //average inventory calculation
            returnToInventory(doc);
            doc.items.forEach(function (item) {
                if (item.price == 0) {
                    reduceGratisInventory(item, doc.branchId, doc.stockLocationId);
                }
            });
        } else {
            //average inventory calculation
            returnToInventory(doc);
            doc.items.forEach(function (item) {
                if (item.price == 0) {
                    reduceGratisInventory(item, doc.branchId, doc.stockLocationId);
                }
            });
        }
        Meteor.call('insertRemovedInvoice', doc);
        //Account Integration
        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let data = {_id: doc._id, type: 'Invoice'};
            Meteor.call('removeAccountJournal', data);
        }
        //End Account Integration

    });
});

//update qty
function updateQtyInSaleOrder(doc) {
    Meteor._sleepForMs(200);
    doc.items.forEach(function (item) {
        Order.direct.update(
            {_id: doc.saleId, 'items.itemId': item.itemId},
            {$inc: {'items.$.remainQty': -item.qty, sumRemainQty: -item.qty}}
        )
    });
}
//recalculate qty
function recalculateQty(preDoc) {
    Meteor._sleepForMs(200);
    let updatedFlag;
    preDoc.items.forEach(function (item) {
        Order.direct.update(
            {_id: preDoc.saleId, 'items.itemId': item.itemId},
            {$inc: {'items.$.remainQty': item.qty, sumRemainQty: item.qty}}
        ); //re sum remain qty
    });
}

// update group invoice
function removeInvoiceFromGroup(doc) {
    Meteor._sleepForMs(200);
    GroupInvoice.update({_id: doc.paymentGroupId}, {$pull: {invoices: {_id: doc._id}}, $inc: {total: -doc.total}});
}

function pushInvoiceFromGroup(doc) {
    Meteor._sleepForMs(200);
    GroupInvoice.update({_id: doc.paymentGroupId}, {$addToSet: {invoices: doc}, $inc: {total: doc.total}});
}

//update inventory
function returnToInventory(invoice) {
    //---Open Inventory type block "Average Inventory"---
    // let invoice = Invoices.findOne(invoiceId);
    invoice.items.forEach(function (item) {
        item.price = item.cost;
        averageInventoryInsert(
            invoice.branchId,
            item,
            invoice.stockLocationId,
            'invoice-return',
            invoice._id
        );
    });
    //--- End Inventory type block "Average Inventory"---
}

function invoiceManageStock(invoice) {
    //---Open Inventory type block "Average Inventory"---
    let totalCost = 0;
    // let invoice = Invoices.findOne(invoiceId);
    let prefix = invoice.stockLocationId + "-";
    let newItems = [];
    invoice.items.forEach(function (item) {
        let inventory = AverageInventories.findOne({
            branchId: invoice.branchId,
            itemId: item.itemId,
            stockLocationId: invoice.stockLocationId
        }, {sort: {_id: -1}});
        if (inventory) {
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
                refId: invoice._id
            };
            AverageInventories.insert(newInventory);
        } else {
            var thisItem = Item.findOne(item.itemId);
            item.cost = thisItem.purchasePrice;
            item.amountCost = thisItem.purchasePrice * item.qty;
            item.profit = item.amount - item.amountCost;
            totalCost += item.amountCost;
            newItems.push(item);
            let newInventory = {
                _id: idGenerator.genWithPrefix(AverageInventories, prefix, 13),
                branchId: invoice.branchId,
                stockLocationId: invoice.stockLocationId,
                itemId: item.itemId,
                qty: item.qty,
                price: thisItem.purchasePrice,
                remainQty: 0 - item.qty,
                coefficient: -1,
                type: 'invoice',
                refId: invoice._id
            };
            AverageInventories.insert(newInventory);
        }
    });
    let totalProfit = invoice.total - totalCost;
    Invoices.direct.update(
        invoice._id,
        {$set: {items: newItems, totalCost: totalCost, profit: totalProfit}}
    );
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
        lastPurchasePrice = item.price;
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
        lastPurchasePrice = item.price;
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
        lastPurchasePrice = price;
        remainQuantity = nextInventory.remainQty;
        AverageInventories.insert(nextInventory);
    }

    var setModifier = {$set: {purchasePrice: lastPurchasePrice}};
    setModifier.$set['qtyOnHand.' + stockLocationId] = remainQuantity;
    Item.direct.update(item.itemId, setModifier);
}

//update payment
function recalculatePayment({doc, preDoc}) {
    let totalChanged = doc.total - preDoc.total;
    if (totalChanged != 0) {
        let invoiceId = doc.paymentGroupId || doc._id
        let receivePayment = ReceivePayment.find({invoiceId: invoiceId});
        if (receivePayment.count() > 0) {
            ReceivePayment.update({invoiceId: invoiceId}, {
                $inc: {
                    dueAmount: totalChanged,
                    balanceAmount: totalChanged
                }
            }, {multi: true});
            ReceivePayment.direct.remove({invoiceId: invoiceId, dueAmount: {$lte: 0}});
        }
    }
}

//update payment after remove
function recalculatePaymentAfterRemoved({doc}) {
    let totalChanged = -doc.total;
    if (totalChanged != 0) {
        let invoiceId = doc.paymentGroupId;
        let receivePayment = ReceivePayment.find({invoiceId: invoiceId});
        if (receivePayment.count() > 0) {
            ReceivePayment.update({invoiceId: invoiceId}, {
                $inc: {
                    dueAmount: totalChanged,
                    balanceAmount: totalChanged
                }
            }, {multi: true});
            ReceivePayment.direct.remove({invoiceId: invoiceId, dueAmount: {$lte: 0}});
        }
    }
}


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