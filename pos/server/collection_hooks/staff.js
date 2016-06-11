import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {Staffs} from '../../imports/api/collections/staff.js';

Staffs.before.insert(function (userId, doc) {
    let prefix = doc.branchId + '-';
    doc._id = idGenerator.genWithPrefix(Staffs, prefix, 4);
});


