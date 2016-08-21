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
import {ExchangeRingPulls} from '../../imports/api/collections/exchangeRingPull.js';
import {customerExchangeRingPullCollection} from '../../imports/api/collections/tmpCollection';
// Page
Meteor.isClient && require('../../imports/ui/pages/exchangeRingPull.html');

tabularOpts.name = 'pos.exchangeRingPull';
tabularOpts.collection = ExchangeRingPulls;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Pos_exchangeRingPullAction},
    {data: "_id", title: "ID"},
    {
        data: "exchangeRingPullDate",
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
                let customer = customerExchangeRingPullCollection.findOne(result._id);
                if (!customer) {
                    customerExchangeRingPullCollection.insert(result);
                }
            });
            try {
                return customerExchangeRingPullCollection.findOne(val).name;

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
tabularOpts.extraFields = ['items', 'repId'];
export const ExchangeRingPullTabular = new Tabular.Table(tabularOpts);
