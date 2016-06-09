import 'meteor/theara:collection-cache';

// Collection
import {Customers} from '../../imports/api/collections/customer.js';
import {Order} from '../../imports/api/collections/order.js';

Customers.cacheTimestamp();
