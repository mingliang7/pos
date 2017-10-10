import {Location} from '../../imports/api/collections/location.js';

// Lib
import './_init.js';

Location.permit(['insert'])
    .Pos_ifDataInsert()
    .allowInClientCode();
Location.permit(['update'])
    .Pos_ifDataUpdate()
    .allowInClientCode();
Location.permit(['remove'])
    .Pos_ifDataRemove()
    .allowInClientCode();
