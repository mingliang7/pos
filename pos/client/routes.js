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
  action: function(params, queryParams){
    Layout.main('Pos_term');
  },
  breadcrumb: {
    title: 'term',
    icon: 'cart-plus',
    parent: 'pos.home'
  }
})
