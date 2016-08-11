import {Meteor} from 'meteor/meteor';
import {Session} from 'meteor/session';
import {Template} from 'meteor/templating';
import {Tabular} from 'meteor/aldeed:tabular';
import {EJSON} from 'meteor/ejson';
import {moment} from 'meteor/momentjs:moment';
import {_} from 'meteor/erasaur:meteor-lodash';
import {numeral} from 'meteor/numeral:numeral';
import {lightbox} from 'meteor/theara:lightbox-helpers';
import {tmpCollection} from '../../imports/api/collections/tmpCollection';
// Lib
import {tabularOpts} from '../../../core/common/libs/tabular-opts.js';

// Collection
import {ReceivePayment} from '../../imports/api/collections/receivePayment.js';

// Page
Meteor.isClient && require('../../imports/ui/pages/paymentTransactionList.html');

tabularOpts.name = 'pos.paymentTransaction';
tabularOpts.collection = ReceivePayment;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Pos_paymentTransactionAction},
    {data: "invoiceId", title: "Invoice ID"},
    {
        data: "paymentDate",
        title: "Date",
        render: function (val) {
            return moment(val).format('YYYY-MM-DD HH:mm')
        }
    },
    {
        data: "customerId",
        title: "Customer",
        render: function (val) {
            Meteor.call('getCustomer', {customerId: val}, function (err, result) {
                tmpCollection.insert(result);
            });
            return tmpCollection.findOne(val).name;
        }
    },
    {
        data: "dueAmount",
        title: 'Due Amount',
        render: function(val) {
            return numeral(val).format('0,0.00');
        }
    },
    {
        data: "paidAmount",
        title: "Paid Amount",
        render: function(val) {
            return numeral(val).format('0,0.00');
        }
    },
    {
        data: 'balanceAmount',
        title: "Balance Amount",
        render: function(val) {
            if(val > 0) {
                return `<span class="text-red">${numeral(val).format('0,0.00')}</span>`
            }
            return numeral(val).format('0,0.00');
        }
    }

// {data: "description", title: "Description"}
]
;
//tabularOpts.extraFields=['_parent'];
export const PaymentTransactionListTabular = new Tabular.Table(tabularOpts);
