import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';
import {AccountIntegrationSetting} from '../../imports/api/collections/accountIntegrationSetting.js';
// Collection
import {PrepaidOrders} from '../../imports/api/collections/prepaidOrder.js';
import {Item} from '../../imports/api/collections/item.js';

PrepaidOrders.before.insert(function (userId, doc) {
    let prefix = doc.vendorId;
    doc._id = idGenerator.genWithPrefix(PrepaidOrders, prefix, 6);
});


PrepaidOrders.after.insert(function () {

    //Account Integration
    let setting = AccountIntegrationSetting.findOne();
    if (setting && setting.integrate) {
        let transaction = [];
        let data = doc;
        data.type = "PrepaidOrder";
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

PrepaidOrders.after.update(function () {
    Meteor.defer(function () {
        //Account Integration
        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let transaction = [];
            let data = doc;
            data.type = "PrepaidOrder";
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

PrepaidOrders.after.remove(function () {
    //Account Integration
    let setting = AccountIntegrationSetting.findOne();
    if (setting && setting.integrate) {
        let data = {_id: doc._id, type: 'PrepaidOrder'};
        Meteor.call('removeAccountJournal', data)
    }
    //End Account Integration
});

