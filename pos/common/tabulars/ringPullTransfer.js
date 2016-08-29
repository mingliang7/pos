import {Meteor} from 'meteor/meteor';
import {Template} from 'meteor/templating';
import {Tabular} from 'meteor/aldeed:tabular';
import {EJSON} from 'meteor/ejson';
import {moment} from 'meteor/momentjs:moment';
import {_} from 'meteor/erasaur:meteor-lodash';
import {numeral} from 'meteor/numeral:numeral';
import {lightbox} from 'meteor/theara:lightbox-helpers';

// Lib
import {tabularOpts} from '../../../core/common/libs/tabular-opts.js';

// Collection
import {RingPullTransfers} from '../../imports/api/collections/ringPullTransfer.js';
import {CustomerNullCollection} from '../../imports/api/collections/tmpCollection';
// Page
Meteor.isClient && require('../../imports/ui/pages/ringPullTransfer.html');

tabularOpts.name = 'pos.ringPullTransfer';
tabularOpts.collection = RingPullTransfers;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Pos_ringPullTransferAction},
    {data: "_id", title: "ID"},
    {
        data: "ringPullTransferDate",
        title: "Date",
        render: function (val, type, doc) {
            return moment(val).format('YYYY-MM-DD');
        }
    },
    {data: "total", title: "Total"},
    {data: "des", title: "Description"},
    {
        data: "customerId",
        title: "Customer ID",
        render: function (val) {
            Meteor.call('getCustomer', {customerId: val}, function (err, result) {
                let customer = CustomerNullCollection.findOne(result._id);
                if (!customer) {
                    CustomerNullCollection.insert(result);
                }
            });
            try {
                return CustomerNullCollection.findOne(val).name;

            } catch (e) {

            }
        }
    },
    {data: "status", title: "Status"},
    //{
    //    data: "_customer",
    //    title: "Customer Info",
    //    render: function (val, type, doc) {
    //        return JSON.stringify(val, null, ' ');
    //    }
    //}
];
tabularOpts.extraFields = ['items', 'fromBranchId','toBranchId','stockLocationId'];
export const RingPullTransferTabular = new Tabular.Table(tabularOpts);
