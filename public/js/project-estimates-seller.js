var sellerEstimates = {
    user: null,
    project: null,
    estimate: null,
    skipPhone: false,

    init: function() {
        if(util.is.nil(USER) || util.is.nil(PROJECT) || util.is.nil(braintree)) { 
            window.location.reload(true);
        } else {
            sellerEstimates.user = USER;
            sellerEstimates.project = PROJECT;
            sellerEstimates.braintree.sdk = braintree;

            sellerEstimates.clicks.init();

            var rateUrl = util.url.paramsToObject()['rateCustomer'];
            if(rateUrl) {
                sellerEstimates.rateCustomer();
            }
        }
    },

    estimateWithId: function(estimateId, indexOnly) {
        indexOnly = (typeof indexOnly === 'boolean') ? indexOnly : false;

        var bid;
        for(var i=0; i<sellerEstimates.project.bids.length; i++) {
            bid = sellerEstimates.project.bids[i];
            if(bid._id == estimateId) {
                return (indexOnly) ? i : bid;
            }
        }

        return (indexOnly) ? -1 : null;
    },

    estimateWithUserId: function(userId, state, indexOnly) {
        state = (typeof state === 'string') ? state : 'bidding';
        indexOnly = (typeof indexOnly === 'boolean') ? indexOnly : false;

        var estimate = null;
        for(i=0; i<sellerEstimates.project.bids.length; i++) {
            bid = sellerEstimates.project.bids[i];
            if(bid.owner._id == userId && bid.state == 'submitted') {
                estimate = bid;
                break;
            }
        }

        return estimate;
    },

    clicks: {
        clicked: {
            offerDiagnosis: false,
            editDiagnosis: false,
            offerWorkorder: false,
            editWorkorder: false,
            cancelEstimate: false,
            emailVerification: false,
            rateCustomer: false
        },

        init: function() {
            $('.offerDiagnosis').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove' && !sellerEstimates.clicks.clicked.offerDiagnosis) {
                    sellerEstimates.clicks.clicked.offerDiagnosis = true;
                    setTimeout(function() {
                        sellerEstimates.clicks.clicked.offerDiagnosis = false;
                    }, 300);

                    mfMixpanel.track('Estimate Initiated', {'Is Diagnosis': true});
                    sellerEstimates.offerDiagnosis();
                }
            });

            $('.editDiagnosis').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove' && !sellerEstimates.clicks.clicked.editDiagnosis) {
                    sellerEstimates.clicks.clicked.editDiagnosis = true;
                    setTimeout(function() {
                        sellerEstimates.clicks.clicked.editDiagnosis = false;
                    }, 300);

                    sellerEstimates.editDiagnosis();
                }
            });

            $('.offerWorkorder').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove' && !sellerEstimates.clicks.clicked.offerWorkorder) {
                    sellerEstimates.clicks.clicked.offerWorkorder = true;
                    setTimeout(function() {
                        sellerEstimates.clicks.clicked.offerWorkorder = false;
                    }, 300);

                    mfMixpanel.track('Estimate Initiated', {'Is Diagnosis': false});
                    sellerEstimates.offerWorkorder();
                }
            });

            $('.editWorkorder').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove' && !sellerEstimates.clicks.clicked.editWorkorder) {
                    sellerEstimates.clicks.clicked.editWorkorder = true;
                    setTimeout(function() {
                        sellerEstimates.clicks.clicked.editWorkorder = false;
                    }, 300);

                    sellerEstimates.editWorkorder();
                }
            });

            $('.cancelEstimate').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove' && !sellerEstimates.clicks.clicked.cancelEstimate) {
                    sellerEstimates.clicks.clicked.cancelEstimate = true;
                    setTimeout(function() {
                        sellerEstimates.clicks.clicked.cancelEstimate = false;
                    }, 300);

                    sellerEstimates.cancelEstimate($(this).attr('data-bid'));
                }
            });

            $('.rateCustomer').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove' && !sellerEstimates.clicks.clicked.rateCustomer) {
                    sellerEstimates.clicks.clicked.rateCustomer = true;
                    setTimeout(function() {
                        sellerEstimates.clicks.clicked.rateCustomer = false;
                    }, 300);

                    sellerEstimates.rateCustomer();
                }
            });

            $('#resendEmailVerification').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove' && !sellerEstimates.clicks.clicked.emailVerification) {
                    sellerEstimates.clicks.clicked.emailVerification = true;
                    setTimeout(function() {
                        sellerEstimates.clicks.clicked.emailVerification = false;
                    }, 300);

                    sellerEstimates.email.request();
                }
            });
        }
    },

    rateCustomer: function(reload) {
        reload = (typeof reload === 'boolean') ? reload : false;

        if(!sellerEstimates.project.buyerRated) {
            modal.rating({
                targetRole: 'buyer',
                cancel: function() {
                    if(reload) window.location.reload(true)
                },
                submit: function(rating, feedback) {
                    modal.notify({
                        title: 'Sending Rating',
                        message: 'We currently saving your rating. This may take a few moments, so thank you for your patience.',
                        canOkay: false,
                        canExit: false
                    });

                    var body = {
                        rating: rating,
                        feedback: feedback
                    }

                    var request = $.ajax({
                        type: 'POST',
                        url: '/api/project/' + sellerEstimates.project._id + '/rate',
                        data: body,
                        dataType: 'json'
                    });

                    request.done(function(rating) {
                        modal.notify({
                            title: 'Rated',
                            message: 'Your rating has been sent! Thank you for using MechFinder',
                            okay: function() {
                                window.location.reload(true);
                            },
                            cancel: function() {
                                window.location.reload(true);
                            }
                        });
                    });

                    request.fail(function(jqXHR) {
                        console.log(jqXHR);
                        modal.notify({
                            title: 'Unable to Rate',
                            message: 'There was an issue while rating your customer. If the rating did not go through, you will be able to rate your customer at a later time. If this error persists, please contact us.',
                            okay: function() {
                                window.location.reload(true);
                            },
                            cancel: function() {
                                window.location.reload(true);
                            }
                        });
                    });
                }
            });
        }
    },

    offerDiagnosis: function() {
        if(sellerEstimates.user.seenDiagnosisProcess) {
            modal.diagnosisEstimate({
                project: sellerEstimates.project,
                user: sellerEstimates.user,
                edit: true,
                place: function(estimate) {
                    sellerEstimates.place(estimate);
                }
            });
        } else {
            sellerEstimates.showDiagnosisProcess();
        }
    },

    showDiagnosisProcess: function() {
        console.log('showing diagnosis process');
        var html = [
            'Please confirm that you reviewed the MechFinder Diagnosis Process before continuing<br />',
            '<ol>',
                '<li>Place your diagnosis price</li>',
                '<li>If hired: Contact customer &amp; identify a time &amp; location to complete diagnosis.</li>',
                '<li>To receive payment, you are required to complete the diagnosis form on MechFinder.com.</li>',
            '</ol><br /><br />',
            'You will be asked to:<br />',
            '<ul>',
                '<li>Describe immediate problem that needs fixed</li>',
                '<li>Suggest repairs that need attention</li>',
                '<li>Offer your estimate for the repair (optional)</li>',
            '</ul><br /><br />',
            'You will always receive payment immediately following your diagnosis. ',
            'If you choose to waive that fee if hired, it will be automatically discounted on your estimate for the repairs discovered in your diagnosis.<br /><br />',
            'Caution: Failure to complete the MechFinder diagnosis form will result in a loss of the diagnosis payment, and may get you banned from offering future diagnosis.'
        ].join('');

        modal.confirm({
            title: 'Diagnosis Process',
            message: html,
            yes: function() {
                sellerEstimates.user.seenDiagnosisProcess = true;
                var body = {seenDiagnosisProcess: true};
                var request = $.ajax({
                    method: 'POST',
                    url: '/api/profile',
                    data: body,
                    dataType: 'json'
                });

                sellerEstimates.offerDiagnosis();
            },
            noText: 'Cancel',
            yesText: 'Next',
            checkbox: true,
            forceChecked: true
        });
    },

    editDiagnosis: function() {
        var estimate = sellerEstimates.estimateWithUserId(sellerEstimates.user._id);
        if(util.is.nil(estimate)) return;

        modal.diagnosisEstimate({
            title: 'Edit Estimate',
            project: sellerEstimates.project,
            user: sellerEstimates.user,
            estimate: estimate,
            edit: true,
            serviceFee: sellerEstimates.user.serviceFee,
            placeText: 'Save Changes',
            place: function(estimate) {
                sellerEstimates.place(estimate);
            }
        });
    },

    offerWorkorder: function() {
        modal.estimate({
            user: sellerEstimates.user,
            project: sellerEstimates.project,
            edit: true,
            place: function(estimate) {
                sellerEstimates.place(estimate);
            }
        });
    },

    editWorkorder: function() {
        var estimate = sellerEstimates.estimateWithUserId(sellerEstimates.user._id);
        if(util.is.nil(estimate)) return;

        modal.estimate({
            title: 'Edit Estimate',
            user: sellerEstimates.user,
            project: sellerEstimates.project,
            estimate: estimate,
            edit: true,
            place: function(estimate) {
                sellerEstimates.place(estimate);
            }
        });
    },

    cancelEstimate: function(estimateId) {
        var estimate = sellerEstimates.estimateWithId(estimateId);
        if(util.is.nil(estimate)) return;

        modal.confirm({
            title: 'Cancel Estimate?',
            message: 'Are you sure you want to cancel this estimate?',
            yes: function() {
                modal.notify({
                    title: 'Canceling Estimate',
                    message: 'Your estimate is currently being canceled.',
                    canExit: false,
                    canOkay: false,
                    loading: true
                });
                var body = {
                    estimateId: estimate._id
                }

                var request = $.ajax({
                    type: 'POST',
                    url: '/api/project/' + sellerEstimates.project._id + '/retractBid',
                    data: body,
                    dataType: 'json'
                });

                request.done(function(estimate) {
                    modal.notify({
                        title: 'Estimate Canceled',
                        message: 'Your estimate has been canceled.',
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
                    modal.notify({
                        title: 'Error',
                        message: 'There was a problem while canceling your estimate. Please contact your customer and let them know that you would no longer like your estimate to be considered for hire. If you continue to receive this message, please contact us for assistance.'
                    });
                });
            }
        });
    },

    submit: function() {
        var body = sellerEstimates.estimate;

        modal.notify({
            title: 'Submitting Estimate',
            message: 'MechFinder is sending your estimate to ' + sellerEstimates.project.owner.username,
            canExit: false,
            canOkay: false,
            loading: true
        });

        var request = $.ajax({
            type: 'POST',
            url: '/api/project/' + sellerEstimates.project._id + '/bid',
            data: body,
            dataType: 'json'
        });

        request.fail(function(jqXHR) {
            console.log(jqXHR);
            modal.notify({
                title: 'Submission Error',
                message: 'There was an error while submitting your estimate. If this error persists, please contact us to resolve the issue.'
            });
        });

        request.done(function(project) {
            modal.notify({
                title: 'Estimate Submitted',
                message: sellerEstimates.project.owner.username + ' has been notified of your estimate',
                okay: function() {
                    window.location.reload(true);
                },
                exit: function() {
                    window.location.reload(true);
                }
            });
        });
    },

    placement: {
        userInfo: false,
        ein: false,
        correctionModals: []
    },

    place: function(estimate) {
        if(!util.is.nil(estimate)) sellerEstimates.estimate = estimate;

        if(!sellerEstimates.user.verified) {
            modal.confirm({
                title: 'Email Verification',
                message: 'In order to submit estimates on a project, we require that you verify your email. Would you like to verify your email now?',
                yes: function() {
                    sellerEstimates.email.request();
                }
            });
            return;
        }

        if(!(sellerEstimates.user.phone.verified || sellerEstimates.skipPhone || sellerEstimates.user.phone.skip)) {
            if(util.is.nil(sellerEstimates.user.phone.number)) {
                sellerEstimates.phoneNumberBox();
            } else {
                if(util.is.nil(sellerEstimates.user.phone.kind)) {
                    sellerEstimates.phoneKindBox();
                } else {
                    if((!sellerEstimates.user.phone.sms || util.is.nil(sellerEstimates.user.phone.sms)) && sellerEstimates.user.phone.kind === 'Mobile' && !sellerEstimates.skipSMS) {
                        sellerEstimates.phoneSMSBox();
                    } else {
                        sellerEstimates.phoneVerificationBox();
                        // sellerEstimates.phoneVerificationEntry();
                    }
                }
            }
            return;
        } else {
            if(sellerEstimates.skipPhone && !sellerEstimates.user.phone.skip) {
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
        }

        if(sellerEstimates.placement.userInfo || !sellerEstimates.user.first || !sellerEstimates.user.last || !sellerEstimates.user.setSSN || !sellerEstimates.user.setDOB) {
            sellerEstimates.placement.userInfo = false;
            sellerEstimates.userInfo();
            return;
        }

        if(sellerEstimates.placement.ein) {
            sellerEstimates.businessInfo();
            return;
        }

        if(!sellerEstimates.user.setBilling) {
            sellerEstimates.billingInfo();
            return;
        }

        if(!sellerEstimates.user.setBanking) {
            sellerEstimates.bankingInfo();
            return;
        }

        if(sellerEstimates.placement.correctionModals.length > 0) {
            var targetModal = sellerEstimates.placement.correctionModals[0];
            switch(targetModal.modal) {
                case 'modalBanking':
                    sellerEstimates.bankingInfo(targetModal.fields);
                    break;
                case 'modalSellerBusinessInfo':
                    sellerEstimates.businessInfo(targetModal.fields);
                    break;
                case 'modalSellerUserInfo':
                    sellerEstimates.userInfo(targetModal.fields);
                    break;
                case 'modalBilling':
                    sellerEstimates.billingInfo(targetModal.fields);
                    break;
            }

            sellerEstimates.placement.correctionModals.shift();
            return;
        }

        if(!sellerEstimates.user.braintree.hasAccount) {
            sellerEstimates.braintree.addMerchant();
            return;
        }

        sellerEstimates.submit();
    },

    braintree: {
        sdk: null,
        client: null,

        init: function() {

        },

        addMerchant: function() {
            modal.notify({
                title: 'Connecting Account',
                message: 'We are currently connecting your account to our escrow systems.',
                canExit: false,
                canOkay: false,
                loading: true
            });

            var request = $.ajax({
                type: 'POST',
                url: '/api/braintree/createMerchant',
                data: {},
                dataType: 'json'
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
                            case '82649':
                            case '82640':
                            case '82635':
                                // # bad routing number
                                fields.push({
                                    modal: 'modalBanking',
                                    field: 'modalBankingRouting'
                                });
                                break;
                            case '82671':
                            case '82641':
                                // # bad account number
                                fields.push({
                                    modal: 'modalBanking',
                                    field: 'modalBankingAccount'
                                });
                                break;
                            case '82648':
                            case '82647':
                            case '82634':
                                // # bad/missing tax id
                                fields.push({
                                    modal: 'modalSellerBusinessInfo',
                                    field: 'modalSellerBusinessInfoTaxId'
                                });
                                break;
                            case '82642':
                            case '82625':
                                // # bad ssn
                                fields.push({
                                    modal: 'modalSellerUserInfo',
                                    field: 'modalSellerUserInfoSSN'
                                });
                                break;
                            case '82657':
                            case '82661':
                            case '82617':
                            case '82629':
                                // # bad individual/applicant street address
                                fields.push({
                                    modal: 'modalBilling',
                                    field: 'modalBillingPrimary'
                                });
                                break;
                            case '82685':
                                // bad business street address
                                fields.push({
                                    modal: 'modalSellerBusinessInfo',
                                    field: 'modalSellerBusinessInfoAddress'
                                });
                                break;
                            case '82658':
                                // # missing billing locale (city)
                                fields.push({
                                    modal: 'modalBilling',
                                    field: 'modalBillingCity'
                                });
                                break;
                            case '82659':
                            case '82662':
                                // # missing billing zip code
                                fields.push({
                                    modal: 'modalBilling',
                                    field: 'modalBillingZip'
                                });
                                break;
                            case '82686':
                                // bad/missing business zip
                                fields.push({
                                    modal: 'modalSellerBusinessInfo',
                                    field: 'modalSellerBusinessInfoZip'
                                });
                                break;
                            case '82660':
                            case '82668':
                                // # missing billing region (state)
                                fields.push({
                                    modal: 'modalBilling',
                                    field: 'modalBillingState'
                                });
                                break;
                            case '82684':
                                // bad/missing business region (state)
                                fields.push({
                                    modal: 'modalSellerBusinessInfo',
                                    field: 'modalSellerBusinessInfoState'
                                });
                                break;
                            default:
                                // Unknown error occurred
                                unknownError = true;
                                break;
                        }

                        if(unknownError) break;
                    }

                    if(!unknownError) {
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

                        sellerEstimates.placement.correctionModals = modals;
                        sellerEstimates.place();
                    }
                } else {
                    unknownError = true;
                }

                if(unknownError) {
                    modal.notify({
                        title: 'Unknown Error',
                        message: 'An unknown error has occured while trying to place your estimate. Refresh the page and try to submit your bid again. If this error persists, please contact us so we can resolve the issue as quickly as possible'
                    });
                }
            });

            request.done(function(data) {
                sellerEstimates.user.braintree = data.user.braintree;
                sellerEstimates.place();
            });
        }
    },

    bankingInfo: function(fields) {
        fields = $.isArray(fields) ? fields : [];
        var message = (fields.length > 0) ? 'Please correct the highlighted fields in order to submit your estimate:' : '';

        modal.banking({
            submitText: 'Submit',
            message: message,
            fields: fields,
            submit: function(info) {
                modal.notify({
                    title: 'Saving Your Info',
                    message: 'MechFinder is saving your updated information. This may take a few moments, so thank you for your patience.',
                    canExit: false,
                    canOkay: false,
                    loading: true
                });

                var body = {
                    banking: info
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
                        message: 'There was an error while saving your information. If this issue persists, please contact us for a resolution.',
                        condensed: false
                    });
                });

                request.done(function(user) {
                    sellerEstimates.user.setBanking = user.setBanking;
                    sellerEstimates.place();
                });
            }
        });
    },

    billingInfo: function(fields) {
        fields = $.isArray(fields) ? fields : [];
        var message = (fields.length > 0) ? 'Please correct the highlighted fields in order to submit your estimate:' : '';

        modal.billing({
            message: message,
            fields: fields,
            submitText: 'Continue',
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
                        message: 'There was an error while saving your information. If this error persists, please contact us for a resolution.',
                        condensed: false
                    });
                });

                request.done(function(user) {
                    sellerEstimates.user.setBilling = user.setBilling;
                    sellerEstimates.place();
                });
            }
        });
    },

    businessInfo: function(fields) {
        fields = $.isArray(fields) ? fields : [];
        var message = (fields.length > 0) ? 'Please correct the highlighted fields in order to submit your estimate:' : '';

        modal.sellerBusinessInfo({
            message: message,
            fields: fields,
            submitText: 'Continue',
            cancelText: 'Back',
            cancel: function() {
                // force the user info box to show next placement attempt
                sellerEstimates.placement.userInfo = true; 
                sellerEstimates.place();
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
                    business: info
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
                        message: 'There was an error while saving your information. MechFinder is working as fast as possible to resolve this issue. Thank you for your patience.',
                        condensed: false
                    });
                });

                request.done(function(user) {
                    sellerEstimates.user.business = user.business;
                    sellerEstimates.placement.ein = false;
                    sellerEstimates.place();
                });
            }
        });
    },

    userInfo: function(fields) {
        fields = $.isArray(fields) ? fields : [];
        var message = (fields.length > 0) ? 'Please correct the highlighted fields in order to submit your estimate:' : '';

        modal.sellerUserInfo({
            message: message,
            fields: fields,
            fixedButtons: false,
            submitText: 'Continue',
            submit: function(info) {
                sellerEstimates.placement.ein = info.ein;

                modal.notify({
                    title: 'Saving Your Info',
                    message: 'MechFinder is saving your updated information. This may take a few moments, so thank you for your patience.',
                    canExit: false,
                    canOkay: false,
                    loading: true
                });

                var body = info;

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
                        message: 'There was an error while saving your information. If this error persists, please contact us to resolve the issue.',
                        condensed: false
                    });
                });

                request.done(function(user) {
                    sellerEstimates.user.first = user.first;
                    sellerEstimates.user.last = user.last;
                    sellerEstimates.user.setDOB = user.setDOB;
                    sellerEstimates.user.setSSN = user.setSSN;
                    sellerEstimates.place();
                });
            }
        });
    },
    
    email: {
        requested: false,
        triedVerification: false,

        request: function() {
            var verbiage = sellerEstimates.email.requested ? 'another' : 'an';
            sellerEstimates.email.requested = true;

            modal.notify({
                title: 'Email Verification Sending',
                message: 'We are sending you ' + verbiage + ' email verification code now. If you do not see the code in your inbox, try checking your junk or spam filters as well.',
                canExit: false,
                canOkay: false,
                loading: true
            });

            var body = {
                email: sellerEstimates.user.email
            }

            var request = $.ajax({
                type: 'POST',
                url: '/api/verify/email',
                data: body,
                dataType: 'json'
            });

            request.done(function(data) {
                sellerEstimates.email.verify();
            });

            request.fail(function(jqXHR) {
                console.log(jqXHR);
                modal.notify({
                    title: 'Verification Error',
                    message: 'There was an error while verifying your account. If this error persists, please contact us for more information.',
                    condensed: false
                });
            });
        },

        verify: function() {
            var verbiage = (sellerEstimates.email.requested && sellerEstimates.email.triedVerification) ? 'Another' : 'A';
            sellerEstimates.email.triedVerification = true;
            
            modal.input({
                title: 'Email Verification',
                message: verbiage + ' notification has been sent to your email with a verification code. Copy the code into the box below in order to verify your email.<br /><br /> <a id="resendEmailVerification" href="javascript:void(0);">Resend My Verification Code</a>',
                submit: function(code) {
                    sellerEstimates.email.check(code);
                }
            });

            sellerEstimates.clicks.init();
        },

        check: function(code) {
            if(typeof(next) !== 'function') next = function(){};

            modal.notify({
                title: 'Checking Verification Code',
                message: 'We are checking the verification code with your account. This may take a few moments; thank you for your patience.',
                canExit: false,
                canOkay: false,
                loading: true
            });

            var body = {
                email: sellerEstimates.user.email
            };

            var request = $.ajax({
                type: 'POST',
                url: '/api/verify/email/' + code,
                data: body,
                dataType: 'json'
            });

            request.done(function(user) {
                sellerEstimates.user.verified = user.verified;
                sellerEstimates.place();
            });

            request.fail(function(jqXHR) {
                console.log(jqXHR);

                var options = {};
                switch(jqXHR.responseJSON.err) {
                    case 'Incorrect validation code':
                        options = {
                            title: 'Incorrect Code',
                            message: 'The validation code that you have entered was incorrect. Check your email for the correct verification code. Please contact us if this problem persists.',
                            okayText: 'Try Again',
                            okay: function() {
                                sellerEstimates.email.verify();
                            }
                        };
                        break;
                    case 'Validation code expired':
                        options = {
                            title: 'Code Expired',
                            message: 'The validation code that you have entered has expired. To confirm you email address, you may <a id="resendEmailVerification" href="javascript:void(0);">request a new code</a>.',
                        };

                        sellerEstimates.clicks.init();
                        break;
                    default:
                        options = {
                            title: 'Verification Error',
                            message: 'There was an error while verifying your account. Please contact us if this problem persists.'
                        };
                        break;
                }

                modal.notify(options);
            });
            
        }
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
                    phoneNumber: sellerEstimates.user.phone.number,
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
                                sellerEstimates.phoneVerificationEntry(via);
                            }
                        });
                    } else if(jqXHR.responseJSON.err == 'Too many attempts') {
                        modal.notify({
                            title: 'Incorrect Pin',
                            message: 'You have reached the maximum number of attempts to verify your phone number. In the mean time, your bid can still be placed and you can still be hired, but customers will not be given your phone number until it is verified.',
                            okayText: 'Continue',
                            okay: function() {
                                sellerEstimates.skipPhone = true;
                                sellerEstimates.place();
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
                    sellerEstimates.user = user;
                    sellerEstimates.place();
                });
            },
            cancel: function() {
                sellerEstimates.skipPhone = true;
                sellerEstimates.place();
            },
            exit: function() {
                sellerEstimates.cancelEstimate();
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
                phone: sellerEstimates.user.phone,
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
                sellerEstimates.phoneVerificationEntry(method);
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
            canNo: (sellerEstimates.user.phone.sms && sellerEstimates.user.phone.smsCharges),
            no: function() {
                sendRequest('sms');
            },
            yes: function() {
                sendRequest('call');
            },
            exit: function() {
                sellerEstimates.cancelEstimate();
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
                sellerEstimates.user = user;
                sellerEstimates.skipSMS = true;
                sellerEstimates.place();
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
                sellerEstimates.cancelEstimate();
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
                sellerEstimates.skipPhone = true;
                sellerEstimates.place();
            },
            exit: function() {
                sellerEstimates.cancelEstimate();
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
                    sellerEstimates.user = user;
                    sellerEstimates.place();
                });
            }
        });
    },

    phoneNumberBox: function(message) {
        var otherRole = (!util.is.nil(sellerEstimates.user) && sellerEstimates.user.role == 'buyer') ? 'mechanics' : 'customers';
        message = (util.is.nil(message)) ? 'Add a phone number here for ' + otherRole + ' to reach you: ' : message;

        modal.input({
            title: 'Phone Number',
            message: message,
            placeholder: 'XXX-XXX-XXXX',
            condensed: true,
            cancelText: 'Skip',
            cancelOnExit: false,
            cancel: function() {
                sellerEstimates.skipPhone = true;
                sellerEstimates.place();
            },
            exit: function() {
                sellerEstimates.cancelEstimate();
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
                    sellerEstimates.phoneNumberBox('The phone number you have entered is invalid. Valid phone numbers should contain ten (10) numeric digits including your area code. Please re-enter your phone number to continue: ');
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
                        sellerEstimates.user = user;
                        sellerEstimates.place();
                    });
                }
            }
        });
    },
};

$(document).ready(function() {
    sellerEstimates.init();
});