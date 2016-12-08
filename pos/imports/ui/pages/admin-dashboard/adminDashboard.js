import './adminDashboard.html';
import '../../components/loader';

let customerDebt = Template.pos_dashboardCustomerDebt;

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
        console.log(data);
        return data;
    }
});

customerDebt.events({
    'click .goToCustomerTotalCredit'(event,instance){
        let date = moment().endOf('days').format('YYYY-MM-DD HH:mm:ss');
        let url = `/pos/report/customer-total-credit?date=${date}&branchId=${this.branchDoc._id}`;
        FlowRouter.go(url);
    }
});