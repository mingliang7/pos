import {Reps} from '../../imports/api/collections/rep';
import {Categories} from '../../imports/api/collections/category';
import {Units} from '../../imports/api/collections/units';
import {AverageInventories} from '../../imports/api/collections/inventory';
import {Customers} from '../../imports/api/collections/customer';
import {Vendors} from '../../imports/api/collections/vendor';
import {CompanyExchangeRingPulls} from '../../imports/api/collections/companyExchangeRingPull';
import {EnterBills} from '../../imports/api/collections/enterBill';
import {ExchangeRingPulls} from '../../imports/api/collections/exchangeRingPull';
import {GratisInventories} from '../../imports/api/collections/gratisInventory';
import {Invoices} from '../../imports/api/collections/invoice';
import {GroupInvoice} from '../../imports/api/collections/groupInvoice';
import {Item} from '../../imports/api/collections/item';
import {LendingStocks} from '../../imports/api/collections/lendingStock';
import {LocationTransfers} from '../../imports/api/collections/locationTransfer';
import {PayBills} from '../../imports/api/collections/payBill';
import {PrepaidOrders} from '../../imports/api/collections/prepaidOrder';
import {ReceiveItems} from '../../imports/api/collections/receiveItem';
import {ReceivePayment} from '../../imports/api/collections/receivePayment';
import {RingPullInventories} from '../../imports/api/collections/ringPullInventory';
import {RingPullTransfers} from '../../imports/api/collections/ringPullTransfer';
import {TransferMoney} from '../../imports/api/collections/transferMoney';
import {Order} from '../../imports/api/collections/order';
import {InventoryDates} from '../../imports/api/collections/inventoryDate';
import {ConvertItems} from '../../imports/api/collections/convertItem';
import {Journal} from '../../../acc/imports/api/collections/journal';
import {DateEndOfProcess} from '../../../acc/imports/api/collections/dateEndOfProcess';
import {NetInCome} from '../../../acc/imports/api/collections/netIncome';
import {CloseChartAccount} from '../../../acc/imports/api/collections/closeChartAccount';
import {CloseChartAccountPerMonth} from '../../../acc/imports/api/collections/closeChartAccountPerMonth';
import {Closing} from '../../../acc/imports/api/collections/closing';
import {FixAssetExpense} from '../../../acc/imports/api/collections/fixAssetExpense';
import {StockLocations} from '../../imports/api/collections/stockLocation';
import {StockAndAccountMapping} from '../../imports/api/collections/stockAndAccountMapping';
import {ItemPriceForCustomers} from '../../imports/api/collections/itemPriceForCustomer';
import {QuantityRangeMapping} from '../../imports/api/collections/quantityRangeMapping';
import {Terms} from '../../imports/api/collections/terms';
import {PaymentGroups} from '../../imports/api/collections/paymentGroup';
import {Location} from '../../imports/api/collections/location';
Meteor.methods({
    removeAllData() {
        //remove all data except some setting
        Units.remove({});
        AverageInventories.remove({});
        Categories.remove({});
        CompanyExchangeRingPulls.remove({});
        EnterBills.remove({});
        ExchangeRingPulls.remove({});
        GratisInventories.remove({});
        Invoices.remove({});
        GroupInvoice.remove({});
        Item.remove({});
        LendingStocks.remove({});
        LocationTransfers.remove({});
        PayBills.remove({});
        PrepaidOrders.remove({});
        ReceiveItems.remove({});
        ReceivePayment.remove({});
        RingPullInventories.remove({});
        RingPullTransfers.remove({});
        TransferMoney.remove({});
        Order.remove({});
        InventoryDates.remove({});
        ConvertItems.remove({});
        //clear acc
        Journal.remove({});
        DateEndOfProcess.remove({});
        NetInCome.remove({});
        CloseChartAccount.remove({});
        CloseChartAccountPerMonth.remove({});
        Closing.remove({});
        FixAssetExpense.remove({});
        Customers.remove({});
        Vendors.remove({});
        Reps.remove({});
        StockLocations.remove({});
        StockAndAccountMapping.remove({});
        Terms.remove({});
        Location.remove({});
        QuantityRangeMapping.remove({});
        return;
    },
    removeAllTransaction(){
        //remove all data except some setting
        AverageInventories.remove({});
        CompanyExchangeRingPulls.remove({});
        EnterBills.remove({});
        ExchangeRingPulls.remove({});
        GratisInventories.remove({});
        Invoices.remove({});
        GroupInvoice.remove({});
        Item.update({}, {$unset: {qtyOnHand: ''}}, {multi: true});
        LendingStocks.remove({});
        LocationTransfers.remove({});
        PayBills.remove({});
        PrepaidOrders.remove({});
        ReceiveItems.remove({});
        ReceivePayment.remove({});
        RingPullInventories.remove({});
        RingPullTransfers.remove({});
        TransferMoney.remove({});
        Order.remove({});
        InventoryDates.remove({});
        ConvertItems.remove({});
        //clear acc
        Journal.remove({});
        DateEndOfProcess.remove({});
        NetInCome.remove({});
        CloseChartAccount.remove({});
        CloseChartAccountPerMonth.remove({});
        Closing.remove({});
        FixAssetExpense.remove({});
        return;
    }
});
