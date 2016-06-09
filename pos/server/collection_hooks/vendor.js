import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {Vendors} from '../../imports/api/collections/vendor';

Vendors.before.insert(function (userId, doc) {
    doc._id = idGenerator.gen(Vendors, 5);
});
