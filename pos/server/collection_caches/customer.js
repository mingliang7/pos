import 'meteor/theara:collection-cache';

// Collection
import {Customers} from '../../imports/api/collections/customer.js';
import {Terms} from '../../imports/api/collections/terms.js';
import {PaymentGroups} from '../../imports/api/collections/paymentGroup.js';
Customers.cacheTimestamp();
Customers.cacheDoc('term',Terms,['name']);
Customers.cacheDoc('paymentGroup',PaymentGroups,['name']);