import 'meteor/theara:collection-cache';

// Collection
import {Journal} from '../../imports/api/collections/journal';

// Meteor.startup(function () {
//     Journal._ensureIndex({refId: 1, refFrom: 1, branchId: 1, voucherId: 1,journalDate: 1,total: 1}, {unique: 1, sparse: 1});
// });

Journal.cacheTimestamp();