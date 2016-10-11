import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';
import {PayBills} from '../../imports/api/collections/payBill';
import {Invoices} from '../../imports/api/collections/invoice';
import {Item} from '../../imports/api/collections/item.js';
import {AccountIntegrationSetting} from '../../imports/api/collections/accountIntegrationSetting.js';

PayBills.before.insert(function (userId, doc) {
    doc._id = idGenerator.genWithPrefix(PayBills, `${doc.branchId}-`, 9);
});

PayBills.after.remove(function (userId, doc) {
    Meteor.call('insertRemovedPayBill', doc);
});

PayBills.after.insert(function (userId, doc) {
    //Account Integration
    let setting = AccountIntegrationSetting.findOne();
    if (setting && setting.integrate) {
        let transaction = [];
        let data = doc;
        data.type = "Invoice";
        let invoice = Invoices.findOne(doc.invoiceId);
        let firstItem = invoice.items[0];
        let itemDoc = Item.findOne(firstItem.itemId);
        invoice.items.forEach(function (item) {
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
})

PayBills.after.update(function(userId,doc){

})