import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {LocationTransfers} from '../../imports/api/collections/locationTransfer.js';
import {AverageInventories} from '../../imports/api/collections/inventory.js';

LocationTransfers.before.insert(function (userId, doc) {
    let todayDate = moment().format('YYYYMMDD');
    let prefix = doc.fromBranchId + "-" + todayDate;
    doc._id = idGenerator.genWithPrefix(LocationTransfers, prefix, 4);
});

LocationTransfers.after.insert(function (userId, doc) {
});

LocationTransfers.after.update(function (userId, doc, fieldNames, modifier, options) {
});
