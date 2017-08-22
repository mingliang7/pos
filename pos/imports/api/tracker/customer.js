Tracker.autorun(() => {
    let customerId = FlowRouter.query.get('cid');
    if (customerId) {
        Meteor.call('getCustomerBalanceForInvoice', customerId, (err, result) => {
            if (!err) {
                Session.set('customer::customerObj', result);
            }
        });
    }
});

Tracker.autorun(() => {
    let vendorId = FlowRouter.query.get('vid');
    if (vendorId) {
        Meteor.call('getVendorBalance', {vendorId,branchId: Session.get('currentBranch')}, (err, result) => {
            if (!err) {
                Session.set('vendor::vendorObj', result);
            }
        });
    }
});