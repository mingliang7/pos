module.exports = {
  servers: {
    one: {
      host: '172.104.162.237',
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
      /*
        chhay: 172.104.162.237
        leang-srun: 172.104.46.208
      */
      ROOT_URL: 'http://172.104.162.237/',
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
