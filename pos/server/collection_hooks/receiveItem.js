import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {ReceiveItems} from '../../imports/api/collections/receiveItem.js';
import {AverageInventories} from '../../imports/api/collections/inventory.js';
import {Item} from '../../imports/api/collections/item.js';
import {PrepaidOrders} from '../../imports/api/collections/prepaidOrder';
import {LendingStocks} from '../../imports/api/collections/lendingStock.js';
import {CompanyExchangeRingPulls} from '../../imports/api/collections/companyExchangeRingPull.js';
import {ExchangeGratis} from '../../imports/api/collections/exchangeGratis.js';
//import state
import {receiveItemState} from '../../common/globalState/receiveItem';
import {GroupBill} from '../../imports/api/collections/groupBill.js'
ReceiveItems.before.insert(function (userId, doc) {

    let todayDate = moment().format('YYYYMMDD');
    let prefix = doc.branchId + "-" + todayDate;
    let tmpBillId = doc._id;
    doc._id = idGenerator.genWithPrefix(ReceiveItems, prefix, 4);
});

ReceiveItems.after.insert(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        if (doc.prepaidOrderId) {
            reducePrepaidOrder(doc);
        } else if(doc.lendingStockId){
            reduceLendingStock(doc);
        }else if(doc.exchangeGratisId){
            reduceExchangeGratis(doc);
        }else if(doc.companyExchangeRingPullId){
            reduceCompanyExchangeRingPull(doc);
        }else{
            throw Meteor.Error('Require Receive Item type');
        }
        doc.items.forEach(function (item) {
            averageInventoryInsert(doc.branchId, item, doc.stockLocationId, 'receiveItem', doc._id);
        });
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
            } else {
                recalculatePaymentAfterRemoved({doc});
            }
        } else if (type.term) {
            reduceFromInventory(doc);
            Meteor.call('insertRemovedBill', doc);
        }

    });
});

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

function reducePrepaidOrder(doc) {
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
    } else {
        PrepaidOrders.direct.update(prepaidOrder._id, {$set: {status: 'active'}});
    }
}

function increasePrepaidOrder(preDoc) {
    let updatedFlag;
    preDoc.items.forEach(function (item) {
        PrepaidOrders.direct.update(
            {_id: preDoc.prepaidOrderId, 'items.itemId': item.itemId},
            {$inc: {'items.$.remainQty': item.qty, sumRemainQty: item.qty}}
        ); //re sum remain qty
    });
}

function reduceLendingStock(doc) {
    doc.items.forEach(function (item) {
        LendingStocks.direct.update(
            {
                _id: doc.lendingStockId,
                "items.itemId": item.itemId
            },
            {
                $inc: {
                    sumRemainQty: -item.qty,
                    "items.$.remainQty": -item.qty
                }
            });
    });
    let lendingStock = LendingStocks.findOne(doc.lendingStockId);
    if (lendingStock.sumRemainQty == 0) {
        LendingStocks.direct.update(lendingStock._id, {$set: {status: 'closed'}});
    } else {
        LendingStocks.direct.update(lendingStock._id, {$set: {status: 'active'}});
    }
}

function increaseLendingStock(preDoc) {
    //let updatedFlag;
    preDoc.items.forEach(function (item) {
        LendingStocks.direct.update(
            {_id: preDoc.lendingStockId, 'items.itemId': item.itemId},
            {$inc: {'items.$.remainQty': item.qty, sumRemainQty: item.qty}}
        ); //re sum remain qty
    });
}


function reduceCompanyExchangeRingPull(doc) {
    doc.items.forEach(function (item) {
        CompanyExchangeRingPulls.direct.update(
            {
                _id: doc.companyExchangeRingPullId,
                "items.itemId": item.itemId
            },
            {
                $inc: {
                    sumRemainQty: -item.qty,
                    "items.$.remainQty": -item.qty
                }
            });
    });
    let companyExchangeRingPull = CompanyExchangeRingPulls.findOne(doc.companyExchangeRingPullId);
    if (companyExchangeRingPull.sumRemainQty == 0) {
        CompanyExchangeRingPulls.direct.update(companyExchangeRingPull._id, {$set: {status: 'closed'}});
    } else {
        CompanyExchangeRingPulls.direct.update(companyExchangeRingPull._id, {$set: {status: 'active'}});
    }
}

function increaseCompanyExchangeRingPull(preDoc) {
    //let updatedFlag;
    preDoc.items.forEach(function (item) {
        CompanyExchangeRingPulls.direct.update(
            {_id: preDoc.companyExchangeRingPullId, 'items.itemId': item.itemId},
            {$inc: {'items.$.remainQty': item.qty, sumRemainQty: item.qty}}
        ); //re sum remain qty
    });
}



function reduceExchangeGratis(doc) {
    doc.items.forEach(function (item) {
        ExchangeGratis.direct.update(
            {
                _id: doc.exchangeGratisId,
                "items.itemId": item.itemId
            },
            {
                $inc: {
                    sumRemainQty: -item.qty,
                    "items.$.remainQty": -item.qty
                }
            });
    });
    let exchangeGratis = ExchangeGratis.findOne(doc.exchangeGratisId);
    if (exchangeGratis.sumRemainQty == 0) {
        ExchangeGratis.direct.update(exchangeGratis._id, {$set: {status: 'closed'}});
    } else {
        ExchangeGratis.direct.update(exchangeGratis._id, {$set: {status: 'active'}});
    }
}

function increaseExchangeGratis(preDoc) {
    //let updatedFlag;
    preDoc.items.forEach(function (item) {
        ExchangeGratis.direct.update(
            {_id: preDoc.exchangeGratisId, 'items.itemId': item.itemId},
            {$inc: {'items.$.remainQty': item.qty, sumRemainQty: item.qty}}
        ); //re sum remain qty
    });
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