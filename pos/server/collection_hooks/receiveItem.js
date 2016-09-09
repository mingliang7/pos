import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {ReceiveItems} from '../../imports/api/collections/receiveItem.js';
import {AverageInventories} from '../../imports/api/collections/inventory.js';
import {Item} from '../../imports/api/collections/item.js';
import {PrepaidOrders} from '../../imports/api/collections/prepaidOrder';
//import state
import {receiveItemState} from '../../common/globalState/receiveItem';
import {GroupBill} from '../../imports/api/collections/groupBill.js'
import {PayBills} from '../../imports/api/collections/payBill.js';
ReceiveItems.before.insert(function (userId, doc) {
    if (doc.total == 0) {
        doc.status = 'closed';
        doc.billType = 'prepaidOrder'
    } else if (doc.termId) {
        doc.status = 'partial';
        doc.billType = 'term';
    } else {
        doc.status = 'partial';
        doc.billType = 'group';
    }
    let todayDate = moment().format('YYYYMMDD');
    let prefix = doc.branchId + "-" + todayDate;
    let tmpBillId = doc._id;
    doc._id = idGenerator.genWithPrefix(ReceiveItems, prefix, 4);
    receiveItemState.set(tmpBillId, {vendorId: doc.vendorId, billId: doc._id, total: doc.total});

});

ReceiveItems.after.insert(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        if (doc.billType == 'group') {
            Meteor.call('pos.generateInvoiceGroup', {doc});
        }
        if (doc.prepaidOrderId) {
            doc.items.forEach(function (item) {
                PrepaidOrders.direct.update(
                    {
                        _id: doc.prepaidOrderId,
                        "items.itemId": item.itemId
                    },
                    {
                        $inc: {
                            sumRemainQty: -item.qty,
                            "items.$.remainQty": -item.qty
                        }
                    });
            });
            let prepaidOrder = PrepaidOrders.findOne(doc.prepaidOrderId);
            if (prepaidOrder.sumRemainQty == 0) {
                PrepaidOrders.direct.update(prepaidOrder._id, {$set: {status: 'closed'}});
            }
        } else {
            if (doc.status == "active") {
            } else {
                console.log('from receiveItem after insert');
                doc.items.forEach(function (item) {
                    averageInventoryInsert(doc.branchId, item, doc.stockLocationId, 'receiveItem', doc._id);
                });
            }
        }
    });
});

ReceiveItems.after.update(function (userId, doc, fieldNames, modifier, options) {
    let preDoc = this.previous;
    let type = {
        prepaidOrder: doc.billType == 'prepaidOrder',
        term: doc.billType == 'term',
        group: doc.billType == 'group'
    };
    if (type.prepaidOrder) {
        Meteor.defer(function () {
            recalculateQty(preDoc);
            updateQtyInPrepaidOrder(doc);
            let prepaidOrder = PrepaidOrders.aggregate([{$match: {_id: doc.prepaidOrderId}}, {$projection: {sumRemainQty: 1}}]);
            if (prepaidOrder.sumRemainQty == 0) {
                PrepaidOrders.direct.update(doc.prepaidOrderId, {$set: {status: 'closed'}});
            } else {
                PrepaidOrders.direct.update(doc.prepaidOrderId, {$set: {status: 'active'}});
            }
        });
    } else if (type.group) {
        Meteor.defer(function () {
            removeBillFromGroup(preDoc);
            pushBillFromGroup(doc);
            recalculatePayment({preDoc, doc});
            // invoiceState.set(doc._id, {customerId: doc.customerId, invoiceId: doc._id, total: doc.total});
        });
        //////////
        if (doc.status == "active") {
        } else {
            Meteor.defer(function () {
                Meteor._sleepForMs(200);
                reduceFromInventory(preDoc);
                doc.items.forEach(function (item) {
                    averageInventoryInsert(doc.branchId, item, doc.stockLocationId, 'receiveItem', doc._id);
                });

            });
        }
        //////////

    } else {
        Meteor.defer(function () {
            Meteor._sleepForMs(200);
            recalculatePayment({preDoc, doc});
        });
        //////////
        if (doc.status == "active") {
        } else {
            Meteor.defer(function () {
                Meteor._sleepForMs(200);
                reduceFromInventory(preDoc);
                doc.items.forEach(function (item) {
                    averageInventoryInsert(doc.branchId, item, doc.stockLocationId, 'receiveItem', doc._id);
                });

            });
        }
        //////////
    }

});

ReceiveItems.after.remove(function (userId, doc) {

    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        let type = {
            prepaidOrder: doc.billType == 'prepaidOrder',
            term: doc.billType == 'term',
            group: doc.billType == 'group'
        };
        if (type.prepaidOrder) {
            recalculateQty(doc);
            PrepaidOrders.direct.update(doc.prepaidOrderId, {$set: {status: 'active'}});
        } else if (type.group) {
            reduceFromInventory(doc);
            removeBillFromGroup(doc);
            let groupBill = GroupBill.findOne(doc.paymentGroupId);
            if (groupBill.invoices.length <= 0) {
                GroupBill.direct.remove(doc.paymentGroupId);
            }else{
                recalculatePaymentAfterRemoved({doc});
            }
        }else if (type.term) {
            reduceFromInventory(doc);
            Meteor.call('insertRemovedBill', doc);
        }

    });
});


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
        nextInventory.price = math.round(price,2);
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
function reduceFromInventory(receiveItem) {
    //let receiveItem = ReceiveItems.findOne(receiveItemId);
    let prefix = receiveItem.stockLocationId + '-';
    receiveItem.items.forEach(function (item) {
        let inventory = AverageInventories.findOne({
            branchId: receiveItem.branchId,
            itemId: item.itemId,
            stockLocationId: receiveItem.stockLocationId
        }, {sort: {_id: 1}});

        if (inventory) {
            let newInventory = {
                _id: idGenerator.genWithPrefix(AverageInventories, prefix, 13),
                branchId: receiveItem.branchId,
                stockLocationId: receiveItem.stockLocationId,
                itemId: item.itemId,
                qty: item.qty,
                price: inventory.price,
                remainQty: inventory.remainQty - item.qty,
                coefficient: -1,
                type: 'enter-return',
                refId: receiveItem._id
            };
            AverageInventories.insert(newInventory);
        } else {
            let thisItem = Item.findOne(item.itemId);
            let newInventory = {
                _id: idGenerator.genWithPrefix(AverageInventories, prefix, 13),
                branchId: receiveItem.branchId,
                stockLocationId: receiveItem.stockLocationId,
                itemId: item.itemId,
                qty: item.qty,
                price: thisItem.purchasePrice,
                remainQty: 0 - item.qty,
                coefficient: -1,
                type: 'enter-return',
                refId: receiveItem._id
            };
            AverageInventories.insert(newInventory);
        }

    });

}
/*
 function payBillInsert(doc){
 let payObj={};
 payObj._id=idGenerator.genWithPrefix()
 }*/
//recalculate qty
function recalculateQty(preDoc) {
    Meteor._sleepForMs(200);
    let updatedFlag;
    preDoc.items.forEach(function (item) {
        PrepaidOrders.direct.update(
            {_id: preDoc.prepaidOrderId, 'items.itemId': item.itemId},
            {$inc: {'items.$.remainQty': item.qty, sumRemainQty: item.qty}}
        ); //re sum remain qty
    });
}
//update qty
function updateQtyInPrepaidOrder(doc) {
    Meteor._sleepForMs(200);
    doc.items.forEach(function (item) {
        PrepaidOrders.direct.update(
            {_id: doc.prepaidOrderId, 'items.itemId': item.itemId},
            {$inc: {'items.$.remainQty': -item.qty, sumRemainQty: -item.qty}}
        )
    });
}
// update group invoice
function removeBillFromGroup(doc) {
    Meteor._sleepForMs(200);
    GroupBill.update({_id: doc.paymentGroupId}, {$pull: {invoices: {_id: doc._id}}, $inc: {total: -doc.total}});
}
function pushBillFromGroup(doc) {
    Meteor._sleepForMs(200);
    GroupBill.update({_id: doc.paymentGroupId}, {$addToSet: {invoices: doc}, $inc: {total: doc.total}});
}
//update payment
function recalculatePayment({doc,preDoc}) {
    let totalChanged = doc.total - preDoc.total;
    if (totalChanged != 0) {
        let billId = doc.paymentGroupId || doc._id;
        let receivePayment = PayBills.find({billId: billId});
        if (receivePayment.count() > 0) {
            PayBills.update({billId: billId}, {
                $inc: {
                    dueAmount: totalChanged,
                    balanceAmount: totalChanged
                }
            }, {multi: true});
            PayBills.remove({billId: billId, dueAmount: {$lte: 0}});
        }
    }
}
//update payment after remove
function recalculatePaymentAfterRemoved({doc}) {
    let totalChanged = -doc.total;
    if (totalChanged != 0) {
        let billId = doc.paymentGroupId;
        let receivePayment = PayBills.find({billId: billId});
        if (receivePayment.count() > 0) {
            PayBills.update({billId: billId}, {
                $inc: {
                    dueAmount: totalChanged,
                    balanceAmount: totalChanged
                }
            }, {multi: true});
            PayBills.direct.remove({billId: billId, dueAmount: {$lte: 0}});
        }
    }
}

/*receive item type

 ----PrepaidOrder-----
 insert: increase AverageInventory and reduce from PrepaidOrder(doc)
 Note: (update the remain qty of prepaidOrder);
 update: reduce AverageInventory and increase the PrepaidOrder back(previous doc);
 increase AverageInventory and reduce from PrepaidOrder( doc)
 remove: reduce AverageInventory and Increase the PrepaidOrder back(doc)

 ----LendingStock-----
 insert: increase AverageInventory and reduce from LendingStock(doc)
 update: reduce AverageInventory and increase the LendingStock(previous doc)
 increase AverageInventory and reduce from LendingStock(doc)
 remove: reduce AverageInventory and increase the LendingStock(doc)

 ----Ring Pull----
 insert: increase AverageInventory and reduce from Ring Pull (doc)
 update: reduce AverageInventory and increase the Ring Pull(previous doc)
 increase AverageInventory and reduce from Ring Pull(doc)
 remove: reduce AverageInventory and increase teh Ring Pull(doc)

 ----Gratis----
 insert: increase AverageInventory and reduce from Gratis (doc)
 update: reduce AverageInventory and increase the Gratis(previous doc)
 increase AverageInventory and reduce from Gratis(doc)
 remove: reduce AverageInventory and increase the Gratis(doc)

 */




