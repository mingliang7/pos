import  {AverageInventories} from '../collections/inventory'
import  {Item} from '../collections/item'
import {RingPullInventories} from '../collections/ringPullInventory.js'
import {GratisInventories} from '../collections/gratisInventory'

export  default class StockFunction {
    static averageInventoryInsert(branchId, item, stockLocationId, type, refId) {
        let id = '';
        //let lastPurchasePrice = 0;
        let remainQuantity = 0;
        let prefix = stockLocationId + '-';
        let inventory = AverageInventories.findOne({
            branchId: branchId,
            itemId: item.itemId,
            stockLocationId: stockLocationId
        }, {sort: {createdAt: -1}});
        console.log(inventory);
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
            //lastPurchasePrice = item.price;
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
            //lastPurchasePrice = item.price;
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
            //lastPurchasePrice = price;
            remainQuantity = nextInventory.remainQty;
            id = AverageInventories.insert(nextInventory);
        }

        var setModifier = {$set: {purchasePrice: item.price}};
        setModifier.$set['qtyOnHand.' + stockLocationId] = remainQuantity;
        Item.direct.update(item.itemId, setModifier);
        return id;
    }

    static minusAverageInventoryInsert(branchId, item, stockLocationId, type, refId) {
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
        return id;
    }

    static reduceRingPullInventory(companyExchangeRingPull) {
        companyExchangeRingPull.items.forEach(function (item) {
            //---Reduce from Ring Pull Stock---
            let ringPullInventory = RingPullInventories.findOne({
                branchId: companyExchangeRingPull.branchId,
                itemId: item.itemId,
            });
            if (ringPullInventory) {
                RingPullInventories.update(
                    ringPullInventory._id,
                    {
                        $inc: {qty: -item.qty}
                    });
            } else {
                RingPullInventories.insert({
                    itemId: item.itemId,
                    branchId: companyExchangeRingPull.branchId,
                    qty: 0 - item.qty
                })
            }
        });
    }

    static increaseRingPullInventory(companyExchangeRingPull) {
        //---insert to Ring Pull Stock---
        companyExchangeRingPull.items.forEach(function (item) {
            let ringPullInventory = RingPullInventories.findOne({
                branchId: companyExchangeRingPull.branchId,
                itemId: item.itemId,
            });
            if (ringPullInventory) {
                RingPullInventories.update(
                    ringPullInventory._id,
                    {
                        $inc: {qty: item.qty}
                    });
            } else {
                RingPullInventories.insert({
                    itemId: item.itemId,
                    branchId: companyExchangeRingPull.branchId,
                    qty: item.qty
                })
            }
        });
    }

    static increaseGratisInventory(item, branchId, stockLocationId) {
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

    static reduceGratisInventory(item, branchId, stockLocationId) {
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
}