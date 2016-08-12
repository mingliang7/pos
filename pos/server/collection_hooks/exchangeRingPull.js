import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {ExchangeRingPulls} from '../../imports/api/collections/exchangeRingPull.js';

ExchangeRingPulls.before.insert(function (userId, doc) {
    let todayDate = moment().format('YYYYMMDD');
    let prefix = doc.branchId + "-" + todayDate;
    doc._id = idGenerator.genWithPrefix(ExchangeRingPulls, prefix, 4);
});

