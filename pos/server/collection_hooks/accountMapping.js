import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {AccountMapping} from '../../imports/api/collections/accountMapping.js';

AccountMapping.before.insert(function (userId, doc) {
    doc._id = idGenerator.gen(AccountMapping, 3);
});


