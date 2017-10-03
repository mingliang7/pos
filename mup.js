module.exports = {
  servers: {
    one: {
      host: '172.104.183.152',
      username: 'root',
      // pem: "/home/rabbit/Downloads/phal-pos.pem"
      password: 'rabbit$2017$'
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
      ROOT_URL: 'http://172.104.183.152/',
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
