import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {GratisInventories} from '../../imports/api/collections/gratisInventory.js';


GratisInventories.before.insert(function (userId, doc) {
    let prefix = doc.stockLocationId + '-';
    doc._id = idGenerator.genWithPrefix(GratisInventories, prefix, 13);
});

