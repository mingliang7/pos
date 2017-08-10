Tracker.autorun(() => {
    let customerId = FlowRouter.query.get('cid');
    console.log('inside customer auto run', customerId);
    if (customerId) {
        Meteor.call('getCustomerBalanceForInvoice', customerId, (err, result) => {
            if (!err) {
                Session.set('customer::customerObj',result);
            }
        });
    }
});

Tracker.autorun(() => {
    let vendorId = FlowRouter.query.get('vid');
    console.log('inside vendor auto run', vendorId);
    if (vendorId) {
        Meteor.call('getCustomerBalanceForInvoice', vendorId, (err, result) => {
            if (!err) {
                Session.set('vendor::vendorObj',result);
            }
        });
    }
});