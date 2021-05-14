// switch (process.env.NODE_ENV || 'dev') {
//     case 'dev':
//         process.env.stripe_back = 'sk_test_4ad295MObZVE1ml0VJHMoZdA';
//         process.env.stripe_front = 'pk_test_4ad23Yb7VDlqRnae1bZpm924';
//         process.env.stripe_connect = 'ca_6MJgNdtusb2FkRrt2y7bluvFm78JwlhQ';
//         process.env.paypal_mode = 'sandbox';
//         process.env.paypal_id = 'AanMbKx4ND4M_aHhiujuh9YCxGyj4n4vzEsQvK4uMPon_YXBh5OuoOHgIIIwdPhZ3Y6ThWzwRRoYhgnQ';
//         process.env.paypal_secret = 'EILEr5kVx-OwUaloMJIfTvmr3UGjI7Fc_oGMzhZ7N-94MCaohB7MH6c_beIty1jfQTSsGHBf-jMd4txB';
//         require('coffee-script');
//         process.env.fbredirecturl = 'http://localhost/auth/facebook/callback';
//         module.exports = require('./app');
//         break;
//
//     case 'test':
//         process.env.fbredirecturl = 'http://test.mechfinder.com/auth/facebook/callback';
//         process.env.stripe_back = 'sk_test_4ad295MObZVE1ml0VJHMoZdA';
//         process.env.stripe_front = 'pk_test_4ad23Yb7VDlqRnae1bZpm924';
//         process.env.stripe_connect = 'ca_6MJg8ltuDmOK1pZ1iautoBorjj9bybO6';
//         process.env.paypal_mode = 'sandbox';
//         process.env.paypal_id = 'AbCFBLk1oWMvx3Peo9BVJ8hsX-3LMkgo6gJsM243Cp9iR_aK9w35KfNkSNXT9VcoG3FTOGKG4DzFdCLP';
//         process.env.paypal_secret = 'EPdr2VKNd5IN-MnFODt5d_WyVt4EuQxcl0a9qK0f75lk4lIj03eI3DLjmxsssWZyoOrU2Qu3K9v7CuDN';
//         require('coffee-script');
//         module.exports = require('./app');
//         break;
//
//     case 'prod':
//         process.env.fbredirecturl = 'http://mechfinder.com/auth/facebook/callback';
//         process.env.stripe_back = 'sk_live_4ad29kxDE3Npguz90nxHI2dW';
//         process.env.stripe_front = 'pk_live_4ad2UAhCLm5aUlNtyhF9d7BT';
//         process.env.stripe_connect = 'ca_6MJg8ltuDmOK1pZ1iautoBorjj9bybO6';
//         process.env.paypal_mode = 'live';
//         process.env.paypal_id = 'AbCFBLk1oWMvx3Peo9BVJ8hsX-3LMkgo6gJsM243Cp9iR_aK9w35KfNkSNXT9VcoG3FTOGKG4DzFdCLP';
//         process.env.paypal_secret = 'EPdr2VKNd5IN-MnFODt5d_WyVt4EuQxcl0a9qK0f75lk4lIj03eI3DLjmxsssWZyoOrU2Qu3K9v7CuDN';
//         module.exports = require('./.build/app');
//         break;
// }
//
// process.env.fbclient = '1696707853876820';
// process.env.fbsecret = '214c653718c4da71e0f5bd7e8b937a01';
// console.log(process.env.NODE_ENV);
