import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {ExchangeGratis} from '../../imports/api/collections/exchangeGratis.js';
import {AverageInventories} from '../../imports/api/collections/inventory.js';
import {Item} from '../../imports/api/collections/item.js';
import {GratisInventories} from '../../imports/api/collections/gratisInventory.js';
import {AccountIntegrationSetting} from '../../imports/api/collections/accountIntegrationSetting.js'
import StockFunction from '../../imports/api/libs/stock';

ExchangeGratis.before.insert(function (userId, doc) {
    let prefix = doc.vendorId;
    doc._id = idGenerator.genWithPrefix(ExchangeGratis, prefix, 6);
});


ExchangeGratis.after.insert(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        doc.items.forEach(function (item) {
            StockFunction.reduceGratisInventory(item, doc.branchId, doc.stockLocationId);
        });

        //Account Integration
        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let transaction = [];
            let data = doc;
            data.type = "ExchangeGratis";
            data.items.forEach(function (item) {
                let itemDoc = Item.findOne(item.itemId);
                if (itemDoc.accountMapping.inventoryAsset && itemDoc.accountMapping.accountPayable) {
                    transaction.push({
                        account: itemDoc.accountMapping.inventoryAsset,
                        dr: item.amount,
                        cr: 0,
                        drcr: item.amount,

                    }, {
                        account: itemDoc.accountMapping.accountPayable,
                        dr: 0,
                        cr: item.amount,
                        drcr: -item.amount,
                    })
                }
            });
            data.transaction = transaction;
            Meteor.call('insertAccountJournal', data, function (er, re) {
                if (er) {
                    doc.items.forEach(function (item) {
                        StockFunction.increaseGratisInventory(item, doc.branchId, doc.stockLocationId);
                    });
                    Meteor.call('insertRemoveExchangeGratis', doc);
                    ExchangeGratis.direct.remove({_id: doc._id});
                    throw new Meteor.Error(er.message);
                } else if (re == null) {
                    doc.items.forEach(function (item) {
                        StockFunction.increaseGratisInventory(item, doc.branchId, doc.stockLocationId);
                    });
                    Meteor.call('insertRemoveExchangeGratis', doc);
                    ExchangeGratis.direct.remove({_id: doc._id});
                    throw new Meteor.Error("Can't Entry to Account System.");
                }
            });
        }
        //End Account Integration
    });
});

ExchangeGratis.after.update(function (userId, doc) {
    let preDoc = this.previous;
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        preDoc.items.forEach(function (item) {
            StockFunction.increaseGratisInventory(item, preDoc.branchId, preDoc.stockLocationId);
        });
        doc.items.forEach(function (item) {
            StockFunction.reduceGratisInventory(item, doc.branchId, doc.stockLocationId);
        });
        //Account Integration
        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let transaction = [];
            let data = doc;
            data.type = "ExchangeGratis";
            data.items.forEach(function (item) {
                let itemDoc = Item.findOne(item.itemId);
                if (itemDoc.accountMapping.inventoryAsset && itemDoc.accountMapping.accountPayable) {
                    transaction.push({
                        account: itemDoc.accountMapping.inventoryAsset,
                        dr: item.amount,
                        cr: 0,
                        drcr: item.amount,

                    }, {
                        account: itemDoc.accountMapping.accountPayable,
                        dr: 0,
                        cr: item.amount,
                        drcr: -item.amount,
                    })
                }
            });
            data.transaction = transaction;
            Meteor.call('updateAccountJournal', data, function (er, re) {
                if (er) {
                    preDoc.items.forEach(function (item) {
                        StockFunction.reduceGratisInventory(item, preDoc.branchId, preDoc.stockLocationId);
                    });
                    doc.items.forEach(function (item) {
                        StockFunction.increaseGratisInventory(item, doc.branchId, doc.stockLocationId);
                    });
                    ExchangeGratis.direct.update(doc._id, {$set: {preDoc}});
                    throw new Meteor.Error(er.message);

                } else if (re == false) {
                    preDoc.items.forEach(function (item) {
                        StockFunction.reduceGratisInventory(item, preDoc.branchId, preDoc.stockLocationId);
                    });
                    doc.items.forEach(function (item) {
                        StockFunction.increaseGratisInventory(item, doc.branchId, doc.stockLocationId);
                    });
                    ExchangeGratis.direct.update(doc._id, {$set: {preDoc}});
                    throw new Meteor.Error("Can't Update on Account System.");
                }
            });
        }
        //End Account Integration
    });
});

//remove
ExchangeGratis.after.remove(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        doc.items.forEach(function (item) {
            StockFunction.increaseGratisInventory(item, doc.branchId, doc.stockLocationId);
        });
        //Account Integration
        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let data = {_id: doc._id, type: 'ExchangeGratis'};
            Meteor.call('removeAccountJournal', data, function (er, re) {
                if (er) {
                    doc.items.forEach(function (item) {
                        StockFunction.reduceGratisInventory(item, doc.branchId, doc.stockLocationId);
                    });
                    ExchangeGratis.direct.insert(doc);
                    throw new Meteor.Error(er.message);
                } else if (re == false) {
                    doc.items.forEach(function (item) {
                        StockFunction.reduceGratisInventory(item, doc.branchId, doc.stockLocationId);
                    });
                    ExchangeGratis.direct.insert(doc);
                    throw new Meteor.Error("Can't Remove on Account System.");
                }
            })
        }
        //End Account Integration
    });
});


/*
 Insert: reduce from gratis inventory(doc)
 Update: increase gratis inventory(preDoc)
 reduce from ring pull inventory(doc);
 Remove: increase from ring pull inventory(doc)
 */


