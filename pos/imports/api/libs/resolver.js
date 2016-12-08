import {Item} from '../collections/item';
export default class Resolver {
    static productSearch({query, filter}) {
        let limitAmount = filter && filter.limit ? filter.limit : 7;
        if (!query) {
            return;
        }
        let regPattern = `${query}`;
        let reg = new RegExp(regPattern, 'i');//match all case
        let selector = {};
        selector.scheme = {$exists: false};
        selector.$or = [{
            enName: {
                $regex: reg
            }
        }, {
            name: {
                $regex: reg
            }
        }, {
            barcode: {
                $regex: reg
            }

        }];
        return Item.find(selector, {
            sort: {
                name: 1
            },
            limit: limitAmount
        });
    }
}