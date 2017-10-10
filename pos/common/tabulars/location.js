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
import {Location} from '../../imports/api/collections/location.js';

// Page
Meteor.isClient && require('../../imports/ui/pages/location.html');

tabularOpts.name = 'pos.location';
tabularOpts.collection = Location;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Pos_locationAction},
    {data: "_id", title: "ID"},
    {data: "name", title: "Name"},
    {data: "des", title: 'Description'}
];
export const LocationTabular = new Tabular.Table(tabularOpts);
