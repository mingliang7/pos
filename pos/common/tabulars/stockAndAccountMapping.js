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
import {StockAndAccountMapping} from '../../imports/api/collections/stockAndAccountMapping.js';
import {nullCollection} from '../../imports/api/collections/tmpCollection';

// Page
Meteor.isClient && require('../../imports/ui/pages/stockAndAccountMapping.html');

tabularOpts.name = 'pos.stockAndAccountMapping';
tabularOpts.collection = StockAndAccountMapping;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Pos_stockAndAccountMappingAction},
    {
        data: "userId",
        title: "User",
        render: function (value) {
            try {
                let user = nullCollection.findOne({userId: value});
                if (!user) {
                    Meteor.call('stockAndAccountMappingInfo', {userId: value}, function (err, result) {
                        nullCollection.insert(result);
                    });
                    return nullCollection.findOne({userId: value}).username;
                }
                return user.username;
            } catch (e) {
            }
        }
    },
    {
        data: "stockLocations",
        title: "Stock Location",
        render: function(val, type, doc) {
            let label = '';
            try {
                let stockLocations = nullCollection.findOne({userId: doc.userId}).stockLocations;
                stockLocations.forEach(function (stockLocation) {
                    label += `${stockLocation.name}, `;
                });
                return label;
            }catch(e){

            }
        }
    },
];
tabularOpts.extraFields = ['_id', 'chartAccounts', 'branchId'];
export const StockAndAccountMappingTabular = new Tabular.Table(tabularOpts);
