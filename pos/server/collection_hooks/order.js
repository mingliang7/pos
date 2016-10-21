import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {Order} from '../../imports/api/collections/order.js';
import {PurchaseOrder} from '../../imports/api/collections/purchaseOrder.js';
import {AccountIntegrationSetting} from '../../imports/api/collections/accountIntegrationSetting.js'
import {Item} from '../../imports/api/collections/item.js'
import {Vendors} from '../../imports/api/collections/vendor.js'
import {AverageInventories} from '../../imports/api/collections/inventory.js'
import {AccountMapping} from '../../imports/api/collections/accountMapping.js'
Order.before.insert(function (userId, doc) {
    let prefix = doc.customerId;
    doc._id = idGenerator.genWithPrefix(Order, prefix, 6);
});


Order.after.insert(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        let sumRemainQty = 0;
        doc.items.forEach(function (item) {
            sumRemainQty += item.remainQty;
        });
        Order.direct.update(doc._id, {
            $set: {
                sumRemainQty: sumRemainQty
            }
        });

        if (doc.isPurchased) {
            //Auto Purchase Order
            let vendor = Vendors.findOne(doc.voucherId);
            let purchaseObj = {
                repId: vendor.repId,
                vendorId: doc.voucherId,
                purchaseOrderDate: new Date(),
                des: 'From Sale Order: "' + doc._id + '"',
                branchId: doc.branchId,
                total: 0,
                items: []
            };
            doc.items.forEach(function (item) {
                let inventory = AverageInventories.findOne({
                    branchId: doc.branchId,
                    itemId: item.itemId,
                });
                if (inventory) {
                    purchaseObj.items.push({
                        itemId: item.itemId,
                        price: inventory.price,
                        qty: doc.qty,
                        amount: doc.qty * inventory.price,
                    });
                    purchaseObj.total += doc.qty * inventory.price;
                } else {
                    let thisItem = Item.findOne(item.itemId);
                    purchaseObj.items.push({
                        itemId: item.itemId,
                        price: item.price,
                        qty: doc.qty,
                        amount: doc.qty * thisItem.purchasePrice,
                    });
                    purchaseObj.total += doc.qty * inventory.price;
                }
            });
            PurchaseOrder.insert(purchaseObj);

        }


        //Account Integration
        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let transaction = [];
            let data = doc;
            data.type = "SaleOrder";
            let oweInventoryChartAccount = AccountMapping.findOne({name: 'Owe Inventory Customer'});
            let cashChartAccount = AccountMapping.findOne({name: 'Cash on Hand'});
            transaction.push({
                account: cashChartAccount.account,
                dr: doc.total,
                cr: 0,
                drcr: doc.total
            }, {
                account: oweInventoryChartAccount.account,
                dr: 0,
                cr: doc.total,
                drcr: -doc.total
            });
            data.transaction = transaction;
            Meteor.call('insertAccountJournal', data);
        }
        //End Account Integration
    });
});

Order.after.update(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        let sumRemainQty = 0;
        doc.items.forEach(function (item) {
            sumRemainQty += item.remainQty;
        });
        Order.direct.update(doc._id, {
            $set: {
                sumRemainQty: sumRemainQty
            }
        });
        //Account Integration
        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let transaction = [];
            let data = doc;
            data.type = "SaleOrder";
            let oweInventoryChartAccount = AccountMapping.findOne({name: 'Owe Inventory Customer'});
            let cashChartAccount = AccountMapping.findOne({name: 'Cash on Hand'});
            transaction.push({
                account: cashChartAccount.account,
                dr: doc.total,
                cr: 0,
                drcr: doc.total
            }, {
                account: oweInventoryChartAccount.account,
                dr: 0,
                cr: doc.total,
                drcr: -doc.total
            });
            data.transaction = transaction;
            Meteor.call('updateAccountJournal', data);
        }
        //End Account Integration
    });
});

Order.after.remove(function (userId, doc) {
    Meteor.defer(function () {
        //Account Integration
        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let data = {_id: doc._id, type: 'SaleOrder'};
            Meteor.call('removeAccountJournal', data)
        }
        //End Account Integration
    })

})