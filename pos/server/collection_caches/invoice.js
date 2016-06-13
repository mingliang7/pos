import 'meteor/theara:collection-cache';

// Collection
import {Invoices} from '../../imports/api/collections/invoice.js';
import {Customers} from '../../imports/api/collections/customer.js';
import {StockLocations} from '../../imports/api/collections/stockLocation.js';
import {Staffs} from '../../imports/api/collections/staff.js';

Invoices.cacheTimestamp();
Invoices.cacheDoc('customer', Customers, ['name']);
Invoices.cacheDoc('stockLocation', StockLocations, ['name']);
Invoices.cacheDoc('staff', Staffs, ['name']);
