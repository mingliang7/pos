export default class RangeDate {
    static today() {
        return {start: moment().startOf('days'), end: moment().endOf('days')}
    }

    static yesterday() {
        return {start: moment().subtract(1, 'days').startOf('days'), end: moment().subtract(1, 'days').endOf('days')}
    }

    static last7days() {
        return {start: moment().subtract(7, 'days').startOf('days'), end: moment().endOf('days')};
    }

    static last30days() {
        return {start: moment().subtract(30, 'days').startOf('days'), end: moment().endOf('days')}
    }

    static thisMonth() {
        return {start: moment().startOf('months'), end: moment().endOf('months')}
    }

    static lastMonth() {
        return {
            start: moment().subtract(1, 'months').startOf('months'),
            end: moment().subtract(1, 'months').endOf('months')
        };
    }
}