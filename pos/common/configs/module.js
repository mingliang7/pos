Module = typeof Module === 'undefined' ? {} : Module;

Module.Pos = {
    name: 'POS System',
    version: '2.0.0',
    summary: 'Simple POS Management System is ...',
    roles: [
        'setting',
        'data-insert',
        'data-update',
        'data-remove',
        'reporter'
    ],
    dump: {
        setting: [
            'pos_location'
        ],
        data: [
            'pos_customer',
            'pos_order'
        ]
    }
};
