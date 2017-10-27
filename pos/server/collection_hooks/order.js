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
import {Customers} from '../../imports/api/collections/customer.js'

Order.before.insert(function (userId, doc) {
    let prefix = doc.customerId;
    doc._id = idGenerator.genWithPrefix(Order, prefix, 6);
});


Order.after.insert(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        let setting = AccountIntegrationSetting.findOne();
        let sumRemainQty = 0;
        doc.items.forEach(function (item) {
            sumRemainQty += item.remainQty;
        });
        Order.direct.update(doc._id, {
            $set: {
                sumRemainQty: sumRemainQty
            }
        });
        if (setting && setting.integrate && doc.deposit > 0) {
            let transaction = [];
            let customerDepositChartAcc = AccountMapping.findOne({name: 'Customer Deposit'});
            let cashOnHandChartAcc = AccountMapping.findOne({name: 'Cash on Hand'});
            transaction.push(
                {
                    account: cashOnHandChartAcc.account,
                    dr: doc.deposit,
                    cr: 0,
                    drcr: doc.deposit
                },
                {
                    account: customerDepositChartAcc.account,
                    dr: 0,
                    cr: doc.deposit,
                    drcr: -doc.deposit
                },
            );
            let data = doc;
            data.type = 'saleOrderDeposit';
            let des = "បង់បា្រក់ទុកមុន អតិថិជនៈ ";
            let customerDoc = Customers.findOne({_id: doc.customerId});
            if (customerDoc) {
                data.name = customerDoc.name;
                data.des = !data.des ? (des + data.name) : data.des;
            }

            data.transaction = transaction;
            data.journalDate = data.orderDate;
            data.total = data.deposit;
            Meteor.call('insertAccountJournal', data)
        }
    });
});

Order.after.remove(function (userId, doc) {
    let setting = AccountIntegrationSetting.findOne();
    if (setting && setting.integrate) {
        let data = {_id: doc._id, type: 'saleOrderDeposit'};
        Meteor.call('removeAccountJournal', data)
    }
});