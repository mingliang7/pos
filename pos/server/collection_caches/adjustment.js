import 'meteor/theara:collection-cache';

// Collection
import {Adjustments} from '../../imports/api/collections/adjustment.js';
import {Customers} from '../../imports/api/collections/customer.js';

Adjustments.cacheTimestamp();
// Adjustments.cacheDoc('customer', Customers, ['name']);
