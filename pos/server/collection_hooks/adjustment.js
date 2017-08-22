import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';
import {AverageInventories} from '../../imports/api/collections/inventory.js';
// Collection
import {Adjustments} from '../../imports/api/collections/adjustment.js';
import {Item} from '../../imports/api/collections/item.js'
import {RingPullInventories} from '../../imports/api/collections/ringPullInventory.js'
import {AccountIntegrationSetting} from '../../imports/api/collections/accountIntegrationSetting.js'
import {AccountMapping} from '../../imports/api/collections/accountMapping.js'
import {Customers} from '../../imports/api/collections/customer.js'
import StockFunction from '../../imports/api/libs/stock';
Adjustments.before.insert(function (userId, doc) {
    let inventoryDate = StockFunction.getLastInventoryDate(doc.branchId, doc.stockLocationId);
    if (doc.adjustmentDate < inventoryDate) {
        throw new Meteor.Error('Date cannot be less than last Transaction Date: "' +
            moment(inventoryDate).format('YYYY-MM-DD') + '"');
    }
    let result = StockFunction.checkStockByLocationForAdjustment(doc.stockLocationId, doc.items);
    if (!result.isEnoughStock) {
        throw new Meteor.Error(result.message);
    }
    let todayDate = moment().format('YYYYMMDD');
    let prefix = doc.branchId + "-" + todayDate;
    doc._id = idGenerator.genWithPrefix(Adjustments, prefix, 4);
});

/*Adjustments.before.update(function (userId, doc, fieldNames, modifier, options) {
 let inventoryDateOld = StockFunction.getLastInventoryDate(doc.branchId, doc.stockLocationId);
 if (modifier.$set.adjustmentDate < inventoryDateOld) {
 throw new Meteor.Error('Date cannot be less than last Transaction Date: "' +
 moment(inventoryDateOld).format('YYYY-MM-DD') + '"');
 }

 modifier = modifier == null ? {} : modifier;
 modifier.$set.branchId = modifier.$set.branchId == null ? doc.branchId : modifier.$set.branchId;
 modifier.$set.stockLocationId = modifier.$set.stockLocationId == null ? doc.stockLocationId : modifier.$set.stockLocationId;
 let inventoryDate = StockFunction.getLastInventoryDate(modifier.$set.branchId, modifier.$set.stockLocationId);
 if (modifier.$set.adjustmentDate < inventoryDate) {
 throw new Meteor.Error('Date cannot be less than last Transaction Date: "' +
 moment(inventoryDate).format('YYYY-MM-DD') + '"');
 }
 let postDoc = {itemList: modifier.$set.items};
 let stockLocationId = modifier.$set.stockLocationId;
 let data = {stockLocationId: doc.stockLocationId, items: doc.items};
 let result = StockFunction.checkStockByLocationWhenUpdate(stockLocationId, postDoc.itemList, data);
 if (!result.isEnoughStock) {
 throw new Meteor.Error(result.message);
 }
 });*/

Adjustments.after.insert(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        //AdjustmentManageStock(doc);
        let total = 0;
        doc.items.forEach(function (item) {
            if (item.qty < 0) {
                let averagePriceForAdjustment = StockFunction.minusAverageInventoryInsertAdjustment(
                    doc.branchId,
                    item,
                    doc.stockLocationId,
                    'adjustment-down',
                    doc._id,
                    doc.adjustmentDate
                );
                item.price = averagePriceForAdjustment;
                item.amount = math.round(item.qty * averagePriceForAdjustment, 6);
                total += item.amount;
            }
            else {
                let averagePriceForAdjustment = StockFunction.averageInventoryInsertAdjustment(
                    doc.branchId,
                    item,
                    doc.stockLocationId,
                    'adjustment-up',
                    doc._id,
                    doc.adjustmentDate
                );
                item.price = averagePriceForAdjustment;
                item.amount = math.round(item.qty * averagePriceForAdjustment, 6);
                total += item.amount;
            }

        });
        doc.total = total;
        Adjustments.direct.update(doc._id, {$set: {items: doc.items, total: doc.total}});

        let setting = AccountIntegrationSetting.findOne();
        if (doc.total != 0) {
            if (setting && setting.integrate) {
                let transaction = [];
                let data = doc;
                data.type = "Adjustment";
                data.des = data.des == "" || data.des == null ? "កែតម្រូវស្តុក " : data.des;
                let increaseInventoryAccount = AccountMapping.findOne({name: 'Inventory Increase'});
                let decreaseInventoryAccount = AccountMapping.findOne({name: 'Inventory Decrease'});
                let inventoryChartAccount = AccountMapping.findOne({name: 'Inventory'});

                if (doc.total < 0) {
                    transaction.push({
                        account: decreaseInventoryAccount.account,
                        dr: -doc.total,
                        cr: 0,
                        drcr: -doc.total
                    }, {
                        account: inventoryChartAccount.account,
                        dr: 0,
                        cr: -doc.total,
                        drcr: doc.total
                    });
                } else if (doc.total > 0) {
                    transaction.push({
                        account: inventoryChartAccount.account,
                        dr: doc.total,
                        cr: 0,
                        drcr: doc.total
                    }, {
                        account: increaseInventoryAccount.account,
                        dr: 0,
                        cr: doc.total,
                        drcr: -doc.total
                    });
                }

                data.total = Math.abs(data.total);
                data.transaction = transaction;
                data.journalDate = data.adjustmentDate;
                Meteor.call('insertAccountJournal', data);
            }
        }
        //End Account Integration
    });
});
/*Adjustments.after.update(function (userId, doc) {
 Meteor.defer(() => {
 let preDoc = this.previous;
 Meteor._sleepForMs(200);
 returnToInventory(preDoc, 'adjustment-return', doc.adjustmentDate);
 //Account Integration
 let total = 0;
 doc.items.forEach(function (item) {
 let inventoryObj = AverageInventories.findOne({
 itemId: item.itemId,
 branchId: doc.branchId,
 stockLocationId: doc.stockLocationId
 }, {sort: {createdAt: -1}});
 if (inventoryObj) {
 item.price = inventoryObj.averagePrice;
 item.amount = math.round(item.qty * inventoryObj.averagePrice, 6);
 total += item.amount;
 } else {
 throw new Meteor.Error("Not Found Inventory. @Adjustment-after-insert.");
 }
 });
 AdjustmentManageStock(doc);
 doc.total = total;
 Adjustments.direct.update(doc._id, {$set: {items: doc.items, total: doc.total}});

 let setting = AccountIntegrationSetting.findOne();
 if (setting && setting.integrate) {
 let transaction = [];
 let data = doc;
 data.type = "Adjustment";

 let customerDoc = Customers.findOne({_id: doc.customerId});
 if (customerDoc) {
 data.name = customerDoc.name;
 data.des = data.des == "" || data.des == null ? ("ប្តូរក្រវិលពីអតិថិជនៈ " + data.name) : data.des;
 }

 let ringPullChartAccount = AccountMapping.findOne({name: 'Ring Pull'});
 let inventoryChartAccount = AccountMapping.findOne({name: 'Inventory'});
 transaction.push({
 account: ringPullChartAccount.account,
 dr: data.total,
 cr: 0,
 drcr: data.total
 }, {
 account: inventoryChartAccount.account,
 dr: 0,
 cr: data.total,
 drcr: -data.total
 });
 data.transaction = transaction;
 data.journalDate = data.adjustmentDate;
 Meteor.call('updateAccountJournal', data);
 }
 //End Account Integration
 })
 });*/

Adjustments.after.remove(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        doc.items.forEach(function (item) {
            if (item.qty < 0) {
                item.qty = Math.abs(item.qty);
                let averagePriceForAdjustment = StockFunction.averageInventoryInsert(
                    doc.branchId,
                    item,
                    doc.stockLocationId,
                    'adjustment-down-return',
                    doc._id,
                    doc.adjustmentDate
                );
            }
            else {
                let averagePriceForAdjustment = StockFunction.minusAverageInventoryInsert(
                    doc.branchId,
                    item,
                    doc.stockLocationId,
                    'adjustment-up-return',
                    doc._id,
                    doc.adjustmentDate
                );
            }
        });
        //Account Integration
        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let data = {_id: doc._id, type: 'Adjustment'};
            Meteor.call('removeAccountJournal', data)
        }
        //End Account Integration
    });
});


// after.insert: reduceForInventory and Add to RingPull Inventory

/*
 after.update:
 returnToInventory and reduceFrom RingPull Inventory (preDoc)
 reduceForInventory and Add to RingPull Inventory (doc)
 */

//after.remove: returnToInventory and reduceFrom RingPull Inventory

function AdjustmentManageStock(adjustment) {
    //---Open Inventory type block "Average Inventory"---
    let totalCost = 0;
    // let adjustment = Invoices.findOne(adjustmentId);
    let prefix = adjustment.stockLocationId + "-";
    let newItems = [];
    adjustment.items.forEach(function (item) {
        StockFunction.minusAverageInventoryInsert(
            adjustment.branchId,
            item,
            adjustment.stockLocationId,
            'adjustment',
            adjustment._id,
            adjustment.adjustmentDate
        );
        //---insert to Ring Pull Stock---
        let ringPullInventory = RingPullInventories.findOne({
            branchId: adjustment.branchId,
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
                branchId: adjustment.branchId,
                qty: item.qty
            })
        }

    });
    //--- End Inventory type block "Average Inventory"---


}

//update inventory
function returnToInventory(adjustment, type, inventoryDate) {
    //---Open Inventory type block "Average Inventory"---
    // let adjustment = Invoices.findOne(adjustmentId);
    adjustment.items.forEach(function (item) {
        StockFunction.averageInventoryInsert(
            adjustment.branchId,
            item,
            adjustment.stockLocationId,
            type,
            adjustment._id,
            inventoryDate
        );
        //---Reduce from Ring Pull Stock---
        let ringPullInventory = RingPullInventories.findOne({
            branchId: adjustment.branchId,
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
                branchId: adjustment.branchId,
                qty: math.round(0 - item.qty, 6)
            })
        }
    });
    //--- End Inventory type block "Average Inventory"---
}

Meteor.methods({
    correctAccountAdjustment(){
        if (!Meteor.userId()) {
            throw new Meteor.Error("not-authorized");
        }
        let i = 1;

        let adjustments = Adjustments.find({});
        adjustments.forEach(function (doc) {
            console.log(i);
            i++;
            let setting = AccountIntegrationSetting.findOne();
            if (setting && setting.integrate) {
                let transaction = [];
                let data = doc;
                data.type = "Adjustment";

                let customerDoc = Customers.findOne({_id: doc.customerId});
                if (customerDoc) {
                    data.name = customerDoc.name;
                    data.des = data.des == "" || data.des == null ? ("ប្តូរក្រវិលពីអតិថិជនៈ " + data.name) : data.des;
                }

                let ringPullChartAccount = AccountMapping.findOne({name: 'Ring Pull'});
                let inventoryChartAccount = AccountMapping.findOne({name: 'Inventory'});
                transaction.push({
                    account: ringPullChartAccount.account,
                    dr: data.total,
                    cr: 0,
                    drcr: data.total
                }, {
                    account: inventoryChartAccount.account,
                    dr: 0,
                    cr: data.total,
                    drcr: -data.total
                });
                data.transaction = transaction;
                data.journalDate = data.adjustmentDate;
                Meteor.call('insertAccountJournal', data);
                /*Meteor.call('insertAccountJournal', data, function (er, re) {
                 if (er) {
                 AverageInventories.direct.remove({_id: {$in: inventoryIdList}});
                 StockFunction.reduceRingPullInventory(doc);
                 Meteor.call('insertRemovedCompanyAdjustment', doc);
                 Adjustments.direct.remove({_id: doc._id});
                 throw new Meteor.Error(er.message);
                 } else if (re == null) {
                 AverageInventories.direct.remove({_id: {$in: inventoryIdList}});
                 StockFunction.reduceRingPullInventory(doc);
                 Meteor.call('insertRemovedCompanyAdjustment', doc);
                 Adjustments.direct.remove({_id: doc._id});
                 throw new Meteor.Error("Can't Entry to Account System.");
                 }
                 });*/
            }
            //End Account Integration
        });
    }
})