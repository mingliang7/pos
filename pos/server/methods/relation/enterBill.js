import {Meteor} from 'meteor/meteor';
import {billState} from '../../../common/globalState/enterBill';

Meteor.methods({
    getBillId(tmpId){
        Meteor._sleepForMs(1000);
        let sale = billState.get(tmpId);
        delete  billState._obj[tmpId]; //clearing state
        return sale;
    }
});