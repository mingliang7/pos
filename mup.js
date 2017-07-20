module.exports = {
  servers: {
    one: {
      host: '172.104.46.208',
      username: 'root',
      // pem: "/home/rabbit/Downloads/phal-pos.pem"
      password: 'rabbitls$2017'
      // or leave blank for authenticate from ssh-agent
    }
  },

  meteor: {
    name: 'Pos',
    path: '../pos-ls',
    servers: {
      one: {}
    },
    buildOptions: {
      serverOnly: true,
    },
    env: {
      ROOT_URL: 'http://172.104.46.208/',
      MONGO_URL: 'mongodb://localhost/pos'
    },
    dockerImage: 'abernix/meteord:base',
    deployCheckWaitTime: 60
  },

  mongo: {
    oplog: true,
    port: 27017,
    servers: {
      one: {},
    },
  },
};
