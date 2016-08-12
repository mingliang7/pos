import 'meteor/theara:collection-cache';

// Collection
import {ExchangeRingPulls} from '../../imports/api/collections/exchangeRingPull.js';
import {Terms} from '../../imports/api/collections/terms.js';
import {Reps} from '../../imports/api/collections/rep.js';
import {PaymentGroups} from '../../imports/api/collections/paymentGroup.js';
ExchangeRingPulls.cacheTimestamp();
