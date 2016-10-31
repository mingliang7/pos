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
import '../../core/imports/ui/layouts/report/index.html';

// Group
let PosRoutes = FlowRouter.group({
    prefix: '/pos',
    title: "Simple POS",
    titlePrefix: 'Simple POS > ',
    subscriptions: function (params, queryParams) {
//     this.register('files', Meteor.subscribe('files'));
    }
});

// Customer list
import '../imports/ui/reports/customer.js';
PosRoutes.route('/customer-report', {
    name: 'pos.customerReport',
    title: __('pos.customerReport.title'),
    action: function (params, queryParams) {
        Layout.main('Pos_customerReport');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: __('pos.customerReport.title'),
        icon: 'users',
        parent: 'pos.home'
    }
});

PosRoutes.route('/customer-report-gen', {
    name: 'pos.customerReportGen',
    title: __('pos.customerReport.title'),
    action: function (params, queryParams) {
        Layout.report('Pos_customerReportGen');
    }
});




PosRoutes.route('/order-report-gen', {
    name: 'pos.orderReportGen',
    title: __('pos.orderReport.title'),
    action: function (params, queryParams) {
        Layout.report('Pos_orderReportGen');
    }
});
//main report
import '../imports/ui/reports/main';
PosRoutes.route('/report', {
    name: 'pos.mainReport',
    title: 'Main Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_mainReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Main Report',
        // icon: 'cart-plus',
        parent: 'pos.home'
    }
});

import '../imports/ui/reports/invoice';
PosRoutes.route('/report/invoice', {
    name: 'pos.invoiceReport',
    title: 'Invoice Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_invoiceReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Invoice Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});

import '../imports/ui/reports/invoiceByCustomer';
PosRoutes.route('/report/invoiceByCustomer', {
    name: 'pos.invoiceByCustomerReport',
    title: 'Invoice By Customer Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_invoiceByCustomerReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Invoice By Customer Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});

import '../imports/ui/reports/invoiceByItem';
PosRoutes.route('/report/invoiceByItemReport', {
    name: 'pos.invoiceByItemReport',
    title: 'Invoice By Item Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_invoiceByItemReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Invoice By Item Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});
import '../imports/ui/reports/billByItem';
PosRoutes.route('/report/billByItemReport', {
    name: 'pos.billByItemReport',
    title: 'Bill By Item Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_billByItemReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Bill By Item Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});

import '../imports/ui/reports/payment';
PosRoutes.route('/report/payment', {
    name: 'pos.paymentReport',
    title: 'Receive Payment Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_paymentReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Receive Payment Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});

import '../imports/ui/reports/stockBalance';
PosRoutes.route('/report/stockBalance', {
    name: 'pos.paymentReport',
    title: 'Stock Balance Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_stockBalanceReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Stock Balance Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});


import '../imports/ui/reports/locationTransfer';
PosRoutes.route('/report/locationTransfer', {
    name: 'pos.locationTransferReport',
    title: 'Location Transfer Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_locationTransferReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Location Transfer Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});

import '../imports/ui/reports/ringPullTransfer';
PosRoutes.route('/report/ringPullTransfer', {
    name: 'pos.ringPullTransferReport',
    title: 'Ring Pull Transfer Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_ringPullTransferReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Ring Pull Transfer Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});

import '../imports/ui/reports/billReport';
PosRoutes.route('/report/billReport', {
    name: 'pos.billReport',
    title: 'Bill Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_billReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Bill Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});

import '../imports/ui/reports/billByVendor';
PosRoutes.route('/report/billByVendorReport', {
    name: 'pos.billByVendorReport',
    title: 'Bill By Vendor Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_billByVendorReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Bill By Vendor Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});

import '../imports/ui/reports/prepaidOrderReport';
PosRoutes.route('/report/prepaidOrderReport', {
    name: 'pos.prepaidOrderReport',
    title: 'Prepaid Order Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_prepaidOrderReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Prepaid Order Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});

import '../imports/ui/reports/exchangeRingPull';
PosRoutes.route('/report/exchangeRingPullReport', {
    name: 'pos.exchangeRingPullReport',
    title: 'Exchange Ring Pull Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_exchangeRingPullReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Exchange Ring Pull Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});
import '../imports/ui/reports/lendingStockReport';
PosRoutes.route('/report/lendingStockReport', {
    name: 'pos.lendingStockReport',
    title: 'Lending Stock Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_lendingStockReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Lending Stock Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});
import '../imports/ui/reports/companyExchangeRingPullReport';
PosRoutes.route('/report/companyExchangeRingPullReport', {
    name: 'pos.companyExchangeRingPullReport',
    title: 'Company Exchange Ring Pull Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_companyExchangeRingPullReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Company Exchange Ring Pull Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});

import '../imports/ui/reports/exchangeGratis';
PosRoutes.route('/report/exchangeGratisReport', {
    name: 'pos.exchangeGratisReport',
    title: 'Exchange Gratis Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_exchangeGratisReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Exchange Gratis Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});

import '../imports/ui/reports/saleOrderReport';
PosRoutes.route('/report/saleOrderReport', {
    name: 'pos.saleOrderReport',
    title: 'Sale Order Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_saleOrderReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Sale Order Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});

import '../imports/ui/reports/groupReport';
PosRoutes.route('/report/groupReport', {
    name: 'pos.groupReport',
    title: 'Group Invoice Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_groupReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Group Invoice Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});

import '../imports/ui/reports/groupBillReport';
PosRoutes.route('/report/groupBillReport', {
    name: 'pos.groupBillReport',
    title: 'Group Bill Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_groupBillReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Group Bill Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});

import '../imports/ui/reports/termCustomerBalance';
PosRoutes.route('/report/termCustomerBalance', {
    name: 'pos.termCustomerBalance',
    title: 'Term Customer Balance Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_termCustomerBalance');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Term Customer Balance Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});
import '../imports/ui/reports/groupCustomerBalance';
PosRoutes.route('/report/groupCustomerBalance', {
    name: 'pos.groupCustomerBalance',
    title: 'Group Customer Balance Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_groupCustomerBalance');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Group Customer Balance Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});
import '../imports/ui/reports/receiveItemSummary';
PosRoutes.route('/report/receiveItemSummary', {
    name: 'pos.receiveItemSummary',
    title: 'Receive Item Summary',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_receiveItemSummary');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Receive Item Summary Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});
import '../imports/ui/reports/exchangeRingPullStockBalance';
PosRoutes.route('/report/exchangeRingPullStockBalance', {
    name: 'pos.exchangeRingPullStockBalanceReport',
    title: 'Exchange Ring Pull Stock Balance',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_exchangeRingPullStockBalance');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Exchange Ring Pull Stock Balance',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});

import '../imports/ui/reports/transferMoneyReport';
PosRoutes.route('/report/transferMoneyReport', {
    name: 'pos.transferMoneyReport',
    title: 'Transfer Money Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_transferMoneyReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Transfer Money Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});