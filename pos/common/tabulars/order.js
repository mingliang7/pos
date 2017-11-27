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
import {Order} from '../../imports/api/collections/order.js';

// Page
Meteor.isClient && require('../../imports/ui/pages/order.html');
let customerNullCollection = new Mongo.Collection(null);
tabularOpts.name = 'pos.order';
tabularOpts.collection = Order;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Pos_orderAction},
    {data: "_id", title: "ID"},
    {
        data: "orderDate",
        title: "Date",
        render: function (val, type, doc) {
            return moment(val).format('YYYY-MM-DD');
        }
    },
    {
        data: "customerId",
        title: "Customer",
        render: function (val) {
            let customer = customerNullCollection.findOne({customerId: val});
            if (!customer) {
                Meteor.call('getCustomer', {customerId: val}, (err, result) => {
                    customerNullCollection.insert({customerId: result._id, name: result.name});
                    customer = result;
                });
            }
            return customer && customer.name;
        }
    },
    {
        data: "deposit",
        title: "Deposit",
        render: function(val) {
            return numeral(val).format('0,0.00');
        }
    },
    {data: "total", title: "Total"},
    // {data: "sumRemainQty", title: "Remain QTY"},
    {data: "des", title: "Description"},
    {data: "status", title: "Status"}
    //{
    //    data: "_customer",
    //    title: "Customer Info",
    //    render: function (val, type, doc) {
    //        return JSON.stringify(val, null, ' ');
    //    }
    //}
];
tabularOpts.extraFields = ['items', 'customerId'];
export const OrderTabular = new Tabular.Table(tabularOpts);
