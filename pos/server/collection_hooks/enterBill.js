import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {EnterBills} from '../../imports/api/collections/enterBill.js';
import {AverageInventories} from '../../imports/api/collections/inventory.js';

EnterBills.before.insert(function (userId, doc) {
    let todayDate = moment().format('YYYYMMDD');
    let prefix = doc.branchId + "-" + todayDate;
    doc._id = idGenerator.genWithPrefix(EnterBills, prefix, 4);
});

EnterBills.after.insert(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        if (doc.status == "active") {
        } else {
            doc.items.forEach(function (item) {
                averageInventoryInsert(doc.branchId, item, doc.stockLocationId);
            });
        }
    })
});


EnterBills.after.update(function (userId, doc, fieldNames, modifier, options) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        if (doc.status == "active") {
        } else {
            doc.items.forEach(function (item) {
                averageInventoryInsert(doc.branchId, item, doc.stockLocationId);
            });
        }
    });
});


function averageInventoryInsert(branchId, item, stockLocationId) {
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

        /* var inventorySet = {};
         inventorySet.qty = item.qty + inventory.qty;
         inventorySet.remainQty = inventory.remainQty + item.qty;
         AverageInventories.update(inventory._id, {$set: inventorySet});*/
    }
    else {
        let totalQty = inventory.remainQty + item.qty;
        let price = ((inventory.remainQty * inventory.price) + (item.qty * item.price)) / totalQty;
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
/*
 function payBillInsert(doc){
 let payObj={};
 payObj._id=idGenerator.genWithPrefix()
 }*/
