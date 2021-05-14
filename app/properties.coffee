module.exports =
    development:
        env: 'development'
        self:
            host: 'localhost'
            port: 3000
            mongo: 'mongodb://127.0.0.1/mechfinder'
            portHTTP: 3001
            secret: '7n8pcsGTM9uOPo42guD0KGQJTg5JTJU8j5tbBbBetiWcxJyyPBbd6GPGTUXbpG1B'
        authy:
            # apiKey: 'f45ec9af9dcb7419dc52b05889c858e9'
            # url: 'http://sandbox-api.authy.com'
            apiKey: 'VUZkB8Ffn2eYVYV1qS2Pdn0JBQXhQz6L'
            url: null
            # marcus' prod api stuff NEEDS CHANGED TO MF ACCOUNT
            # apiKey: 'wPSzqoZz9iHMpsD9eVHH3vj7yfieDdLp'
            # url: undefined
        braintree:
            environment: 'sandbox'
            merchantId: 'j4zf5n6m69jkgprf'
            publicKey: 'gcssp327nppfzbtj'
            privateKey: '63204e27023ec5e619f2004168d77e27'
            merchantAccountId: 'mechfinderllc'
        facebook:
            redirecturl: 'https://localhost:3000/auth/facebook/callback'
            client: '1188373247899388'
            secret: '4d1d77ace8dab45a73f7ea0f760b1bf1'
        paypal:
            mode: 'sandbox'
            id: 'AanMbKx4ND4M_aHhiujuh9YCxGyj4n4vzEsQvK4uMPon_YXBh5OuoOHgIIIwdPhZ3Y6ThWzwRRoYhgnQ'
            secret: 'EILEr5kVx-OwUaloMJIfTvmr3UGjI7Fc_oGMzhZ7N-94MCaohB7MH6c_beIty1jfQTSsGHBf-jMd4txB'
        redis:
            host: 'localhost'
            port: 6379
            ttl: 1000 * 60 * 60 * 24 * 7 * 2
        stripe:
            back: 'sk_test_4ad295MObZVE1ml0VJHMoZdA'
            front: 'pk_test_4ad23Yb7VDlqRnae1bZpm924'
            connect: 'ca_6MJgNdtusb2FkRrt2y7bluvFm78JwlhQ'
        twilio:
            accountSid: 'ACd94d7e3ba5fb236d42fd42e5ab1eca77'
            authToken: '7115b5af46eb42348d753cc7ad27eb13'
        encryption:
            algorithm: 'aes-256-ctr'
            password: 'kdj3@@$#sdDKQQx.'
        root: __dirname
    test:
        env: 'testing'
        self:
            host: 'localhost'
            port: 3000
            portHTTP: 3001
            mongo: 'mongodb://localhost/mechfinder'
            secret: '7n8pcsGTM9uOPo42guD0KGQJTg5JTJU8j5tbBbBetiWcxJyyPBbd6GPGTUXbpG1B'
        authy:
            apiKey: 'f45ec9af9dcb7419dc52b05889c858e9'
            url: 'http://sandbox-api.authy.com'
        braintree:
            environment: 'sandbox'
            merchantId: 'whatever'
            publicKey: 'myPublicKey'
            privateKey: 'myPrivateKey'
            merchantAccountId: 'mechfinderllc'
        facebook:
            redirecturl: 'https://test.mechfinder.com/auth/facebook/callback'
            client: '1188373247899388'
            secret: '4d1d77ace8dab45a73f7ea0f760b1bf1'
        paypal:
            mode: 'sandbox'
            id: 'AbCFBLk1oWMvx3Peo9BVJ8hsX-3LMkgo6gJsM243Cp9iR_aK9w35KfNkSNXT9VcoG3FTOGKG4DzFdCLP'
            secret: 'EPdr2VKNd5IN-MnFODt5d_WyVt4EuQxcl0a9qK0f75lk4lIj03eI3DLjmxsssWZyoOrU2Qu3K9v7CuDN'
        redis:
            host: 'localhost'
            port: 6379
            ttl: 1000 * 60 * 60 * 24 * 7 * 2
        stripe:
            back: 'sk_test_4ad295MObZVE1ml0VJHMoZdA'
            front: 'pk_test_4ad23Yb7VDlqRnae1bZpm924'
            connect: 'ca_6MJg8ltuDmOK1pZ1iautoBorjj9bybO6'
        twilio:
            accountSid: 'ACd94d7e3ba5fb236d42fd42e5ab1eca77'
            authToken: '7115b5af46eb42348d753cc7ad27eb13'
        encryption:
            algorithm: 'aes-256-ctr'
            password: 'kdj3@@$#sdDKQQx.'
        root: __dirname
    production:
        env: 'production'
        self:
            host: 'mechfinder.com'
            port: 3000
            portHTTP: 3001
            mongo: 'mongodb://localhost/mechfinder'
            secret: '7n8pcsGTM9uOPo42guD0KGQJTg5JTJU8j5tbBbBetiWcxJyyPBbd6GPGTUXbpG1B'
        authy:
            apiKey: 'VUZkB8Ffn2eYVYV1qS2Pdn0JBQXhQz6L'
            url: undefined
        braintree:
            environment: 'production'
            merchantId: 'gzmw948bgfp89frw'
            publicKey: 'dj3mq53rwbfz6xjx'
            privateKey: 'ad9678435dd501b3cfa6971ceaae8edf'
            merchantAccountId: 'MechFinderLLC_marketplace'
        facebook:
            redirecturl: 'https://mechfinder.com/auth/facebook/callback'
            client: '1188373247899388'
            secret: '4d1d77ace8dab45a73f7ea0f760b1bf1'
        paypal:
            mode: 'live'
            id: 'AbCFBLk1oWMvx3Peo9BVJ8hsX-3LMkgo6gJsM243Cp9iR_aK9w35KfNkSNXT9VcoG3FTOGKG4DzFdCLP'
            secret: 'EPdr2VKNd5IN-MnFODt5d_WyVt4EuQxcl0a9qK0f75lk4lIj03eI3DLjmxsssWZyoOrU2Qu3K9v7CuDN'
        redis:
            host: 'localhost'
            port: 6379
            ttl: 1000 * 60 * 60 * 24 * 7 * 2
        stripe:
            back: 'sk_live_4ad29kxDE3Npguz90nxHI2dW'
            front: 'pk_live_4ad2UAhCLm5aUlNtyhF9d7BT'
            connect: 'ca_6MJg8ltuDmOK1pZ1iautoBorjj9bybO6'
        twilio:
            accountSid: 'ACd94d7e3ba5fb236d42fd42e5ab1eca77'
            authToken: '7115b5af46eb42348d753cc7ad27eb13'
        encryption:
            algorithm: 'aes-256-ctr'
            password: 'kdj3@@$#sdDKQQx.'
        root: __dirname
