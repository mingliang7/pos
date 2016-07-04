import 'meteor/theara:collection-cache';

// Collection
import {LocationTransfers} from '../../imports/api/collections/locationTransfer.js';
import {Staffs} from '../../imports/api/collections/staff.js';
import {StockLocations} from '../../imports/api/collections/stockLocation.js';

LocationTransfers.cacheTimestamp();
LocationTransfers.cacheDoc('fromStaff', Staffs, ['name'],'fromStaffId');
LocationTransfers.cacheDoc('toStaff', Staffs, ['name'],'toStaffId');
LocationTransfers.cacheDoc('stockLocation',StockLocations,['name']);