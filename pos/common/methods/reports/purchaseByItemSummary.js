import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';

// Collection
import {EnterBills} from '../../../imports/api/collections/enterBill';
import {ReceiveItems} from '../../../imports/api/collections/receiveItem';
import {LocationTransfers} from '../../../imports/api/collections/locationTransfer';

export const purchaseByItemSummaryFn = new ValidatedMethod({
    name: 'pos.purchaseByItem',
    mixins: [CallPromiseMixin],
    validate: null,
    run(params) {
        if (!this.isSimulation) {
            Meteor._sleepForMs(200);
            let selector = {};
            let project = {};
            let skip = 0;
            let limit = 500;
            let data = {
                title: {},
                fields: [],
                displayFields: [],
                content: [{index: 'No Result'}],
                footer: {}
            };
            let collections = ['EnterBills', 'ReceiveItems', 'LocationTransfers'];
            let filterCollection = [];
            let collectionObj = {};
            let afterUnion = [];
            collections.forEach(function (e) {
                collectionObj[e] = eval(e).find(selector).fetch();
            });
            afterUnion = _.union(collectionObj['EnterBills'] || [], collectionObj['ReceiveItems'] || [], collectionObj['LocationTransfers'] || []);
            console.log(afterUnion);
        }
    }
});



