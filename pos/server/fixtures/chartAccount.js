import {AccountMapping} from '../../imports/api/collections/accountMapping.js';
Meteor.startup(function () {
    if (AccountMapping.find().count() <= 0) {
        let chartAccount = [
            {
                "_id": "001",
                "name": "Cash on Hand",
                //"account": "111102 | Cash on Hand"
            },
            {
                "_id": "002",
                "name": "A/P",
                //"account": "343434 | A/P"
            },
            {
                "_id": "003",
                "name": "A/R",
                //"account": "121212 | A/R"
            },
            {
                "_id": "004",
                "name": "Purchase Discount",
                //"account": "665566 | Purchase Discount"
            },
            {
                "_id": "005",
                "name": "Inventory Supplier Owing",
                //"account": "120002 | Inventory Supplier Owing"
            },
            {
                "_id": "006",
                "name": "Inventory",
                //"account": "120003 | Inventory"
            },
            {
                "_id": "007",
                "name": "Sale Discount",
                //"account": "556655 | Sale Discount"
            },
            {
                "_id": "008",
                "name": "Owe Inventory Customer",
                //"account": "320004 | Owe Inventory Customer"
            },
            {
                "_id": "009",
                "name": "Lending Stock",
                //"account": "120005 | Lending Stock"
            },
            {
                "_id": "010",
                "name": "Ring Pull",
                //"account": "120006 | Ring Pull"
            },
            {
                "_id": "011",
                "name": "Gratis",
                //"account": "620009 | Gratis"
            },
            {
                "_id": "012",
                "name": "Inventory Ring Pull Owing",
                //"account": "120008 | Inventory Ring Pull Owing"
            },
            {
                "_id": "013",
                "name": "Inventory Gratis Owing",
                //"account": "120007 | Inventory Gratis Owing"
            },
            {
                "_id": "014",
                "name": "Lost Inventory",
                //"account": "650009 | Lost Inventory"
            },/* 15 */
            {
                "_id" : "015",
                "name" : "Sale Income",
                //"account" : "565656 | Sale Income"
            },

            /* 16 */
            {
                "_id" : "016",
                "name" : "COGS",
                //"account" : "666666 | COGS"
            }];
        chartAccount.forEach(function (obj) {
            AccountMapping.insert(obj);
        });
    }
});