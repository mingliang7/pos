import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {PurchaseOrder} from '../../imports/api/collections/purchaseOrder.js';
import {AccountIntegrationSetting} from '../../imports/api/collections/accountIntegrationSetting.js';
import {AccountMapping} from '../../imports/api/collections/accountMapping.js';

PurchaseOrder.before.insert(function (userId, doc) {
    let prefix = doc.vendorId;
    doc._id = idGenerator.genWithPrefix(PurchaseOrder, prefix, 6);
});

PurchaseOrder.after.insert(function (userId, doc) {
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

