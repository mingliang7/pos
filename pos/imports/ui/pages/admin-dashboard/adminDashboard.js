import './adminDashboard.html';
import '../../components/loader';

let customerDebt = Template.pos_dashboardCustomerDebt;
let dailySaleTmpl = Template.pos_dashboardDailySale;
let dailyStockTmpl = Template.pos_dashboardDailyStock;
customerDebt.onCreated(function () {
    this.customerDebtData = new ReactiveVar({notReady: true, data: {}});
    this.selectDate = new ReactiveVar(moment().endOf('days').toDate());
    this.autorun(() => {
        if (this.selectDate.get()) {
            Meteor.call('dashboard.customerTotalCredit', {date: this.selectDate.get()}, (err, result) => {
                if (result) {
                    this.customerDebtData.set({
                        notReady: false,
                        data: result
                    });
                } else {
                    console.log(err.message);
                }
            });
        }
    });
});

customerDebt.helpers({
    displayAsDate(){
        let instance = Template.instance();
        let date = moment(instance.selectDate.get()).format('YYYY/MM/DD');
        return date;
    },
    customerDebtData(){
        let instance = Template.instance();
        let data = instance.customerDebtData.get();
        return data;
    }
});

customerDebt.events({
    'click .goToCustomerTotalCredit'(event, instance){
        let date = moment().endOf('days').format('YYYY-MM-DD HH:mm:ss');
        let url = `/pos/report/customer-total-credit?date=${date}&branchId=${this.branchDoc._id}`;
        FlowRouter.go(url);
    }
});

dailySaleTmpl.onCreated(function () {
    this.dailySaleData = new ReactiveVar({notReady: true, data: {}});
    this.selectDate = new ReactiveVar(moment().endOf('days').toDate());
    this.autorun(() => {
        if (this.selectDate.get()) {
            Meteor.call('dashboard.dailySale', {date: this.selectDate.get()}, (err, result) => {
                if (result) {
                    this.dailySaleData.set({
                        notReady: false,
                        data: result
                    });
                } else {
                    console.log(err.message);
                }
            });
        }
    });
});
dailySaleTmpl.helpers({
    displayDailyDate(){
        let instance = Template.instance();
        let date = moment(instance.selectDate.get()).format('YYYY/MM/DD');
        return date;
    },
    dailySaleData(){
        let instance = Template.instance();
        let data = instance.dailySaleData.get();
        return data;
    },
    displayQtyByBranch(item){
        let instance = Template.instance();
        let data = instance.dailySaleData.get();
        let concat = '';
        let total = 0;
        data.data.branches.forEach(function (branch) {
            let itemBranch = item.branches.find(x => x._id == branch._id);
            let itemBranchId = itemBranch == null ? '' : itemBranch._id;
            if (branch._id == itemBranchId) {
                concat += `<td>${itemBranch.qty} ${item.itemDoc && item.itemDoc._unit.name || ''}</td>`;
            } else {
                concat += `<td></td>`
            }
        });
        concat += `<td>${item.totalQty} ${item.itemDoc && item.itemDoc._unit.name || ''}</td>`;
        return concat;
    }
});

dailyStockTmpl.onCreated(function () {
    this.dailyStockData = new ReactiveVar({notReady: true, data: {}});
    this.selectDate = new ReactiveVar(moment().endOf('days').toDate());
    this.autorun(() => {
        if (this.selectDate.get()) {
            Meteor.call('dashboard.dailyStock', {date: this.selectDate.get()}, (err, result) => {
                if (result) {
                    this.dailyStockData.set({
                        notReady: false,
                        data: result
                    });
                } else {
                    console.log(err.message);
                }
            });
        }
    });
});

dailyStockTmpl.helpers({
    displayDailyDate(){
        let instance = Template.instance();
        let date = moment(instance.selectDate.get()).format('YYYY/MM/DD');
        return date;
    },
    dailyStockData(){
        let instance = Template.instance();
        let data = instance.dailyStockData.get();
        return data;
    },
    displayQtyByBranch(item){
        let instance = Template.instance();
        let data = instance.dailyStockData.get();
        let concat = '';
        let total = 0;
        console.log(item);
        data.data.branches.forEach(function (branch) {
            let itemBranch = item.lastDoc.find(x => x.branchId == branch._id);
            let itemBranchId = itemBranch == null ? '' : itemBranch.branchId;
            if (branch._id == itemBranchId) {
                concat += `<td>${itemBranch.remainQty} ${item.itemDoc && item.itemDoc._unit.name || ''}</td>`;
            } else {
                concat += `<td></td>`
            }
        });
        concat += `<td>${item.totalRemainQty} ${item.itemDoc && item.itemDoc._unit.name || ''}</td>`;
        return concat;
    }
});