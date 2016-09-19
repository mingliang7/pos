import {Company} from '../../../../core/imports/api/collections/company';
import {Invoices} from '../../../imports/api/collections/invoice';
Meteor.methods({
    posChart(){
        let coreCompany = Company.findOne();
        let startOfMonth = moment().startOf('month').toDate();
        let endOfMonth = moment().endOf('month').toDate()
        let selector = {
            invoiceDate: {$gte: startOfMonth, $lte: endOfMonth}
        };
        let data = Invoices.aggregate([
            {$match: selector},
            {
                $group: {
                    _id: {
                        day: {$dayOfMonth: "$invoiceDate"},
                        month: {$month: "$invoiceDate"},
                        year: {$year: "$invoiceDate"}
                    },
                    invoiceDate: {$last: "$invoiceDate"},
                    total: {$sum: "$total"}

                }
            },
            {
                $sort: {invoiceDate: 1}
            },
            {
                $project: {_id: 0, name: {$dateToString: {format: "%d/%m/%Y", date: "$invoiceDate"}} , y: "$total"}
            }
        ]);
        return {company: `${coreCompany.khName}(${coreCompany.enName})`, invoices: data};
    }
});