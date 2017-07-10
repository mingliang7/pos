import {Meteor} from 'meteor/meteor';
import {Session} from 'meteor/session';
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
import {ClosingStockBalance} from '../../imports/api/collections/closingStock.js';

// Page
Meteor.isClient && require('../../imports/ui/pages/closingStockList.html');

tabularOpts.name = 'pos.closingStockList';
tabularOpts.collection = ClosingStockBalance;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Pos_closingStockListAction},
    {
        data: "closingDateString"
    },
    {data: "branchId", title: "BranchId"}
];
tabularOpts.extraFields = ['_id'];
export const ClosingStockBalanceTabular = new Tabular.Table(tabularOpts);
