import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {RingPullTransfers} from '../../imports/api/collections/ringPullTransfer.js';

RingPullTransfers.before.insert(function (userId, doc) {
    let todayDate = moment().format('YYYYMMDD');
    let prefix = doc.fromBranchId + "-" + todayDate;
    doc._id = idGenerator.genWithPrefix(RingPullTransfers, prefix, 4);
});

