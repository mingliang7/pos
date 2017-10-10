export const Location = new Mongo.Collection('pos_location');

Location.schema = new SimpleSchema({
    name: {
        type: String,
        index: true
    },
    des: {
        type: String,
        optional: true
    }
});

Location.attachSchema(Location.schema);