import Mutation from '../../../imports/api/libs/mutation';
import {Customers} from '../../../imports/api/collections/customer';
import {StockLocations} from '../../../imports/api/collections/stockLocation';
import {Invoices} from '../../../imports/api/collections/invoice';
import {Reps} from '../../../imports/api/collections/rep';
import {Item} from '../../../imports/api/collections/item';

Meteor.methods({
    'mart.addProductToInvoice'({data}){
        let obj = {};
        let flag = '';
        let todayDate = moment(data.date).format('YYYYMMDD');
        let prefix = data.branchId + '-' + todayDate;
        obj._id = !data.invoiceId ? idGenerator.genWithPrefix(Invoices, prefix, 4) : data.invoiceId;
        obj.flag = !data.invoiceId ? 'insert' : 'update';
        flag = !data.invoiceId ? 'insert' : 'update';
        obj.item = {
            name: Item.findOne(data.product._id).name,
            itemId: data.product._id,
            qty: data.qty || 1,
            price: data.product.price,
            amount:  (data.qty || 1) * data.product.price,
        };
        if (obj.flag == 'insert') {
            let customer = Customers.findOne({}, {_id: 1});
            let rep = Reps.findOne({}, {_id: 1});
            let stockLocation = StockLocations.findOne({}, {_id: 1});
            if (!rep) {
                let obj = {
                    name: "general",
                    gender: "Male",
                    position: "Seller",
                    startDate: data.date,
                    status: "Enable",
                    branchId: data.branchId,
                };
                Mutation.insertNewRep({obj});
                rep = Reps.findOne({}, {_id: 1});
            }
            if (!customer) {
                throw new Meteor.Error("សូមមេត្តាបញ្ចូលឈ្មោះអតិថិជន");
            }
            if (!stockLocation) {
                throw new Meteor.Error("សូមមេត្តាបញ្ចូលស្តុកជាមុនសិន");

            }
            obj.stockLocationId = stockLocation._id;
            obj.invoiceDate = data.date;
            obj.staffId = data.userId;
            obj.branchId = data.branchId;
            obj.customerId = customer._id;
            obj.termId = customer.termId;
            obj.invoiceType = 'term';
            obj.repId = rep._id;
            obj.total = obj.item.amount;
        }
        Mutation.addNewInvoice({obj});
        return {_id: obj._id, flag};
    }
});