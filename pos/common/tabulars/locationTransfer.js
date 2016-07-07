import {Meteor} from 'meteor/meteor';
import {Templet} from 'meteor/templating';
import {Tabular} from 'meteor/aldeed:tabular';
import {EJSON} from 'meteor/ejson';
import {moment} from 'meteor/momentjs:moment';
import {_} from 'meteor/erasaur:meteor-lodash';
import {numeral} from 'meteor/numeral:numeral';
import {lightbox} from 'meteor/theara:lightbox-helpers';

// Lib
import {tabularOpts} from '../../../core/common/libs/tabular-opts.js';

// Collection
import {LocationTransfers} from '../../imports/api/collections/locationTransfer';

// Page
Meteor.isClient && require('../../imports/ui/pages/locationTransfer.html');

tabularOpts.name = 'pos.locationTransfer';
tabularOpts.collection = LocationTransfers;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Pos_locationTransferAction},
    {data: "_id", title: "ID"},
    {
        data: "locationTransferDate",
        title: "Date",
        render: function (val, type, doc) {
            return moment(val).format('YYYY-MM-DD');
        }
    },
    {data: "total", title: "Total"},
    {data: "des", title: "Description"},
    {data: "fromStaffId", title: "From Staff ID"},
    {data: "toStaffId", title: "To Staff ID"},
    {data: "fromStockLocationId", title: "From Stock Location"},
    //{
    //    data: "_vendor",
    //    title: "Vendor Info",
    //    render: function (val, type, doc) {
    //        return JSON.stringify(val, null, ' ');
    //    }
    //}
];
export const LocationTransferTabular = new Tabular.Table(tabularOpts);
