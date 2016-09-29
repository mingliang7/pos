import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {EnterBills} from '../../imports/api/collections/enterBill.js';
import {AverageInventories} from '../../imports/api/collections/inventory.js';
import {Item} from '../../imports/api/collections/item.js';
import {PrepaidOrders} from '../../imports/api/collections/prepaidOrder';
//import state
import {billState} from '../../common/globalState/enterBill';
import {GroupBill} from '../../imports/api/collections/groupBill.js'
import {PayBills} from '../../imports/api/collections/payBill.js';
import {AccountIntegrationSetting} from '../../imports/api/collections/accountIntegrationSetting.js';
EnterBills.before.insert(function (userId, doc) {
    if (doc.termId) {
        doc.status = 'partial';
        doc.billType = 'term';
    } else {
        doc.status = 'partial';
        doc.billType = 'group';
    }
    let todayDate = moment().format('YYYYMMDD');
    let prefix = doc.branchId + "-" + todayDate;
    let tmpBillId = doc._id;
    doc._id = idGenerator.genWithPrefix(EnterBills, prefix, 4);
    billState.set(tmpBillId, {vendorId: doc.vendorId, billId: doc._id, total: doc.total});

});

EnterBills.after.insert(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        let inventoryIdList = [];
        if (doc.billType == 'group') {
            Meteor.call('pos.generateInvoiceGroup', {doc});
        }
        doc.items.forEach(function (item) {
            let id = averageInventoryInsert(doc.branchId, item, doc.stockLocationId, 'insert-bill', doc._id);
            inventoryIdList.push(id);
        });

        //Integration to Account System
        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let transaction = [];
            let data = doc;
            data.type = "EnterBill";
            data.items.forEach(function (item) {
                let itemDoc = Item.findOne(item.itemId);
                if (itemDoc.accountMapping.inventoryAsset && itemDoc.accountMapping.accountPayable) {
                    transaction.push({
                        account: itemDoc.accountMapping.inventoryAsset,
                        dr: item.amount,
                        cr: 0,
                        drcr: item.amount,

                    }, {
                        account: itemDoc.accountMapping.accountPayable,
                        dr: 0,
                        cr: item.amount,
                        drcr: -item.amount,
                    })
                }
            });
            data.transaction = transaction;
            Meteor.call('insertAccountJournal', data, function (er, re) {
                if (er) {
                    AverageInventories.direct.remove({_id: {$in: inventoryIdList}});
                    EnterBills.remove({_id: doc._id});
                    throw new Meteor.Error(er.message);
                } else if (re == null) {
                    AverageInventories.direct.remove({_id: {$in: inventoryIdList}});
                    EnterBills.remove({_id: doc._id});
                    throw new Meteor.Error("Can't Entry to Account System.");
                }
            });
        }

    });
});

EnterBills.after.update(function (userId, doc, fieldNames, modifier, options) {
    let preDoc = this.previous;
    let type = {
        term: doc.billType == 'term',
        group: doc.billType == 'group'
    };
    if (type.group) {
        Meteor.defer(function () {
            removeBillFromGroup(preDoc);
            pushBillFromGroup(doc);
            recalculatePayment({preDoc, doc});
            // invoiceState.set(doc._id, {customerId: doc.customerId, invoiceId: doc._id, total: doc.total});
        });
        Meteor.defer(function () {
            Meteor._sleepForMs(200);
            let inventoryIdList = [];
            doc.items.forEach(function (item) {
                preDoc.items.forEach(function (preItem) {
                    if (item.itemId == preItem.itemId) {
                        let updateQty = item.qty - preItem.qty;
                        item.qty = parseInt(updateQty);
                        if (updateQty > 0) {
                            let id = averageInventoryInsert(doc.branchId, item, doc.stockLocationId, 'increase-from-bill', doc._id);
                            inventoryIdList.push(id);
                        } else if (updateQty < 0) {
                            let id = minusAverageInventoryInsert(doc.branchId, item, doc.stockLocationId, 'reduce-from-bill', doc._id);
                            inventoryIdList.push(id);
                        }
                    }
                })
            });
            /*
             reduceFromInventory(preDoc);
             doc.items.forEach(function (item) {
             averageInventoryInsert(doc.branchId, item, doc.stockLocationId, 'enterBill', doc._id);
             });
             */

            let setting = AccountIntegrationSetting.findOne();
            if (setting && setting.integrate) {
                let transaction = [];
                let data = doc;
                data.type = "EnterBill";
                data.items.forEach(function (item) {
                    let itemDoc = Item.findOne(item.itemId);
                    if (itemDoc.accountMapping.inventoryAsset && itemDoc.accountMapping.accountPayable) {
                        transaction.push({
                            account: itemDoc.accountMapping.inventoryAsset,
                            dr: item.amount,
                            cr: 0,
                            drcr: item.amount,

                        }, {
                            account: itemDoc.accountMapping.accountPayable,
                            dr: 0,
                            cr: item.amount,
                            drcr: -item.amount,
                        })
                    }
                });
                data.transaction = transaction;
                Meteor.call('updateAccountJournal', data, function (er, re) {
                    if (er) {
                        AverageInventories.direct.remove({_id: {$in: inventoryIdList}});
                        EnterBills.direct.update(doc._id, {$set: {preDoc}});
                        throw new Meteor.Error(er.message);

                    } else if (re == false) {
                        AverageInventories.direct.remove({_id: {$in: inventoryIdList}});
                        EnterBills.direct.update(doc._id, {$set: {preDoc}});
                        throw new Meteor.Error("Can't Update on Account System.");
                    }
                });
            }
        });
    } else {
        Meteor.defer(function () {
            Meteor._sleepForMs(200);
            recalculatePayment({preDoc, doc});
        });
        Meteor.defer(function () {
            Meteor._sleepForMs(200);
            let inventoryIdList = [];
            doc.items.forEach(function (item) {
                preDoc.items.forEach(function (preItem) {
                    if (item.itemId == preItem.itemId) {
                        let updateQty = item.qty - preItem.qty;
                        item.qty = parseInt(updateQty);
                        if (updateQty > 0) {
                            let id = averageInventoryInsert(doc.branchId, item, doc.stockLocationId, 'increase-from-bill', doc._id);
                            inventoryIdList.push(id);
                        } else if (updateQty < 0) {
                            let id = minusAverageInventoryInsert(doc.branchId, item, doc.stockLocationId, 'reduce-from-bill', doc._id);
                            inventoryIdList.push(id);
                        }
                    }
                })
            });
            /*
             reduceFromInventory(preDoc);
             doc.items.forEach(function (item) {
             averageInventoryInsert(doc.branchId, item, doc.stockLocationId, 'enterBill', doc._id);
             });
             */

            let setting = AccountIntegrationSetting.findOne();
            if (setting && setting.integrate) {
                let transaction = [];
                let data = doc;
                data.type = "EnterBill";
                data.items.forEach(function (item) {
                    let itemDoc = Item.findOne(item.itemId);
                    if (itemDoc.accountMapping.inventoryAsset && itemDoc.accountMapping.accountPayable) {
                        transaction.push({
                            account: itemDoc.accountMapping.inventoryAsset,
                            dr: item.amount,
                            cr: 0,
                            drcr: item.amount,

                        }, {
                            account: itemDoc.accountMapping.accountPayable,
                            dr: 0,
                            cr: item.amount,
                            drcr: -item.amount,
                        })
                    }
                });
                data.transaction = transaction;
                Meteor.call('updateAccountJournal', data, function (er, re) {
                    if (er) {
                        AverageInventories.direct.remove({_id: {$in: inventoryIdList}});
                        EnterBills.direct.remove(doc._id, {$set: preDoc});
                        throw new Meteor.Error(er.message);

                    } else if (re == false) {
                        AverageInventories.direct.remove({_id: {$in: inventoryIdList}});
                        EnterBills.direct.remove(doc._id, {$set: preDoc});
                        throw new Meteor.Error("Can't Update on Account System.");
                    }
                });
            }
        });
        /* Meteor.defer(function () {
         Meteor._sleepForMs(200);
         reduceFromInventory(preDoc);
         doc.items.forEach(function (item) {
         averageInventoryInsert(doc.branchId, item, doc.stockLocationId, 'enterBill', doc._id);
         });
         });*/
    }
});

EnterBills.after.remove(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        let type = {
            term: doc.billType == 'term',
            group: doc.billType == 'group'
        };
        if (type.group) {
            console.log('------------remove group enterBill------------------');
            console.log(doc);
            reduceFromInventory(doc);
            removeBillFromGroup(doc);
            let groupBill = GroupBill.findOne(doc.paymentGroupId);
            if (groupBill.invoices.length <= 0) {
                GroupBill.direct.remove(doc.paymentGroupId);
            } else {
                recalculatePaymentAfterRemoved({doc});
            }
        } else {
            console.log('------------remove enterBill -----------------------');
            console.log(doc);
            reduceFromInventory(doc);
        }
        Meteor.call('insertRemovedBill', doc);
    });
});


function averageInventoryInsert(branchId, item, stockLocationId, type, refId) {
    let id = '';
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
        id = AverageInventories.insert(inventoryObj);
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
        id = AverageInventories.insert(inventoryObj);
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
        id = AverageInventories.insert(nextInventory);
    }

    var setModifier = {$set: {purchasePrice: lastPurchasePrice}};
    setModifier.$set['qtyOnHand.' + stockLocationId] = remainQuantity;
    Item.direct.update(item.itemId, setModifier);
    return id;
}
function minusAverageInventoryInsert(branchId, item, stockLocationId, type, refId) {
    let id = '';
    let prefix = stockLocationId + '-';
    let inventory = AverageInventories.findOne({
        branchId: branchId,
        itemId: item.itemId,
        stockLocationId: stockLocationId
    }, {sort: {_id: -1}});

    if (inventory) {
        let newInventory = {
            _id: idGenerator.genWithPrefix(AverageInventories, prefix, 13),
            branchId: branchId,
            stockLocationId: stockLocationId,
            itemId: item.itemId,
            qty: item.qty,
            price: inventory.price,
            remainQty: inventory.remainQty - item.qty,
            coefficient: -1,
            type: type,
            refId: refId
        };
        id = AverageInventories.insert(newInventory);
    }
    else {
        let thisItem = Item.findOne(item.itemId);
        let newInventory = {
            _id: idGenerator.genWithPrefix(AverageInventories, prefix, 13),
            branchId: branchId,
            stockLocationId: stockLocationId,
            itemId: item.itemId,
            qty: item.qty,
            price: thisItem.purchasePrice,
            remainQty: 0 - item.qty,
            coefficient: -1,
            type: type,
            refId: refId
        };
        id = AverageInventories.insert(newInventory);
    }
}

function reduceFromInventory(enterBill) {
    //let enterBill = EnterBills.findOne(enterBillId);
    let prefix = enterBill.stockLocationId + '-';
    enterBill.items.forEach(function (item) {
        let inventory = AverageInventories.findOne({
            branchId: enterBill.branchId,
            itemId: item.itemId,
            stockLocationId: enterBill.stockLocationId
        }, {sort: {_id: -1}});

        if (inventory) {
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
                refId: enterBill._id
            };
            AverageInventories.insert(newInventory);
        }
        else {
            let thisItem = Item.findOne(item.itemId);
            let newInventory = {
                _id: idGenerator.genWithPrefix(AverageInventories, prefix, 13),
                branchId: enterBill.branchId,
                stockLocationId: enterBill.stockLocationId,
                itemId: item.itemId,
                qty: item.qty,
                price: thisItem.purchasePrice,
                remainQty: 0 - item.qty,
                coefficient: -1,
                type: 'enter-return',
                refId: enterBill._id
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
function recalculatePayment({doc, preDoc}) {
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