import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';
import {moment} from 'meteor/momentjs:moment';

export const selectReport = new SimpleSchema({
    goToReport: {
        type: String,
        autoform: {
            type: 'select2',
            label: false,
            placeholder: "Select a state"

        }
    }
});
