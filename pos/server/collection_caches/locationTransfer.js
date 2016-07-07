import 'meteor/theara:collection-cache';

// Collection
import {LocationTransfers} from '../../imports/api/collections/locationTransfer.js';
import {StockLocations} from '../../imports/api/collections/stockLocation.js';

LocationTransfers.cacheTimestamp();
//LocationTransfers.cacheDoc('fromUser', Staffs, ['name'], 'fromUserId');
//LocationTransfers.cacheDoc('toUser', Staffs, ['name'], 'toUserId');
LocationTransfers.cacheDoc('stockLocation', StockLocations, ['name']);