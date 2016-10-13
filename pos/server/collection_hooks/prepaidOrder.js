import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';
import {AccountIntegrationSetting} from '../../imports/api/collections/accountIntegrationSetting.js';
// Collection
import {PrepaidOrders} from '../../imports/api/collections/prepaidOrder.js';
import {Item} from '../../imports/api/collections/item.js';
import {AccountMapping} from '../../imports/api/collections/accountMapping.js';

PrepaidOrders.before.insert(function (userId, doc) {
    let prefix = doc.vendorId;
    doc._id = idGenerator.genWithPrefix(PrepaidOrders, prefix, 6);
});


PrepaidOrders.after.insert(function (userId,doc) {

    //Account Integration
    let setting = AccountIntegrationSetting.findOne();
    if (setting && setting.integrate) {
        let transaction = [];
        let data = doc;
        data.type = "PrepaidOrder";
        let oweInventoryChartAccount = AccountMapping.findOne({name: 'Inventory Supplier Owing'});
        let cashChartAccount = AccountMapping.findOne({name: 'Cash on Hand'});
        transaction.push({
            account: oweInventoryChartAccount.account,
            dr: doc.total,
            cr: 0,
            drcr: doc.total
        }, {
            account: cashChartAccount.account,
            dr: 0,
            cr: doc.total,
            drcr: -doc.total
        });
        data.transaction = transaction;
        Meteor.call('insertAccountJournal', data);
    }
    //End Account Integration
});

PrepaidOrders.after.update(function (userId,doc) {
    Meteor.defer(function () {
        //Account Integration
        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let transaction = [];
            let data = doc;
            data.type = "PrepaidOrder";
            let oweInventoryChartAccount = AccountMapping.findOne({name: 'Inventory Supplier Owing'});
            let cashChartAccount = AccountMapping.findOne({name: 'Cash on Hand'});
            transaction.push({
                account: oweInventoryChartAccount.account,
                dr: doc.total,
                cr: 0,
                drcr: doc.total
            }, {
                account: cashChartAccount.account,
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

PrepaidOrders.after.remove(function (userId,doc) {
    //Account Integration
    let setting = AccountIntegrationSetting.findOne();
    if (setting && setting.integrate) {
        let data = {_id: doc._id, type: 'PrepaidOrder'};
        Meteor.call('removeAccountJournal', data)
    }
    //End Account Integration
});

