import {Staffs} from '../../imports/api/collections/staff.js';

// Lib
import './_init.js';

Staffs.permit(['insert'])
    .Pos_ifDataInsert()
    .allowInClientCode();
Staffs.permit(['update'])
    .Pos_ifDataUpdate()
    .allowInClientCode();
Staffs.permit(['remove'])
    .Pos_ifDataRemove()
    .allowInClientCode();
