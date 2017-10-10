import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {Location} from '../../imports/api/collections/location.js';

Location.before.insert(function (userId, doc) {
    doc._id = idGenerator.gen(Location, 2);
});


