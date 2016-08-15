import {Meteor} from 'meteor/meteor';
import {Session} from 'meteor/session';
import {FlowRouter} from 'meteor/kadira:flow-router';
import {FlowRouterTitle} from 'meteor/ostrio:flow-router-title';
import 'meteor/arillo:flow-router-helpers';
import 'meteor/zimme:active-route';
import 'meteor/theara:flow-router-breadcrumb';

// Lib
import {__} from '../../core/common/libs/tapi18n-callback-helper.js';

// Layout
import {Layout} from '../../core/client/libs/render-layout.js';
import '../../core/imports/ui/layouts/login';
import '../../core/imports/ui/layouts/main';

// Group
let PosRoutes = FlowRouter.group({
    prefix: '/pos',
    title: "POS",
    titlePrefix: 'POS > ',
    subscriptions: function (params, queryParams) {
//     this.register('files', Meteor.subscribe('files'));
    }
});

// Home
import '../imports/ui/pages/home.js';
PosRoutes.route('/home', {
    name: 'pos.home',
    title: __('pos.home.title'),
    action: function (param, queryParam) {
        Layout.main('Pos_home');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: __('pos.home.title'),
        icon: 'home',
        parent: 'core.welcome'
    }
});

// Item
import '../imports/ui/pages/item.js';
PosRoutes.route('/item', {
    name: 'pos.item',
    title: __('pos.item.title'),
    action: function (params, queryParams) {
        Layout.main('Pos_item');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: __('pos.item.title'),
        icon: 'product-hunt',
        parent: 'pos.home'
    }
});

// Customer
import '../imports/ui/pages/customer.js';
PosRoutes.route('/customer', {
    name: 'pos.customer',
    title: __('pos.customer.title'),
    action: function (params, queryParams) {
        Layout.main('Pos_customer');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: __('pos.customer.title'),
        icon: 'users',
        parent: 'pos.home'
    }
});
//receive payment
import '../imports/ui/pages/receivePayment.js';
PosRoutes.route('/customer/:customerId?/receive-payment/:invoiceId?', {
    name: 'pos.receivePayment',
    title: __('pos.receivePayment.title'),
    action: function (params, queryParams) {
        Layout.main('Pos_receivePayment');
    },
    breadcrumb: {
        params: ['customerId', 'invoiceId'],
        //queryParams: ['show', 'color'],
        title: __('pos.receivePayment.title'),
        icon: 'credit-card',
        parent: 'pos.customer'
    }
});
/*// receive payment with invoice id link
 import '../imports/ui/pages/receivePayment.js';
 PosRoutes.route('/customer/:customerId/receive-payment/:invoiceId', {
 name: 'pos.receivePaymentWithInvoiceId',
 title: __('pos.receivePayment.title'),
 action: function (params, queryParams) {
 Layout.main('Pos_receivePayment');
 },
 breadcrumb: {
 params: ['customerId', 'invoiceId'],
 //queryParams: ['show', 'color'],
 title: __('pos.receivePayment.title'),
 icon: 'credit-card',
 parent: 'pos.customer'
 }
 });*/
// Order
import '../imports/ui/pages/order.js';
PosRoutes.route('/order', {
    name: 'pos.order',
    title: __('pos.order.title'),
    action: function (params, queryParams) {
        Layout.main('Pos_order');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: __('pos.order.title'),
        icon: 'cart-plus',
        parent: 'pos.home'
    }
});
//Purchase Order
import '../imports/ui/pages/purchaseOrder.js';
PosRoutes.route('/purchase-order', {
    name: 'pos.purchaseOrder',
    title: __('pos.purchaseOrder.title'),
    action: function (params, queryParams) {
        Layout.main('Pos_purchaseOrder');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: __('pos.purchaseOrder.title'),
        icon: 'cart-plus',
        parent: 'pos.home'
    }
});
//unit
import '../imports/ui/pages/unit';
PosRoutes.route('/unit', {
    name: 'pos.unit',
    title: 'unit',
    action: function (params, queryParams) {
        Layout.main('Pos_unit');
    },
    breadcrumb: {
        title: 'unit',
        icon: 'cart-plus',
        parent: 'pos.home'
    }

});

import '../imports/ui/pages/term.js'
PosRoutes.route('/term', {
    name: 'pos.term',
    title: 'term',
    action: function (params, queryParams) {
        Layout.main('Pos_term');
    },
    breadcrumb: {
        title: 'term',
        icon: 'cart-plus',
        parent: 'pos.home'
    }
});

// Categories
import '../imports/ui/pages/category.js';
PosRoutes.route('/category', {
    name: 'pos.category',
    title: __('pos.category.title'),
    action: function (params, queryParams) {
        Layout.main('Pos_category');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: __('pos.category.title'),
        icon: 'cart-plus',
        parent: 'pos.home'
    }
});

import '../imports/ui/pages/vendor.js';
PosRoutes.route('/vendor', {
    name: 'pos.vendor',
    title: __('pos.vendor.title'),
    action: function (params, queryParams) {
        Layout.main('Pos_vendor');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: __('pos.vendor.title'),
        icon: 'cart-plus',
        parent: 'pos.home'
    }
});

import '../imports/ui/pages/paymentGroup.js';
PosRoutes.route('/payment-group', {
    name: 'pos.paymentGroup',
    title: __('pos.paymentGroup.title'),
    action: function (params, queryParams) {
        Layout.main('Pos_paymentGroup');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: __('pos.paymentGroup.title'),
        icon: 'cart-plus',
        parent: 'pos.home'
    }
});

import '../imports/ui/pages/stockLocation.js';
PosRoutes.route('/stock-location', {
    name: 'pos.stockLocation',
    title: __('pos.stockLocation.title'),
    action: function (params, queryParams) {
        Layout.main('Pos_stockLocation');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: __('pos.stockLocation.title'),
        icon: 'cart-plus',
        parent: 'pos.home'
    }
});
import '../imports/ui/pages/rep.js';
PosRoutes.route('/rep', {
    name: 'pos.rep',
    title: __('pos.rep.title'),
    action: function (params, queryParams) {
        Layout.main('Pos_rep');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: __('pos.rep.title'),
        icon: 'cart-plus',
        parent: 'pos.home'
    }
});

// Invoice
import '../imports/ui/pages/invoice.js';
PosRoutes.route('/invoice', {
    name: 'pos.invoice',
    title: __('pos.invoice.title'),
    action: function (params, queryParams) {
        Layout.main('Pos_invoice');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: __('pos.invoice.title'),
        icon: 'cart-plus',
        parent: 'pos.home'
    }
});

// Enter Bill
import '../imports/ui/pages/enterBill.js';
PosRoutes.route('/enterBill', {
    name: 'pos.enterBill',
    title: __('pos.enterBill.title'),
    action: function (params, queryParams) {
        Layout.main('Pos_enterBill');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: __('pos.enterBill.title'),
        icon: 'cart-plus',
        parent: 'pos.home'
    }
});
//Pay Bill
import '../imports/ui/pages/payBill';
PosRoutes.route('/vendor/:vendorId?/payBill/:billId?', {
    name: 'pos.payBill',
    title: 'Pay Bill',
    action: function (params, queryParams) {
        Layout.main('Pos_payBill');
    },
    breadcrumb: {
        params: ['vendorId'],
        title: 'Pay Bill',
        icon: 'cart-plus',
        parent: 'pos.vendor'
    }
});


//confirm transfer location
import '../imports/ui/pages/confirm-transferlocation';
PosRoutes.route('/confirm-transferLocation', {
    name: 'pos.confirmTransferLocation',
    title: 'Transfers Request',
    action: function (params, queryParams) {
        Layout.main('Pos_confirmTransferLocation');
    },
    breadcrumb: {
        title: 'Transfers Request',
    }
});
// Location Transfer
import '../imports/ui/pages/locationTransfer.js';
PosRoutes.route('/locationTransfer', {
    name: 'pos.locationTransfer',
    title: __('pos.locationTransfer.title'),
    action: function (params, queryParams) {
        Layout.main('Pos_locationTransfer');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: __('pos.locationTransfer.title'),
        parent: 'pos.home'
    }
});

import '../imports/ui/pages/prepaidOrder.js';
PosRoutes.route('/prepaid-order', {
    name: 'pos.prepaidOrder',
    title: __('pos.prepaidOrder.title'),
    action: function (params, queryParams) {
        Layout.main('Pos_prepaidOrder');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: __('pos.prepaidOrder.title'),
        icon: 'cart-plus',
        parent: 'pos.home'
    }
});

import '../imports/ui/pages/requirePassword.js';
PosRoutes.route('/credit-validation', {
    name: 'pos.creditValidation',
    title: 'Credit Validation',
    action: function (params, queryParams) {
        Layout.main('Pos_requirePassword');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Credit Validation',
        // icon: 'cart-plus',
        parent: 'pos.home'
    }
});

import '../imports/ui/pages/penalty.js';
PosRoutes.route('/penalty', {
    name: 'pos.penalty',
    title: 'Penalty',
    action: function (params, queryParams) {
        Layout.main('Pos_penalty');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Penalty',
        // icon: 'cart-plus',
        parent: 'pos.home'
    }
});


import '../imports/ui/pages/lendingStock.js';
PosRoutes.route('/lending-stock', {
    name: 'pos.lendingStock',
    title: 'LendingStock',
    action: function (params, queryParams) {
        Layout.main('Pos_lendingStock');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'LendingStock',
        // icon: 'cart-plus',
        parent: 'pos.home'
    }
});
import '../imports/ui/pages/paymentTransactionList.js';
PosRoutes.route('/payment-transaction-list', {
    name: 'pos.paymentTransactionList',
    title: 'Receive Payment Transaction',
    action: function (params, queryParams) {
        Layout.main('Pos_paymentTransaction');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Receive Payment Transaction',
        // icon: 'cart-plus',
        parent: 'pos.home'
    }
});
import '../imports/ui/pages/exchangeRingPull.js';
PosRoutes.route('/exchange-ring-pull', {
    name: 'pos.exchangeRingPull',
    title: 'Exchange Ring Pull',
    action: function (params, queryParams) {
        Layout.main('Pos_exchangeRingPull');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Exchange Ring Pull',
        // icon: 'cart-plus',
        parent: 'pos.home'
    }
});
