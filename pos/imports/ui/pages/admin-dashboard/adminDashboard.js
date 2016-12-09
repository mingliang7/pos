import './adminDashboard.html';
import '../../components/loader';

let customerDebt = Template.pos_dashboardCustomerDebt;
let dailySaleTmpl = Template.pos_dashboardDailySale;
customerDebt.onCreated(function () {
    this.customerDebtData = new ReactiveVar({notReady: true, data: {}});
    this.selectDate = new ReactiveVar(moment().toDate());
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
    this.selectDate = new ReactiveVar(moment().toDate());
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