import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {EnterBills} from '../../imports/api/collections/enterBill.js';
import {AverageInventories} from '../../imports/api/collections/inventory.js';
import {Item} from '../../imports/api/collections/item.js';
import {PrepaidOrders} from '../../imports/api/collections/prepaidOrder';
//import state
import {billState} from '../../common/globalState/enterBill';

EnterBills.before.insert(function (userId, doc) {
    if (doc.total == 0) {
        doc.status = 'closed';
        doc.billType = 'prepaidOrder'
    } else if (doc.termId) {
        doc.status = 'active';
        doc.billType = 'term'
    } else {
        doc.status = 'active';
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
        if (doc.status == "active") {
        } else {
            doc.items.forEach(function (item) {
                averageInventoryInsert(doc.branchId, item, doc.stockLocationId, 'enterBill', doc._id);
            });
        }
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
        }
    });
});

EnterBills.after.update(function (userId, doc, fieldNames, modifier, options) {
    let preDoc = this.previous;
    if (doc.status == "active") {
    } else {
        Meteor.defer(function () {
            Meteor._sleepForMs(200);
            reduceFromInventory(preDoc);
            doc.items.forEach(function (item) {
                averageInventoryInsert(doc.branchId, item, doc.stockLocationId, 'enterBill', doc._id);
            });

        });
    }
});

EnterBills.after.remove(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        reduceFromInventory(doc);
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
        nextInventory.price = math.round(price);
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
function reduceFromInventory(enterBill) {
    //let enterBill = EnterBills.findOne(enterBillId);
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
            refId: enterBill._id
        };
        AverageInventories.insert(newInventory);
    });

}
/*
 function payBillInsert(doc){
 let payObj={};
 payObj._id=idGenerator.genWithPrefix()
 }*/
