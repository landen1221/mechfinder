var projectHire = {
    user: null,
    project: null,
    braintreeSDK: null,
    braintreeClient: null,

    braintree: {
        nonce: '',
        card: {
            token: '',
            number: '',
            name: '',
            expiration: {
                mm: '',
                yy: ''
            },
            cvc: ''
        }
    },

    targetEstimate: '',
    correctionModals: [],
    skipPhone: false,
    skipSMS: false,

    init: function() {
        console.log('initialized');
        $('.hireSeller').on('click', function(e) {
            projectHire.acceptBid($(this).attr('data-bid'));
        });

        projectHire.user = USER;
        projectHire.project = PROJECT;
        if(util.is.nil(braintree)) {
            // we couldn't grab braintree client sdk for some reason, refresh the page
            window.location.reload(true);
        } else {
            projectHire.braintreeSDK = braintree;
        }

        console.log(projectHire.project.bids);
    },

    getBraintreeClientToken: function(next) {
        next = (typeof(next) === 'function') ? next : function() {};

        var request = $.ajax({
            type: 'GET',
            url: '/api/braintree/clientToken',
            dataType: 'json'
        });

        request.success(function(data) {
            console.log(data);
            if(data.success) {
                return next(data.clientToken);
            } else {
                console.log('Bad client token');
            }
        });

        request.fail(function(jqXHR) {
            console.log(jqXHR);
        });
    },

    estimateWithId: function(estimateId, indexOnly) {
        indexOnly = (typeof indexOnly === 'boolean') ? indexOnly : false;

        var bid;
        for(var i=0; i<projectHire.project.bids.length; i++) {
            bid = projectHire.project.bids[i];
            if(bid._id == estimateId) {
                return (indexOnly) ? i : bid;
            }
        }

        return (indexOnly) ? -1 : null;
    },

    hire: function(estimate) {
        if(!util.is.nil(estimate)) projectHire.targetEstimate = estimate;

        if(projectHire.user.verified) {
            if(projectHire.correctionModals.length > 0) {
                var targetModal = projectHire.correctionModals[0];
                projectHire.correctionModals.shift();

                switch(targetModal.modal) {
                    case 'modalPayment':
                        projectHire.buyerPaymentBox(targetModal.fields);
                        break;
                    case 'modalBilling':
                        projectHire.buyerBillingBox(targetModal.fields);
                        break;
                }
            } else {
                if(projectHire.user.braintree.hasAccount && false) {
                    // if the user has a braintree account, load their stuff
                    console.log('they have an account');
                } else {
                    if(projectHire.user.phone.verified || projectHire.skipPhone || projectHire.user.phone.skip) {
                        // if user has requested to skip phone and the property still isn't set on the user object
                        if(projectHire.skipPhone && !projectHire.user.phone.skip) {
                            var body = {
                                phone: {
                                    skip: true
                                }
                            }

                            var request = $.ajax({
                                type: 'POST',
                                url: '/api/profile',
                                data: body,
                                dataType: 'json'
                            });
                        }

                        if(projectHire.braintree.card.number && projectHire.braintree.card.name && projectHire.braintree.card.expiration.mm && projectHire.braintree.card.expiration.yy && projectHire.braintree.card.cvc || projectHire.braintree.card.token) {
                            if(projectHire.user.billing && projectHire.user.billing.primary && projectHire.user.billing.city && projectHire.user.billing.state && projectHire.user.billing.zip) {
                                
                                if(projectHire.user.braintree.hasAccount) {
                                    if(projectHire.braintree.card.token) {
                                        // they've set a token, use this card
                                        // projectHire.createHireTransaction();
                                        projectHire.submitHire();
                                    } else {
                                        modal.notify({
                                            title: 'Connecting Info',
                                            message: 'We are currently connecting your payment information. This may take a few moments, so thank you for your patience',
                                            canOkay: false,
                                            canExit: false,
                                            loading: true
                                        });

                                        if(util.is.nil(projectHire.braintreeClient)) {
                                            projectHire.getBraintreeClientToken(function(clientToken) {
                                                projectHire.braintreeClient = new projectHire.braintreeSDK.api.Client({clientToken: clientToken});
                                                projectHire.hire();
                                            });
                                        } else {
                                            modal.notify({
                                                title: 'Preparing Card Connection',
                                                message: 'We are currently preparing your card connection. This may take a few moments, so we appreaciate your patience.',
                                                canOkay: false,
                                                canExit: false,
                                                loading: true
                                            });

                                            var braintreeCard = {
                                                number: projectHire.braintree.card.number,
                                                cardholderName: projectHire.braintree.card.name,
                                                expirationMonth: projectHire.braintree.card.expiration.mm,
                                                expirationYear: projectHire.braintree.card.expiration.yy,
                                                cvv: projectHire.braintree.card.cvc,
                                                billingAddress: {postalCode: projectHire.user.billing.zip}
                                            }

                                            projectHire.braintreeClient.tokenizeCard(braintreeCard, function(err, nonce) {
                                                if(!util.is.nil(err)) {
                                                    // we need to update this
                                                    projectHire.buyerPaymentBox();
                                                } else {
                                                    projectHire.braintree.nonce = nonce;
                                                    // projectHire.submitHire();
                                                    // projectHire.createHireTransaction();
                                                    projectHire.submitHire();
                                                }
                                            });
                                        }
                                    }
                                } else {
                                    projectHire.addBraintreeCustomer();
                                }
                            } else {
                                projectHire.buyerBillingBox();
                            }
                        } else {
                            if(projectHire.user.braintree.hasAccount) {
                                // if they have an account, load any credit cards they have
                                projectHire.getBraintreeCreditCards();
                            } else {
                                // if they don't have an account, start by collecting payment info
                                projectHire.buyerPaymentBox();
                            }
                        }
                    } else {
                        if(util.is.nil(projectHire.user.phone.number)) {
                            projectHire.phoneNumberBox();
                        } else {
                            if(util.is.nil(projectHire.user.phone.kind)) {
                                projectHire.phoneKindBox();
                            } else {
                                if((!projectHire.user.phone.sms || util.is.nil(projectHire.user.phone.sms)) && projectHire.user.phone.kind === 'Mobile' && !projectHire.skipSMS) {
                                    projectHire.phoneSMSBox();
                                } else {
                                    projectHire.phoneVerificationBox();
                                    // projectHire.phoneVerificationEntry();
                                }
                            }
                        }
                    }
                }
            }
        } else {
            // user is not verified
            projectHire.requestEmailVerification(function() {
                projectHire.emailVerificationBox();
            });
        }
    },

    getBraintreeCreditCards: function() {
        modal.notify({
            title: 'Loading Payment Methods',
            message: 'We are currently loading your payment methods. This may take a few moments, so thank you for your patience',
            canExit: false,
            canOkay: false,
            loading: true
        });

        var request = $.ajax({
            type: 'GET',
            url: '/api/braintree/paymentMethods',
            dataType: 'json',
            cache: false
        });

        request.fail(function(jqXHR) {
            console.log(jqXHR);
            console.log(jqXHR.responseJSON);
            modal.notify({
                title: 'Error Loading Data',
                message: 'There was an error while getting your credit card information. Please refresh the page to try again. If this error persists, please contact us so that we can resolve the issue as quickly as possible.'
            });
        });

        request.done(function(creditCards) {
            if(creditCards.length > 0) {
                var options = [];
                var card;
                for(var i=0; i<creditCards.length; i++) {
                    card = creditCards[i];
                    options.push({
                        label: (card.cardType || 'Card') + ' ending in ' + card.last4,
                        value: card.token
                    });
                }

                options.push({
                    label: 'Create new payment method',
                    value: ''
                });

                modal.select({
                    title: 'Saved Payment Methods',
                    message: 'Choose one of your payment methods below or create a new one:',
                    options: options,
                    submitText: 'Continue',
                    allowEmptyValues: true,
                    cancel: function() {
                        projectHire.cancelHire();
                    },
                    submit: function(token) {
                        var braintreeCard;
                        for(var i=0; i<creditCards.length; i++) {
                            if(creditCards[i].token == token) {
                                braintreeCard = creditCards[i];
                                break;
                            }
                        }

                        if(!util.is.nil(braintreeCard)) {
                            projectHire.braintree.card.token = braintreeCard.token;
                            projectHire.hire();
                        } else {
                            // they must have selected a new card
                            projectHire.buyerPaymentBox();
                        }
                    }
                });
            } else {
                projectHire.buyerPaymentBox();
            }

        });
    },

    acceptBid: function(estimateId) {
        var estimate = projectHire.estimateWithId(estimateId);

        if(!util.is.nil(estimate)) {
            // show the estimate here
            if(projectHire.project.diagnosis) {
                modal.diagnosisEstimate({
                    title: 'Diagnosis Breakdown',
                    message: 'Please confirm the diagnosis fee below before continuing:',
                    project: projectHire.project,
                    user: projectHire.user,
                    estimate: estimate,
                    accept: function() {
                        projectHire.hire(estimate);
                    },
                    exit: function() {
                        projectHire.cancelHire();
                    }
                })
            } else {
                modal.estimate({
                    title: 'Confirm Estimate',
                    message: 'Estimate by: <a href="/profile/' + estimate.owner._id + '" target="_blank">' + estimate.owner.username + '</a><br /><br />If you want to hire the mechanic for this estimate, click the Hire button at the bottom of this workorder:',
                    user: projectHire.user,
                    project: projectHire.project,
                    estimate: estimate,
                    accept: function() {
                        projectHire.hire(estimate);
                    },
                    cancel: function() {
                        projectHire.cancelHire();
                    }
                });
            }
        } else {
            modal.notify({
                title: 'Error',
                message: 'There was an error while hiring this mechanic. Refresh the page and try again. If this error persists, please contact us so that we can resolve the issue as soon as possible.'
            });
        }
    },

    submitHire: function(next) {
        next = (typeof next === 'function') ? next : function() {};

        var estimate = projectHire.targetEstimate;
        var nonce = projectHire.braintree.nonce;

        var body = {
            projectId: projectHire.project._id,
            bidId: estimate._id,
            discount: estimate.discount,
            discountId: estimate.discountId
        };

        modal.notify({
            title: 'Hiring Mechanic',
            message: 'We are letting your mechanic know that you have hired them on. This may take a few moments, so thank you for your patience.',
            canExit: false,
            canOkay: false,
            loading: true
        });

        var request = $.ajax({
            type: 'POST',
            url: '/api/project/' + projectHire.project._id + '/hire',
            data: body,
            dataType: 'json'
        });

        request.fail(function(jqXHR) {
            console.log(jqXHR);
            modal.notify({
                title: 'Error',
                message: 'There was a problem while hiring your mechanic. MechFinder is working as quickly as possible to resolve this issue, and apologizes for any inconvenience.'
            });
        });

        request.done(function(data) {
            projectHire.project = data.project;
            projectHire.targetEstimate = data.bid;

            projectHire.createHireTransaction();
        });
    },

    saveCardInfo: function(card) {
        card = (!util.is.nil(card)) ? card : projectHire.braintree.card;

        // make sure none of the required card fields are nil before doing anything
        if(!util.is.nil([
            card.number,
            card.name,
            card.expiration.mm,
            card.expiration.yy,
            card.cvc,
            projectHire.user.billing.zip
        ])) {
            var braintreeCard = {
                number: card.number,
                cardholderName: card.name,
                expirationMonth: card.expiration.mm,
                expirationYear: card.expiration.yy,
                cvv: card.cvc,
                billingAddress: {postalCode: projectHire.user.billing.zip}
            }

            projectHire.braintreeClient.tokenizeCard(braintreeCard, function(err, nonce) {
                if(util.is.nil(err)) {
                    // submit the nonce to the api
                    var body = {
                        nonce: nonce
                    }

                    var request = $.ajax({
                        type: 'POST',
                        url: '/api/braintree/createPaymentMethod',
                        data: body,
                        dataType: 'json'
                    });

                    request.done(function(data) {
                    });

                    request.fail(function(jqXHR) {
                        console.log(jqXHR);
                        console.log(jqXHR.responseJSON);
                    });
                }
            });
        }
    },

    createHireTransaction: function() {
        var nonce = projectHire.braintree.nonce;
        var projectId = projectHire.project._id;
        var estimateId = projectHire.targetEstimate._id;
        var token = projectHire.braintree.card.token;

        var body = {
            project: projectId,
            estimate: estimateId,
            nonce: nonce,
            token: token
        }

        modal.notify({
            title: 'Retrieving Funds',
            message: 'We are currently retreiving your funds and placing them in escrow. Your funds will be held there until the job is completed. This may take a few moments, so thank you for your patience.',
            canExit: false,
            canOkay: false,
            loading: true
        });

        var request = $.ajax({
            type: 'POST',
            url: '/api/braintree/createEstimateTransaction',
            data: body,
            dataType: 'json'
        });

        request.done(function(data) {
            if(projectHire.braintree.card.save) {
                // user has opted to save their card info (will do this asyncronously)
                projectHire.saveCardInfo(projectHire.braintree.card);
            }
            
            modal.notify({
                title: 'Mechanic Hired',
                message: 'Your mechanic has been hired successfully. You should be contacted shortly by the mechanic to set up a time to work on your vehicle.',
                okay: function() {
                    window.location.reload(true);
                },
                exit: function() {
                    window.location.reload(true);
                }
            });
        });

        request.fail(function(jqXHR) {
            console.log(jqXHR);
            console.log(jqXHR.responseJSON);

            var braintreeErrors = jqXHR.responseJSON.braintreeErrors;

            var unknownError = false;
            if($.isArray(braintreeErrors) && braintreeErrors.length > 0) {
                var fields = [];
                for(var i=0; i<braintreeErrors.length; i++) {
                    switch(braintreeErrors[i].code) {
                        case '91744':
                            // bad/missing billing address
                            fields.push({
                                modal: 'modalBilling',
                                field: 'modalBillingPrimary'
                            });
                            break;
                        case '81723':
                            // bad/missing cardholder name
                            fields.push({
                                modal: 'modalPayment',
                                field: 'modalPaymentNameOnCard'
                            });
                            break;
                        case '81706':
                        case '81707':
                        case '81736':
                            // bad/missing cvv/cvc
                            fields.push({
                                modal: 'modalPayment',
                                field: 'modalPaymentCVC'
                            });
                            break;
                        case '81709':
                        case '81710':
                        case '81711':
                        case '81712':
                        case '81713':
                            // bad/missing expiration date
                            fields.push({
                                modal: 'modalPayment',
                                field: 'modalPaymentMM'
                            });
                            fields.push({
                                modal: 'modalPayment',
                                field: 'modalPaymentYY'
                            });
                            break;
                        case '81714':
                        case '81715':
                        case '81716':
                        case '81717':
                            // bad/missing cc
                            fields.push({
                                modal: 'modalPayment',
                                field: 'modalPaymentCard'
                            });
                            break;
                        case '81724':
                            // duplicate card exists (will handle this later)
                            // break;
                        default:
                            // Unknown error occurred
                            unknownError = true;
                            break;
                    }

                    if(unknownError) break;
                }

                if(!unknownError) projectHire.fixBuyerBraintreeErrors(fields);
            } else {
                unknownError = true;
            }

            if(unknownError) {
                modal.notify({
                    title: 'Transaction Error',
                    message: 'An unknown error has occured while trying hire your mechanic. Refresh the page and try to hire your mechanic again. If this error persists, please contact us so we can resolve the issue as quickly as possible.'
                });
            }
        });
    },

    fixBuyerBraintreeErrors: function(fields) {
        // combine fields that come from the same modal into a single array item
        // (so we can call a modal and highlight all fields at once)
        var modals = [];
        for(var i=0; i<fields.length; i++) {
            if(modals.length > 0) {
                for(var c=0; c<modals.length; c++) {
                    if(modals[c].modal == fields[i].modal) {
                        // the modal has already been flagged for showing
                        modals[c].fields.push(fields[i].field);
                    } else {
                        // the modal has not been flagged for showing
                        modals.push({
                            modal: fields[i].modal,
                            fields: [fields[i].field]
                        });
                    }
                }
            } else {
                modals.push({
                    modal: fields[i].modal,
                    fields: [fields[i].field]
                });
            }
        }

        projectHire.correctionModals = modals;
        projectHire.hire();
    },

    cancelHire: function() {
        modal.notify({
            title: 'Canceled',
            message: 'You have decided to cancel hiring this mechanic. Because no mechanic has been hired yet on this job, feel free to continue looking through estimates to pick the mechanic that is right for you'
        });
    },

    addBraintreeCustomer: function() {
        modal.notify({
            title: 'Connecting Account',
            message: 'We are currently connecting your account to our escrow systems. This may take up to 15 minutes, so thank you for your patience.',
            canExit: false,
            canOkay: false,
            loading: true
        });

        var request = $.ajax({
            type: 'POST',
            url: '/api/braintree/createUser',
            data: {},
            dataType: 'json'
        });

        request.fail(function(jqXHR) {
            console.log(jqXHR);
            console.log(jqXHR.responseJSON);

            modal.notify({
                title: 'Unknown Error',
                message: 'An unknown error has occured while trying to hire your mechanic. Refresh the page and try to hire again. If this error persists, please contact us so we can resolve the issue as quickly as possible'
            });
        });

        request.done(function(data) {
            projectHire.user = data.user;
            projectHire.hire();
        });
    },

    buyerBillingBox: function(fields) {
        fields = $.isArray(fields) ? fields : [];
        var message = (fields.length > 0) ? 'Please correct the highlighted fields in order to hire a mechanic:' : '';

        modal.billing({
            message: message,
            fields: fields,
            submitText: 'Continue',
            cancel: function() {
                projectHire.cancelHire();
            },
            submit: function(info) {
                modal.notify({
                    title: 'Saving Your Info',
                    message: 'MechFinder is saving your updated information. This may take a few moments, so thank you for your patience.',
                    canExit: false,
                    canOkay: false,
                    loading: true
                });

                var body = {
                    billing: info
                }

                var request = $.ajax({
                    type: 'POST',
                    url: '/api/profile',
                    data: body,
                    dataType: 'json'
                });

                request.fail(function(jqXHR) {
                    console.log(jqXHR);
                    modal.notify({
                        title: 'Submission Error',
                        message: 'There was an error while saving your information. MechFinder is working as fast as possible to resolve this issue. Thank you for your patience.'
                    });
                });

                request.done(function(user) {
                    projectHire.user = user;
                    projectHire.hire();
                });
            }
        });
    },

    buyerPaymentBox: function(fields) {
        modal.payment({
            fields: fields,
            submit: function(card) {
                projectHire.braintree.card = card;
                projectHire.hire();
            },
            cancel: function() {
                projectHire.cancelHire();
            }
        });
    },

    emailVerificationBox: function() {
        modal.input({
            title: 'Email Verification',
            message: 'A notification has been sent to your email with a verification code. Copy the code into the box below in order to verify your email. <a id="resendEmailVerification" href="javascript:void(0);">Resend My Verification Code</a>',
            submit: function(code) {
                projectHire.checkEmailVerification(code, function() {
                    // once they're verified, re-call the place estimate function
                    projectHire.hire();
                });
            }
        });

        $('#resendEmailVerification').off('click').on('click', function(e) {
            projectHire.requestEmailVerification(function() {
                modal.input({
                    title: 'Email Verification',
                    message: 'We have re-sent a notification to your email with a verification code. Copy the code into the box below in order to verify your email.',
                    submit: function(code) {
                        projectHire.checkEmailVerification(code, function() {
                            // once they're verified, re-call the place estimate function
                            projectHire.hire();
                        });
                    }
                });
            });
        });
    },

    checkEmailVerification: function(code, next) {
        if(typeof(next) !== 'function') next = function(){};

        modal.notify({
            title: 'Checking Verification Code',
            message: 'We are checking the verification code with your account. This may take a few moments; thank you for your patience.',
            canExit: false,
            canOkay: false,
            loading: true
        });

        var body = {
            email: projectHire.user.email
        }

        var request = $.ajax({
            type: 'POST',
            url: '/api/verify/email/' + code,
            data: body,
            dataType: 'json'
        });

        request.done(function(user) {
            projectHire.user = user;
            next();
        });

        request.fail(function(jqXHR) {
            console.log(jqXHR);
            switch(jqXHR.responseJSON.err) {
                case 'Incorrect validation code':
                    modal.notify({
                        title: 'Incorrect Code',
                        message: 'The validation code that you have entered was incorrect. Please <a href="/contact">contact us</a> if this problem persists.',
                        condensed: false,
                        okayText: 'Try Again',
                        okay: function() {
                            projectHire.emailVerificationBox();
                        }
                    });
                    break;
                case 'Validation code expired':
                    modal.notify({
                        title: 'Code Expired',
                        message: 'The validation code that you have entered has expired. To confirm you email address, you may <a id="requestNewEmailVerification" href="javascript:void(0);">request a new code</a>.',
                        condensed: false
                    });

                    $('#requestNewEmailVerification').off('click').on('click', function(e) {
                        projectHire.requestEmailVerification(function() {
                            projectHire.emailVerificationBox();
                        });
                    });
                    break;
                default:
                    modal.notify({
                        title: 'Verification Error',
                        message: 'There was an error while verifying your account. MechFinder is working as fast as possible to resolve this issue. Thank you for your patience.',
                        condensed: false
                    });
                    break;
            }
        });
    },

    requestEmailVerification: function(next) {
        if(typeof(next) !== 'function') next = function(){};

        modal.notify({
            title: 'Email Verification Sending',
            message: 'We are sending your email verification code now. If you do not see the code in your inbox, try checking your junk or spam filters as well.',
            canExit: false,
            canOkay: false,
            loading: true
        });

        var body = {
            email: projectHire.user.email
        }

        var request = $.ajax({
            type: 'POST',
            url: '/api/verify/email',
            data: body,
            dataType: 'json'
        });

        request.done(function(data) {
            next(data);
        });

        request.fail(function(jqXHR) {
            console.log(jqXHR);
            modal.notify({
                title: 'Verification Error',
                message: 'There was an error while verifying your account. MechFinder is working as fast as possible to resolve this issue. Thank you for your patience.',
                condensed: false
            });
        });
    },

    phoneVerificationEntry: function(via) {
        modal.input({
            title: 'Phone Verification Code',
            message: 'We have ' + ((via == 'sms') ? 'messaged you' : 'called you') + ' with your verification code. Please enter the code in the box below: ',
            submit: function(code) {
                modal.notify({
                    title: 'Checking Verification',
                    message: 'We are checking the verification code you have entered now. This may take a few moments, so MechFinder appreciates your patience.',
                    canExit: false,
                    canOkay: false,
                    loading: true
                });

                var body = {
                    phoneNumber: projectHire.user.phone.number,
                    verificationCode: code
                }

                var request = $.ajax({
                    type: 'POST',
                    url: '/api/verify/verifyToken',
                    data: body,
                    dataType: 'json'
                });

                request.fail(function(jqXHR) {
                    console.log(jqXHR);
                    if(jqXHR.responseJSON.err == 'Incorrect pin') {
                        modal.notify({
                            title: 'Incorrect Pin',
                            message: 'The verification pin you have entered is incorrect. If this problem persists, please <a href="/contact">contact us</a> at your convenience.',
                            okayText: 'Try Again',
                            okay: function() {
                                projectHire.phoneVerificationEntry(via);
                            }
                        });
                    } else if(jqXHR.responseJSON.err == 'Too many attempts') {
                        modal.notify({
                            title: 'Incorrect Pin',
                            message: 'You have reached the maximum number of attempts to verify your phone number. In the mean time, your bid can still be placed and you can still be hired, but customers will not be given your phone number until it is verified.',
                            okayText: 'Continue',
                            okay: function() {
                                projectHire.skipPhone = true;
                                projectHire.hire();
                            }
                        });
                    } else {
                        modal.notify({
                            title: 'Submission Error',
                            message: 'There was an error while checking your verification code. MechFinder is working as fast as possible to resolve this issue. Thank you for your patience.',
                            condensed: false
                        });
                    }
                });

                request.done(function(user) {
                    projectHire.user = user;
                    projectHire.hire();
                });
            },
            cancel: function() {
                projectHire.skipPhone = true;
                projectHire.hire();
            },
            exit: function() {
                projectHire.cancelHire();
            },
            cancelOnExit: false,
            cancelText: 'Skip'
        });
    },

    phoneVerificationBox: function() {
        var sendRequest = function(method) {
            modal.notify({
                title: 'Sending Verification',
                message: 'We are sending you a verification code now. This may take a few moments, so MechFinder appreciates your patience.',
                canExit: false,
                canOkay: false,
                loading: true
            });

            var body = {
                phone: projectHire.user.phone,
                method: method
            }

            var request = $.ajax({
                type: 'POST',
                url: '/api/verify/sendToken',
                data: body,
                dataType: 'json'
            });

            request.fail(function(jqXHR) {
                console.log(jqXHR);
                modal.notify({
                    title: 'Submission Error',
                    message: 'There was an error while sending you a verification code. MechFinder is working as fast as possible to resolve this issue. Thank you for your patience.',
                    condensed: false
                });
            });

            request.done(function(data) {
                projectHire.phoneVerificationEntry(method);
            });
        }

        modal.confirm({
            title: 'Phone Verification',
            message: 'In order to verify your phone number, we will send you a text or a call to make sure this phone is yours. Please click whichever method is most convenient to you below:',
            noText: 'Send me a Text',
            yesText: 'Give me a Call',
            noColor: 'green',
            fixedButtons: false,
            cancelOnExit: false,
            canNo: (projectHire.user.phone.sms && projectHire.user.phone.smsCharges),
            no: function() {
                sendRequest('sms');
            },
            yes: function() {
                sendRequest('call');
            },
            exit: function() {
                projectHire.cancelHire();
            }
        });
    },

    phoneSMSBox: function() {
        var sendRequest = function(sms, smsCharges) {
            modal.notify({
                title: 'Saving Preferences',
                message: 'We are saving your phone preferences. This may take a few moments, so thank you for your patience.',
                canOkay: false,
                canExit: false,
                loading: true
            });

            var body = {
                phone: {
                    sms: sms,
                    smsCharges: smsCharges
                }
            }

            var request = $.ajax({
                type: 'POST',
                url: '/api/profile',
                data: body,
                dataType: 'json'
            });

            request.fail(function(jqXHR) {
                console.log(jqXHR);
                modal.notify({
                    title: 'Submission Error',
                    message: 'There was an error while updating your account info. MechFinder is working as fast as possible to resolve this issue. Thank you for your patience.',
                    condensed: false
                });
            });

            request.done(function(user) {
                projectHire.user = user;
                projectHire.skipSMS = true;
                projectHire.hire();
            });
        }

        modal.confirm({
            title: 'SMS Notifications',
            message: 'Would you like to turn on SMS notifications? By clicking "Yes", you are agreeing that you understand that carrier charges may apply.',
            yes: function() {
                sendRequest(true, true);
            },
            no: function() {
                sendRequest(false, false);
            },
            exit: function() {
                projectHire.cancelHire();
            }
        });
    },

    phoneKindBox: function() {
        modal.select({
            title: 'Phone Type',
            message: 'Please select the type of device associated with your phone number: ',
            condensed: true,
            cancelText: 'Skip',
            cancelOnExit: false,
            options: ['Mobile', 'Landline'],
            cancel: function() {
                projectHire.skipPhone = true;
                projectHire.hire();
            },
            exit: function() {
                projectHire.cancelHire();
            },
            submit: function(kind) {
                modal.notify({
                    title: 'Saving Phone Kind',
                    message: 'We are updating your account with the type of phone that you have selected. Thank you for your patience.',
                    canOkay: false,
                    canExit: false,
                    loading: true
                });

                var body = {
                    phone: {
                        kind: kind
                    }
                }

                var request = $.ajax({
                    type: 'POST',
                    url: '/api/profile',
                    data: body,
                    dataType: 'json'
                });

                request.fail(function(jqXHR) {
                    console.log(jqXHR);
                    modal.notify({
                        title: 'Submission Error',
                        message: 'There was an error while updating your account info. MechFinder is working as fast as possible to resolve this issue. Thank you for your patience.',
                        condensed: false
                    });
                });

                request.done(function(user) {
                    projectHire.user = user;
                    projectHire.hire();
                });
            }
        });
    },

    phoneNumberBox: function(message) {
        var otherRole = (!util.is.nil(projectHire.user) && projectHire.user.role == 'buyer') ? 'mechanics' : 'customers';
        message = (util.is.nil(message)) ? 'Add a phone number here for ' + otherRole + ' to reach you: ' : message;

        modal.input({
            title: 'Phone Number',
            message: message,
            placeholder: 'XXX-XXX-XXXX',
            condensed: true,
            cancelText: 'Skip',
            cancelOnExit: false,
            cancel: function() {
                projectHire.skipPhone = true;
                projectHire.hire();
            },
            exit: function() {
                projectHire.cancelHire();
            },
            submit: function(num) {
                modal.notify({
                    title: 'Saving Phone Number',
                    message: 'We are updating your account with the phone number you have entered. Thank you for your patience.',
                    canOkay: false,
                    canExit: false,
                    loading: true
                });

                number = num.replace(/\D/g, '');
                if(util.is.nil(number) || number.length != 10) {
                    projectHire.phoneNumberBox('The phone number you have entered is invalid. Valid phone numbers should contain ten (10) numeric digits including your area code. Please re-enter your phone number to continue: ');
                } else {
                    var body = {
                        phone: {
                            number: number
                        }
                    }

                    var request = $.ajax({
                        type: 'POST',
                        url: '/api/profile',
                        data: body,
                        dataType: 'json'
                    });

                    request.fail(function(jqXHR) {
                        console.log(jqXHR);
                        modal.notify({
                            title: 'Submission Error',
                            message: 'There was an error while updating your account info. MechFinder is working as fast as possible to resolve this issue. Thank you for your patience.',
                            condensed: false
                        });
                    });

                    request.done(function(user) {
                        projectHire.user = user;
                        projectHire.hire();
                    });
                }
            }
        });
    },
};

$(document).ready(function(e) {
    projectHire.init();
});
