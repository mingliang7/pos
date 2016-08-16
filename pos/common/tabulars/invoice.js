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
import {Invoices} from '../../imports/api/collections/invoice.js';
import {customerInvoiceCollection} from '../../imports/api/collections/tmpCollection';
// Page
Meteor.isClient && require('../../imports/ui/pages/invoice.html');

tabularOpts.name = 'pos.invoice';
tabularOpts.collection = Invoices;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Pos_invoiceAction},
    {data: "_id", title: "ID"},
    {
        data: "invoiceDate",
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
                let customer = customerInvoiceCollection.findOne(result._id);
                if (!customer) {
                    customerInvoiceCollection.insert(result);
                }
            });
            try {
                return customerInvoiceCollection.findOne(val).name;

            } catch (e) {

            }
        }
    },
    {data: "invoiceType", title: "Type"},
    {data: "status", title: "Status"},
    //{
    //    data: "_customer",
    //    title: "Customer Info",
    //    render: function (val, type, doc) {
    //        return JSON.stringify(val, null, ' ');
    //    }
    //}
];
tabularOpts.extraFields = ['items', 'dueDate', 'stockLocationId', 'repId', 'voucherId', 'invoiceType', 'saleId', 'paymentGroupId'];
export const InvoiceTabular = new Tabular.Table(tabularOpts);
