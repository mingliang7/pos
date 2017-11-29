export const Pos_resetDataSchema = new SimpleSchema({
    resetOptions: {
        type: String,
        autoform: {
            type: 'select2',
            options(){
                return [
                    {label: 'Reset All', value: 'removeAllData'},
                    {label: 'Reset All Transaction', value: 'removeAllTransaction'}
                ]
            }
        }
    }
});




