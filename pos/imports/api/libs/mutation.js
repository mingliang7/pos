import {Invoices} from '../../api/collections/invoice';
import {Reps} from '../../api/collections/rep';

export default class Mutation {
    static addNewInvoice({obj}) {
        if(obj.flag == 'insert'){
            obj.items = [obj.item];
            Invoices.insert(obj);    
        }else{
			let items = [];
			let total = 0;
            let currentInvoice = Invoices.findOne({_id: obj._id});
			let existItem = currentInvoice.items.find(item => item.itemId == obj.item.itemId);
			currentInvoice.items.forEach(function(item){
				if(item.itemId == obj.item.itemId){
					item.qty += obj.item.qty;
					item.amount += obj.item.amount;
				}
				items.push(item)
			});
			existItem ? items : items.push(obj.item);
			Invoices.update({_id: obj._id}, {$set: {items: items, stockLocationId: currentInvoice.stockLocationId}});
        }
    }

    static insertNewRep({obj}){
        Reps.insert(obj);
    }
};
