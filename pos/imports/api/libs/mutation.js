import {Invoices} from '../../api/collections/invoice';
import {Reps} from '../../api/collections/rep';

export default class Mutation {
    static addNewInvoice({obj}) {
        obj.items = [obj.item];
        Invoices.insert(obj);
    }

    static insertNewRep({obj}){
        Reps.insert(obj);
    }
};
