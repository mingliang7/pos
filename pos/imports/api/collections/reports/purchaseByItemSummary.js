export const purchaseByItemSummary = new SimpleSchema({
    type: {
        type: [String],
        optional: true,
        autoform: {
            type: 'select2',
            multiple: true,
            placeholder: 'All',
            options(){
                return [
                    {label: 'Enter Bill', value: 'EnterBills'},
                    {label: 'Stock Transfer', value: 'LocationTransfers'},
                    {label: 'Receive Item', value: 'ReceiveItems'},
                ]
            }
        }
    },
    startDate: {
        type: Date,
        defaultValue: moment().toDate(),
        autoform: {
            afFieldInput: {
                type: "bootstrap-datetimepicker",
                dateTimePickerOptions: {
                    format: 'DD/MM/YYYY',

                }
            }
        }
    },
    endDate: {
        type: Date,
        defaultValue: moment().toDate(),
        autoform: {
            afFieldInput: {
                type: "bootstrap-datetimepicker",
                dateTimePickerOptions: {
                    format: 'DD/MM/YYYY',

                }
            }
        }
    }
});