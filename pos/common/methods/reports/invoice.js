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
            let selector = {};
            let project = {};
            let data = {
                title: {},
                fields: [],
                displayFields: [],
                content: [{index: 'No Result'}],
                footer: {}
            };

            // let date = _.trim(_.words(params.date, /[^To]+/g));
            if (params.date) {
                let fromDate = moment(params.date).toDate();
                let toDate = moment(params.date).add(1, 'days').toDate();
                selector.invoiceDate = {$gte: fromDate, $lt: toDate};
            }
            if (params.customer && params.customer != '') {
                selector.customerId = params.customer;
            }
            if (params.filter && params.filter != '') {
                let filters = params.filter.split(','); //map specific field
                for (let i = 0; i < filters.length; i++) {
                    data.fields.push({field: correctFieldLabel(filters[i])});
                    data.displayFields.push({field: filters[i]});
                    project[filters[i]] = `$${filters[i]}`;
                    if(filters[i] == 'customerId'){
                        project['_customer'] = '$_customer'
                    }
                }
                data.fields.push({field: 'Total'}); //map total field for default
                data.displayFields.push({field: 'total'});
                project['total'] = '$total'; //get total projection for default
            }else{
                project = {
                    '_id': '$_id',
                    'invoiceDate': '$invoiceDate',
                    'customerId': '$customerId',
                    '_customer': '$_customer',
                    'total': '$total'
                };
                data.fields = [{field: '#ID'}, {field: 'Date'}, {field: 'Customer'}, {field: 'Total'}];
                data.displayFields = [{field: '_id'}, {field: 'invoiceDate'}, {field: 'customerId'}, {field: 'total'}];
            }

            /****** Title *****/
            data.title = Company.findOne();

            /****** Content *****/
            let invoices = Invoices.aggregate([
                {
                    $match: selector
                },
                {
                    $group: {
                        _id: null,
                        data:{
                            $addToSet: project
                        },
                        total: {
                            $sum: '$total'
                        }
                    }
                }]);
            if(invoices.length > 0){
                let sortData = _.sortBy(invoices[0].data, '_id');
                invoices[0].data = sortData
                data.content = invoices;
            }
            console.log(data);
            return data
        }
    }
});


function correctFieldLabel(field){
    let label = '';
    switch (field) {
        case '_id':
            label = '#ID';
            break;
        case 'customerId':
            label = 'Customer';
            break;
        case 'invoiceDate':
            label = 'Date';
            break;
        case 'total':
            label = 'Total';
            break;
        case 'status':
            label = 'Status';
            break;

    }
    return label;
}