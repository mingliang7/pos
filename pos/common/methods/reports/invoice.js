import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';

// Collection
import {Company} from '../../../../core/imports/api/collections/company.js';
import {Invoices} from '../../../imports/api/collections/invoice';

export const invoiceReport = new ValidatedMethod({
    name: 'pos.invoiceReport',
    mixins: [CallPromiseMixin],
    validate: null,
    run(params) {
        if (!this.isSimulation) {
            Meteor._sleepForMs(200);
            let selector = {}
            let data = {
                title: {},
                content: [{index: 'No Result'}],
                footer: {}
            };

            // let date = _.trim(_.words(params.date, /[^To]+/g));
            if(params.date) {
                let fromDate = moment(params.date).toDate();
                let toDate = moment(params.date).add(1, 'days').toDate();
                selector.invoiceDate = {$gte: fromDate, $lt: toDate};
            }
            console.log(selector);
            /****** Title *****/
            data.title = Company.findOne();

            /****** Content *****/
            data.content = Invoices.find(selector).fetch();

            return data
        }
    }
});
