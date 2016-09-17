import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';
import {AverageInventories} from '../../imports/api/collections/inventory.js';
// Collection
import {CompanyExchangeRingPulls} from '../../imports/api/collections/companyExchangeRingPull.js';
import {Item} from '../../imports/api/collections/item.js'
import {RingPullInventories} from '../../imports/api/collections/ringPullInventory.js'
CompanyExchangeRingPulls.before.insert(function (userId, doc) {
    let todayDate = moment().format('YYYYMMDD');
    let prefix = doc.branchId + "-" + todayDate;
    doc._id = idGenerator.genWithPrefix(CompanyExchangeRingPulls, prefix, 4);
});

/*
    insert: reduce from RingPull Inventory(doc)
    update: increase ring pull inventory (predoc)
            reduce from ring pull inventory(doc)
    remove: increase ring pull inventory(doc)
 */


