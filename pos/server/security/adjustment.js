import {Adjustments} from '../../imports/api/collections/adjustment.js';

// Lib
import './_init.js';

Adjustments.permit(['insert'])
    .Pos_ifDataInsert()
    .allowInClientCode();
Adjustments.permit(['update'])
    .Pos_ifDataUpdate()
    .allowInClientCode();
Adjustments.permit(['remove'])
    .Pos_ifDataRemove()
    .allowInClientCode();
