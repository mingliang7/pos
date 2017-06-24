import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';
import {AverageInventories} from '../../imports/api/collections/inventory.js';
// Collection
import {ConvertItems} from '../../imports/api/collections/convertItem.js';
import {Item} from '../../imports/api/collections/item.js'
import {RingPullInventories} from '../../imports/api/collections/ringPullInventory.js'
import {AccountIntegrationSetting} from '../../imports/api/collections/accountIntegrationSetting.js'
import {AccountMapping} from '../../imports/api/collections/accountMapping.js'
import {Customers} from '../../imports/api/collections/customer.js'
import StockFunction from '../../imports/api/libs/stock';
ConvertItems.before.insert(function (userId, doc) {
    let inventoryDate = StockFunction.getLastInventoryDate(doc.branchId, doc.stockLocationId);
    if (doc.convertItemDate < inventoryDate) {
        throw new Meteor.Error('Date cannot be less than last Transaction Date: "' +
            moment(inventoryDate).format('YYYY-MM-DD') + '"');
    }
    let result=StockFunction.checkStockByLocation(doc.stockLocationId,doc.items);
    if(!result.isEnoughStock){
        throw new Meteor.Error( result.message);
    }
    let todayDate = moment().format('YYYYMMDD');
    let prefix = doc.branchId + "-" + todayDate;
    doc._id = idGenerator.genWithPrefix(ConvertItems, prefix, 4);
});

ConvertItems.before.update(function (userId, doc, fieldNames, modifier, options) {
  /*  let inventoryDateOld = StockFunction.getLastInventoryDate(doc.branchId, doc.stockLocationId);
    if (modifier.$set.convertItemDate < inventoryDateOld) {
        throw new Meteor.Error('Date cannot be less than last Transaction Date: "' +
            moment(inventoryDateOld).format('YYYY-MM-DD') + '"');
    }

    modifier = modifier == null ? {} : modifier;
    modifier.$set.branchId=modifier.$set.branchId == null ? doc.branchId : modifier.$set.branchId;
    modifier.$set.stockLocationId= modifier.$set.stockLocationId == null ? doc.stockLocationId : modifier.$set.stockLocationId;
    let inventoryDate = StockFunction.getLastInventoryDate(modifier.$set.branchId, modifier.$set.stockLocationId);
    if (modifier.$set.convertItemDate < inventoryDate) {
        throw new Meteor.Error('Date cannot be less than last Transaction Date: "' +
            moment(inventoryDate).format('YYYY-MM-DD') + '"');
    }*/
    let postDoc = {itemList: modifier.$set.items};
    let stockLocationId = modifier.$set.stockLocationId;
    let data = {stockLocationId: doc.stockLocationId, items: doc.items};
    let result = StockFunction.checkStockByLocationWhenUpdate(stockLocationId, postDoc.itemList, data);
    if (!result.isEnoughStock) {
        throw new Meteor.Error(result.message);
    }
});

ConvertItems.after.insert(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        //ConvertItemManageStock(doc);
        //Account Integration
        let fromItemTotal=0;
        let toItemTotal = 0;
        doc.items.forEach(function (item) {
            let fromItemInventoryObj = AverageInventories.findOne({
                itemId: item.fromItemId,
                branchId: doc.branchId,
                stockLocationId: doc.stockLocationId
            }, {sort: {_id: -1}});
            if (fromItemInventoryObj) {
                item.fromItemPrice = fromItemInventoryObj.averagePrice;
                item.fromItemAmount = item.qty * fromItemInventoryObj.averagePrice;
                fromItemTotal += item.fromItemAmount;
            } else {
                throw new Meteor.Error("Not Found Inventory. @ConvertItem-after-insert.");
            }
            let toInventoryObj=AverageInventories.findOne({
                itemId:item.toItemId,
                branchId:item.branch
            });
            if(toInventoryObj){
                item.toItemPrice=toInventoryObj.averagePrice;
                item.toItemAmount=item.getQty*toInventoryObj.averagePrice;
                toItemTotal+=item.toItemAmount;
            }else{
                let toItem=Item.findOne({_id:toItemTotal});
                item.toItemPrice=toItem.purchasePrice;
                item.toItemAmount=toItem.purchasePrice*item.getQty;
                toItemTotal+=item.toItemAmount;
            }
        });
        let inventoryIdList = [];
        doc.items.forEach(function (item) {
            let id = StockFunction.minusAverageInventoryInsert(
                doc.branchId, item,
                doc.stockLocationId,
                'convertItem',
                doc._id,
                doc.convertItemDate
            );
            inventoryIdList.push(id);
        });
        doc.total = total;
        ConvertItems.direct.update(doc._id, {$set: {items: doc.items, total: doc.total}});

        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let transaction = [];
            let data = doc;
            data.type = "ConvertItem";

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
            data.journalDate = data.convertItemDate;
            Meteor.call('insertAccountJournal', data);
            /*Meteor.call('insertAccountJournal', data, function (er, re) {
             if (er) {
             AverageInventories.direct.remove({_id: {$in: inventoryIdList}});
             StockFunction.reduceRingPullInventory(doc);
             Meteor.call('insertRemovedCompanyConvertItem', doc);
             ConvertItems.direct.remove({_id: doc._id});
             throw new Meteor.Error(er.message);
             } else if (re == null) {
             AverageInventories.direct.remove({_id: {$in: inventoryIdList}});
             StockFunction.reduceRingPullInventory(doc);
             Meteor.call('insertRemovedCompanyConvertItem', doc);
             ConvertItems.direct.remove({_id: doc._id});
             throw new Meteor.Error("Can't Entry to Account System.");
             }
             });*/
        }
        //End Account Integration
    });
});
ConvertItems.after.update(function (userId, doc) {
    Meteor.defer(()=> {
        let preDoc = this.previous;
        Meteor._sleepForMs(200);
        returnToInventory(preDoc, 'convertItem-return',doc.convertItemDate);
        //Account Integration
        let total = 0;
        doc.items.forEach(function (item) {
            let inventoryObj = AverageInventories.findOne({
                itemId: item.itemId,
                branchId: doc.branchId,
                stockLocationId: doc.stockLocationId
            }, {sort: {_id: -1}});
            if (inventoryObj) {
                item.price = inventoryObj.averagePrice;
                item.amount = item.qty * inventoryObj.averagePrice;
                total += item.amount;
            } else {
                throw new Meteor.Error("Not Found Inventory. @ConvertItem-after-insert.");
            }
        });
        ConvertItemManageStock(doc);
        doc.total = total;
        ConvertItems.direct.update(doc._id, {$set: {items: doc.items, total: doc.total}});

        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let transaction = [];
            let data = doc;
            data.type = "ConvertItem";

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
            data.journalDate = data.convertItemDate;
            Meteor.call('updateAccountJournal', data);
        }
        //End Account Integration
    })
});

ConvertItems.after.remove(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        returnToInventory(doc, 'convertItem-return',doc.convertItemDate);
        //Account Integration
        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let data = {_id: doc._id, type: 'ConvertItem'};
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

function ConvertItemManageStock(convertItem) {
    //---Open Inventory type block "Average Inventory"---
    let totalCost = 0;
    // let convertItem = Invoices.findOne(convertItemId);
    let prefix = convertItem.stockLocationId + "-";
    let newItems = [];
    convertItem.items.forEach(function (item) {
        StockFunction.minusAverageInventoryInsert(
            convertItem.branchId,
            item,
            convertItem.stockLocationId,
            'convertItem',
            convertItem._id,
            convertItem.convertItemDate
        );
        //---insert to Ring Pull Stock---
        let ringPullInventory = RingPullInventories.findOne({
            branchId: convertItem.branchId,
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
                branchId: convertItem.branchId,
                qty: item.qty
            })
        }

    });
    //--- End Inventory type block "Average Inventory"---


}
//update inventory
function returnToInventory(convertItem, type,inventoryDate) {
    //---Open Inventory type block "Average Inventory"---
    // let convertItem = Invoices.findOne(convertItemId);
    convertItem.items.forEach(function (item) {
        StockFunction.averageInventoryInsert(
            convertItem.branchId,
            item,
            convertItem.stockLocationId,
            type,
            convertItem._id,
            inventoryDate
        );
        //---Reduce from Ring Pull Stock---
        let ringPullInventory = RingPullInventories.findOne({
            branchId: convertItem.branchId,
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
                branchId: convertItem.branchId,
                qty: 0 - item.qty
            })
        }
    });
    //--- End Inventory type block "Average Inventory"---
}

Meteor.methods({
    correctAccountConvertItem(){
        if (!Meteor.userId()) {
            throw new Meteor.Error("not-authorized");
        }
        let i=1;

        let convertItems=ConvertItems.find({});
        convertItems.forEach(function (doc) {
            console.log(i);
            i++;
            let setting = AccountIntegrationSetting.findOne();
            if (setting && setting.integrate) {
                let transaction = [];
                let data = doc;
                data.type = "ConvertItem";

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
                data.journalDate = data.convertItemDate;
                Meteor.call('insertAccountJournal', data);
                /*Meteor.call('insertAccountJournal', data, function (er, re) {
                 if (er) {
                 AverageInventories.direct.remove({_id: {$in: inventoryIdList}});
                 StockFunction.reduceRingPullInventory(doc);
                 Meteor.call('insertRemovedCompanyConvertItem', doc);
                 ConvertItems.direct.remove({_id: doc._id});
                 throw new Meteor.Error(er.message);
                 } else if (re == null) {
                 AverageInventories.direct.remove({_id: {$in: inventoryIdList}});
                 StockFunction.reduceRingPullInventory(doc);
                 Meteor.call('insertRemovedCompanyConvertItem', doc);
                 ConvertItems.direct.remove({_id: doc._id});
                 throw new Meteor.Error("Can't Entry to Account System.");
                 }
                 });*/
            }
            //End Account Integration
        });
    }
})