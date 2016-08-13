import {Meteor} from 'meteor/meteor';
import {Session} from 'meteor/session';
import {Template} from 'meteor/templating';
import {Tabular} from 'meteor/aldeed:tabular';
import {EJSON} from 'meteor/ejson';
import {moment} from 'meteor/momentjs:moment';
import {_} from 'meteor/erasaur:meteor-lodash';
import {numeral} from 'meteor/numeral:numeral';
import {lightbox} from 'meteor/theara:lightbox-helpers';
//tmp collection
import {balanceTmpCollection} from '../../imports/api/collections/tmpCollection';
// Lib
import {tabularOpts} from '../../../core/common/libs/tabular-opts.js';

// Collection
import {ExchangeRingPulls} from '../../imports/api/collections/exchangeRingPull.js';

// Page
Meteor.isClient && require('../../imports/ui/pages/exchangeRingPull.html');

tabularOpts.name = 'pos.exchangeRingPull';
tabularOpts.collection = ExchangeRingPulls;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Pos_exchangeRingPullAction},
    {data: "_id", title: "ID"},
    {data: "_customer", title: "Customer"},
    {
        data: "exchangeRingPullDate",
        title: "Date",
        render: function (val, type, doc) {
            return moment(val).format('YYYY-MM-DD');
        }
    },
    {data: "amount", title: "Amount"},
    {data: "des", title: "Description"},

];
export const ExchangeRingPullTabular = new Tabular.Table(tabularOpts);
