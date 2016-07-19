export const correctFieldLabel = function (field) {
    let label = '';
    switch (field) {
        case '_id':
            label = '#ID';
            break;
        case 'customerId':
            label = 'Customer';
            break;
        case 'paymentDate':
            label = 'Date';
            break;
        case 'invoiceId':
            label = '#Invoice';
            break;
        case 'dueAmount':
            label = 'Due Amount';
            break;
        case 'paidAmount':
            label = 'Paid Amount';
            break;
        case 'balanceAmount':
            label = 'Balance Amount';
            break;
        case 'status':
            label = 'Status';
            break;
        case 'paymentType':
            label = 'Payment Status';
            break;
        case 'invoiceDate':
            label = 'Date';
            break;
        case 'total':
            label = 'Total';
            break;
        case 'locationTransferDate':
            label = 'Transfer Date';
            break;
        case 'fromBranchId':
            label = "From Branch";
            break;
        case 'fromUserId':
            label = "From User";
            break;
        case 'fromStockLocationId':
            label = "From Location";
            break;
        case 'toBranchId':
            label = "To Branch";
            break;
        case 'toStockLocationId':
            label = "To Location";
            break;
        case 'toUserId':
            label = "To User";
            break;
    }
    return label;
};