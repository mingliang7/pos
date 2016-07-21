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
    name: 'pos.',
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