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
import {Vendors} from '../../imports/api/collections/vendor.js';
import {balanceTmpCollection} from '../../imports/api/collections/tmpCollection';
// Page
Meteor.isClient && require('../../imports/ui/pages/vendor.html');

tabularOpts.name = 'pos.vendor';
tabularOpts.collection = Vendors;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Pos_vendorAction},
    {data: "_id", title: "ID"},
    {data: "name", title: "Name"},
    {data: "gender", title: "Gender"},
    {data: "telephone", title: "Telephone"},
    {data: "email", title: "Email"},
    {title: '', tmpl: Meteor.isClient && Template.Pos_vendorButtonAction}
];
tabularOpts.extraFields = ['termId', '_term', 'paymentType', 'repId', 'paymentGroupId', 'address'];
export const VendorTabular = new Tabular.Table(tabularOpts);
