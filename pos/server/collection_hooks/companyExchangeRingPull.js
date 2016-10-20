import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';
import {AverageInventories} from '../../imports/api/collections/inventory.js';

// Collection
import {CompanyExchangeRingPulls} from '../../imports/api/collections/companyExchangeRingPull.js';
import {Item} from '../../imports/api/collections/item.js'
import {RingPullInventories} from '../../imports/api/collections/ringPullInventory.js'
import {AccountIntegrationSetting} from '../../imports/api/collections/accountIntegrationSetting.js'
import {AccountMapping} from '../../imports/api/collections/accountMapping.js'
import StockFunction from '../../imports/api/libs/stock';

CompanyExchangeRingPulls.before.insert(function (userId, doc) {
    let todayDate = moment().format('YYYYMMDD');
    let prefix = doc.branchId + "-" + todayDate;
    doc._id = idGenerator.genWithPrefix(CompanyExchangeRingPulls, prefix, 4);
});
CompanyExchangeRingPulls.after.insert(function (userId, doc) {
    Meteor.defer(function () {
        StockFunction.reduceRingPullInventory(doc);
        //Account Integration

        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let transaction = [];
            let data = doc;
            data.type = "CompanyExchangeRingPull";
            let oweInventoryRingPullChartAccount = AccountMapping.findOne({name: 'Inventory Ring Pull Owing'});
            let ringPullChartAccount = AccountMapping.findOne({name: 'Ring Pull'});
            transaction.push({
                account: oweInventoryRingPullChartAccount.account,
                dr: doc.total,
                cr: 0,
                drcr: doc.total
            }, {
                account: ringPullChartAccount.account,
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
CompanyExchangeRingPulls.after.update(function (userId, doc) {
    let preDoc = this.previous;
    Meteor.defer(function () {
        StockFunction.increaseRingPullInventory(preDoc);
        StockFunction.reduceRingPullInventory(doc);
        //Account Integration
        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let transaction = [];
            let data = doc;
            data.type = "CompanyExchangeRingPull";
            let oweInventoryRingPullChartAccount = AccountMapping.findOne({name: 'Inventory Ring Pull Owing'});
            let ringPullChartAccount = AccountMapping.findOne({name: 'Ring Pull'});
            transaction.push({
                account: oweInventoryRingPullChartAccount.account,
                dr: doc.total,
                cr: 0,
                drcr: doc.total
            }, {
                account: ringPullChartAccount.account,
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

CompanyExchangeRingPulls.after.remove(function (userId, doc) {
    Meteor.defer(function () {
        StockFunction.increaseRingPullInventory(doc);
        //Account Integration
        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let data = {_id: doc._id, type: 'CompanyExchangeRingPull'};
            Meteor.call('removeAccountJournal', data)
        }
        //End Account Integration
    });
});


/*
 insert: reduce from RingPull Inventory(doc)
 update: increase ring pull inventory (predoc)
 reduce from ring pull inventory(doc)
 remove: increase ring pull inventory(doc)
 */





