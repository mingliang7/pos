import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {Order} from '../../imports/api/collections/order.js';
import {AccountIntegrationSetting} from '../../imports/api/collections/accountIntegrationSetting.js'
import {Item} from '../../imports/api/collections/item.js'
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
        Meteor.defer(function () {
            Meteor._sleepForMs(200);
            lendingStockManageStock(doc);
            //Account Integration
            let setting = AccountIntegrationSetting.findOne();
            if (setting && setting.integrate) {
                let transaction = [];
                let data = doc;
                data.type = "SaleOrder";
                data.items.forEach(function (item) {
                    let itemDoc = Item.findOne(item.itemId);
                    if (itemDoc.accountMapping.accountReceivable && itemDoc.accountMapping.inventoryAsset) {
                        transaction.push({
                            account: itemDoc.accountMapping.accountReceivable,
                            dr: item.amount,
                            cr: 0,
                            drcr: item.amount
                        }, {
                            account: itemDoc.accountMapping.inventoryAsset,
                            dr: 0,
                            cr: item.amount,
                            drcr: -item.amount
                        })
                    }
                });
                data.transaction = transaction;
                Meteor.call('insertAccountJournal', data);
            }
            //End Account Integration
        });
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
            data.items.forEach(function (item) {
                let itemDoc = Item.findOne(item.itemId);
                if (itemDoc.accountMapping.accountReceivable && itemDoc.accountMapping.inventoryAsset) {
                    transaction.push({
                        account: itemDoc.accountMapping.accountReceivable,
                        dr: item.amount,
                        cr: 0,
                        drcr: item.amount
                    }, {
                        account: itemDoc.accountMapping.inventoryAsset,
                        dr: 0,
                        cr: item.amount,
                        drcr: -item.amount
                    })
                }
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