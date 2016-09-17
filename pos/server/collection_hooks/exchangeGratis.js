import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {ExchangeGratis} from '../../imports/api/collections/exchangeGratis.js';
import {AverageInventories} from '../../imports/api/collections/inventory.js';
import {Item} from '../../imports/api/collections/item.js';

ExchangeGratis.before.insert(function (userId, doc) {
    let prefix = doc.vendorId;
    doc._id = idGenerator.genWithPrefix(ExchangeGratis, prefix, 6);
});


ExchangeGratis.after.insert(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        reduceFromInventory(doc,'exchangeGratis');
    });
});

ExchangeGratis.after.update(function (userId, doc) {
    let preDoc = this.previous;
    Meteor.defer(function () {
        Meteor._sleepForMs(200);


    });
});

//remove
ExchangeGratis.after.remove(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);


    });
});

/*
 Insert: reduce average inventory and increase ring pull inventory
 Update: increase average inventory and reduce from ring pull inventory
 reduce from average inventory and increase ring pull inventory
 Remove: increase average inventory and reduce from ring pull inventory
 */

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
function reduceFromInventory(receiveItem, type) {
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
                type: type,
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
                type: type,
                refId: receiveItem._id
            };
            AverageInventories.insert(newInventory);
        }

    });

}