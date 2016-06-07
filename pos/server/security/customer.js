import {Customer} from '../../imports/api/collections/customer.js';

// Lib
import './_init.js';

Customer.permit(['insert'])
    .Pos_ifDataInsert()
    .allowInClientCode();
Customer.permit(['update'])
    .Pos_ifDataUpdate()
    .allowInClientCode();
Customer.permit(['remove'])
    .Pos_ifDataRemove()
    .allowInClientCode();
