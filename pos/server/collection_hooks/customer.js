import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {Customers} from '../../imports/api/collections/customer.js';

Customers.before.insert(function (userId, doc) {
    let prefix = doc.branchId + '-';
    doc._id = idGenerator.genWithPrefix(Customers, prefix, 6);
});
