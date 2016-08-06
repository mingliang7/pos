import {checkCreditLimit} from '../../../common/methods/validations/creditLimit.js';
//collection
import {RequirePassword} from '../collections/requirePassword';
import {nullCollection} from '../collections/tmpCollection';
var itemsCollection = nullCollection;
Tracker.autorun(function () {
    if (Session.get('creditLimitAmount' || Session.get('getCustomerId') || Session.get('saleOrderCustomerId'))) {
        let customerId = Session.get('getCustomerId') || Session.get('saleOrderCustomerId');
        checkCreditLimit.callPromise({
            customerId: customerId,
            customerInfo: Session.get('customerInfo'),
            creditLimitAmount: Session.get('creditLimitAmount')
        })
            .then(function (result) {
                let customerInfo = Session.get('customerInfo');
                let requirePassword = RequirePassword.findOne({}, {sort: {_id: -1}});
                if (requirePassword && customerInfo.creditLimit && result > customerInfo.creditLimit) {
                    if ((Session.get('getCustomerId') ? requirePassword.invoiceForm : requirePassword.saleOrderForm) && !_.includes(requirePassword.whiteListCustomer, customerId)) {
                        swal({
                            title: "Password Required!",
                            text: `Balance Amount(${result}) > Credit Limit(${customerInfo.creditLimit}), Ask your Admin for password!`,
                            inputType: "password",
                            type: "input",
                            showCancelButton: true,
                            closeOnConfirm: false,
                            inputPlaceholder: "Type Password"
                        }, function (inputValue) {
                            if (inputValue === false) {
                                // $('.reset-button').trigger('click');
                                itemsCollection.remove({});
                                Session.set("creditLimitAmount", undefined);
                                return false;
                            }
                            if (inputValue === "") {
                                swal.showInputError("You need to input password!");
                                return false
                            } else {
                                let inputPassword = inputValue.trim();
                                if (inputPassword == requirePassword.password) {
                                    swal("Message!", "Successfully", "success");
                                    Session.set("creditLimitAmount", undefined);
                                    return false
                                } else {
                                    // $('.reset-button').trigger('click'); //reset from when wrong
                                    // swal("Message!", "Incorrect Password!", "error");
                                    swal.showInputError("Wrong password!");
                                    return false;
                                }
                            }

                        });
                    }
                }
            })
            .catch(function (err) {
                console.log(err);
            });
    }

})