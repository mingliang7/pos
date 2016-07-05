import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {Invoices} from '../../imports/api/collections/invoice.js';
import {Order} from '../../imports/api/collections/order';
import {GroupInvoice} from '../../imports/api/collections/groupInvoice';
import {AverageInventories} from '../../imports/api/collections/inventory.js';
import {Item} from '../../imports/api/collections/item.js'
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
        doc.status == 'active';
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
            invoiceManageStock(doc._id);
        }
        if (doc.invoiceType == 'group') {
            Meteor.call('pos.generateInvoiceGroup', {doc});
        }
    });
});

//update
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
            invoiceState.set(doc._id, {customerId: doc.customerId, invoiceId: doc._id, total: doc.total});
        });
    }
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
            }
        }
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


function invoiceManageStock(invoiceId) {
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
                    refId: invoiceId
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
                    refId: invoiceId
                };
                AverageInventories.insert(newInventory);
            }
        });
        let totalProfit = invoice.total - totalCost;
        Invoices.direct.update(
            invoiceId,
            {$set: {items: newItems, totalCost: totalCost, profit: totalProfit}}
        );
        //--- End Invenetory type block "FIFO Inventory"---
    });
}
