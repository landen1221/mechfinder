$(document).ready(function(e) {
    searchPage.init();
});

var searchPage = {
    currentPage: 1,
    isDataValid: true,
    clicked: false,
    user: null,

    geocoder: null,

    data: {
        favorites: {
            mechanics: [],
            users: [],
            projects: []
        }
    },

    search: {
        filter: {
            index: 0,
            numberOfResults: 10,
            preference: 'none',
            make: {
                name: 'none',
                startingYear: 1886,
                endingYear: 3000
            },
            model: 'none',
            language: 'none',
            repair: 'none',
            posted: 'none',
            certification: 'none',
            yearsExperience: 0,
            type: 'none',
            zip: 'none',
            location: {
                lat: 0,
                lng: 0
            },
            distance: 250000,
            minRating: 0,
            showSeen: true
        }
    },

    results: {},

    init: function() {
        searchPage.user = (!util.is.nil(USER)) ? USER : null;

        if ($('.searchPage').attr('id') === 'projects-page') {
            searchPage.searchType = 'project';
        } else if ($('.searchPage').attr('id') === 'mechanics-page') {
            searchPage.searchType = 'mechanic';
        }
        searchPage.initAdvToggle();
        searchPage.initSubmitBtn();
        searchPage.initFavBtn();
        searchPage.initLoadmore();
        searchPage.initRowLinks();
        var year = new Date().getFullYear() + 1;
        $('#ending_year').attr('placeholder', year);
    },

    hasSeenProject: function(projectViewers) {
        for(var i=0; i<projectViewers.length; i++) {
            if(!util.is.nil(searchPage.user) && searchPage.user._id == projectViewers[i]) {
                return true;
            }
        }

        return false;
    },

    displayResults: function(results, searchType) {
        var projects = results.projects;
        var mechanics = results.mechanics;
        var user = results.user;
        var total = results.total;
        var index = searchPage.search.filter.index;
        var more = '';
        var moreArray = [];
        var resultPage = this.currentPage;
        var isXS = window.matchMedia("only screen and (max-width: 320px)");
        var isSM = window.matchMedia("only screen and (max-width: 480px)");
        var isMD = window.matchMedia("only screen and (max-width: 768px)");
        var isLG = window.matchMedia("only screen and (max-width: 992px)");
        var isXL = window.matchMedia("only screen and (max-width: 1200px)");

        if (typeof results.projects !== 'undefined') {
            for (var i = 0; i < results.projects.length; i++) {
                searchPage.results[results.projects[i]._id] = results.projects[i];
            }
        }

        if (typeof results.mechanics !== 'undefined') {
            for (var i = 0; i < results.mechanics.length; i++) {
                searchPage.results[results.mechanics[i]._id] = results.mechanics[i];
            }
        }
        console.log(searchPage.results);

        if (searchType === 'project') {
            var xsHeader = 'Post Date';
            if (isSM.matches) {
                xsHeader = 'Project';
            }
            moreArray.push(
                '<tr class="table-labels search-result-header">',
                    '<th class="mf-table-xs">' + xsHeader +'</th>',
                    '<th class="mf-table-md">Owner</th>',
                    '<th class="mf-table-sm">Distance</th>',
                    '<th class="mf-table-sm">Estimates</th>',
                    '<th class="mf-table-md">Job</th>',
                    '<th class="mf-table-sm">Need</th>',
                    '<th class="mf-table-xs"></th>',
                '</tr>'
            );

            for (var i = 0; i < projects.length; i++) {
                var vehicle = projects[i].vehicle.year + ' ' + projects[i].vehicle.make + ' ' + projects[i].vehicle.model;

                var distance = 'Unknown';
                if ('distance' in projects[i]) {
                    distance = String(projects[i].distance);
                    if ('city' in projects[i] && 'state' in projects[i]) {
                        if (!util.is.nil(projects[i].city) && projects[i].city !== '-' && !util.is.nil(projects[i].state) && projects[i].state !== '-') {
                            distance += '</br><div class="not-xs">' + projects[i].city + ', ' + projects[i].state + '</div>';
                        }
                    }
                }

                var repair = 'Diagnostic';
                if (projects[i].diagnosis === true) {
                     repair = 'Diagnostic';
                } else {
                     repair = 'Repair';
                }

                var star = 'fa-star-o';
                if (user.favorites.projects.indexOf(projects[i]._id) != -1) {
                     star = 'fa-star';
                } else {
                     star = 'fa-star-o';
                }

                var bids = '';
                if (projects[i].userBid) {
                    bids = '<strong>' + projects[i].bids.length + ' (You\'ve bid)</strong>';
                } else {
                    bids = projects[i].bids.length;
                }

                var ratingHtml = searchPage.formatRating(projects[i].owner.average_rating, 'buyer');
                var favoriteHtml = '';
                if(!util.is.nil(searchPage.user)) {
                    
                }

                var strViewed = searchPage.hasSeenProject(projects[i].viewers) ? ' viewed' : '';

                moreArray.push(
                    '<tr class="search-result-row' + strViewed + '" id="result-page-' + resultPage +'" data-href="/projects/' + projects[i]._id + '">',
                        '<td class="result-date mf-table-xs">',
                        '<div class="xs-only"><strong>' + distance + '</strong></div>',
                        '' + util.time.format(projects[i].date_created, 'MM/DD/YYYY') + '</br>',
                        '' + (searchPage.hasSeenProject(projects[i].viewers) ? '<i class="fa fa-eye fa-fw" aria-hidden="true" title="You have viewed this project before"></i><br />' : '') + '',
                        '<div class="xs-only"><a href="/projects/' + projects[i]._id + '">' + projects[i].title + '</a></br>' + vehicle + '</br>',
                        '' + projects[i].repair,
                        '</div></td>',
                        '<td class="result-owner mf-table-md">' + projects[i].owner.username + '</br>' + ratingHtml + '</td>',
                        '<td class="result-location mf-table-sm">' + distance + '</td>',
                        '<td class="result-bids mf-table-sm">' + bids + '</td>',
                        '<td class="result-vehicle mf-table-md"><strong>' + vehicle + '</strong></br><a href="/projects/' + projects[i]._id + '">' + projects[i].title + '</a></td>',
                        '<td class="result-need mf-table-sm">' + repair + '</td>',
                        '<td class="result-actions fav-project mf-table-xs">',
                            '<div class="favorite-action-styles ' + (!util.is.nil(searchPage.user) ? 'favorite-action' : 'internalSignupAction') + '" data-ids="' + projects[i]._id + '" data-role="projects">',
                                '<a class="fa ' + star + '" aria-hidden="true"></a>',
                                '<span class="favorite-label">Favorite</span>',
                            '</div>',
                        '</td>',
                    '</tr>'
                );
            }
        } else if (searchType === 'mechanic') {
            moreArray.push(
                '<tr class="table-labels search-result-header">',
                    '<th class="mf-table-sm">Rating</th>',
                    '<th class="mf-table-xs">Mechanic</th>',
                    '<th class="mf-table-sm">Distance</th>',
                    '<th class="mf-table-sm">Type</th>',
                    '<th class="mf-table-md">Highlights</th>',
                    '<th class="mf-table-md">Specialties</th>',
                    '<th class="mf-table-xs"></th>',
                '</tr>'
            );
            for (var i = 0; i < mechanics.length; i++) {
                var username = mechanics[i].username;
                var city = '';
                if ('city' in mechanics[i] && 'state' in mechanics[i]) {
                    if (!util.is.nil(mechanics[i].city) && mechanics[i].city !== '-' && !util.is.nil(mechanics[i].state) && mechanics[i].state !== '-') {
                        city = '</br>' + mechanics[i].city + ', ' + mechanics[i].state;
                    }
                }
                var mechDistance = 'Job needs</br>location';
                if ('distance' in mechanics[i]) {
                    mechDistance = mechanics[i].distance;
                }
                var mechType = mechanics[i].mechanicType;
                var highlights = '';
                if (mechanics[i].yearsOfExperience > 0) {
                    highlights += '<li>' + mechanics[i].yearsOfExperience + ' years experience</li>';
                }
                if (mechanics[i].certifications.length > 0) {
                    highlights += '<li>' + mechanics[i].certifications.length + ' certifications</li>';
                }
                if (mechanics[i].warranty.amount > 0) {
                    highlights += '<li>' + mechanics[i].warranty.amount + '-' + mechanics[i].warranty.units + ' warranty</li>';
                }
                if (mechanics[i].insurance) {
                    highlights += '<li>Carries insurance</li>';
                }
                var specialties = '';
                if (mechanics[i].specialties.length > 0) {
                    var len = 0;
                    var isMore = false;
                    if (mechanics[i].specialties.length > 4) {
                        len = 3;
                        isMore = true;
                    } else if (mechanics[i].specialties.length === 4) {
                        len = 4;
                        isMore = false;
                    } else {
                        len = mechanics[i].specialties.length;
                        isMore = false;
                    }
                    for (var x = 0; x < len; x++) {
                        specialties += mechanics[i].specialties[x] + '<br/>';
                    }
                    if (isMore) {
                        var numberMore = mechanics[i].specialties.length - len;
                        specialties += '(<em class="gray">' + numberMore + ' more</em>)';
                    }
                }

                var mstar = 'fa-star-o';
                if (user.favorites.mechanics.indexOf(mechanics[i]._id) != -1) {
                     mstar = 'fa-star';
                } else {
                     mstar = 'fa-star-o';
                }

                var ratingHtml = searchPage.formatRating(mechanics[i].average_rating, 'seller');


                moreArray.push(
                '<tr class="search-result-row" id="result-page-' + resultPage +'" data-href="/profile/' + mechanics[i]._id + '">',
                    '<td class="result-rating mf-table-sm">' + ratingHtml + '</td>',
                    '<td class="result-mechanic mf-table-xs"><strong><a href="/profile/' + mechanics[i]._id + '">' + username + '</a></strong><span class="xs-only"></br>' + ratingHtml + '</span>' + city,
                        '<div class="xs-only">' + mechDistance + '</br>Type: ' + mechType + '</div>',
                    '</td>',
                    '<td class="result-location mf-table-sm">' + mechDistance + '</td>',
                    '<td class="result-type mf-table-sm">' + mechType + '</td>',
                    '<td class="result-highlights mf-table-md">',
                        '<ul>' + highlights + '</ul></td>',
                    '<td class="result-specialties mf-table-md">' + specialties + '</td>',
                    '<td class="result-actions fav-mechanic mf-table-xs">',
                        '<div class="contact-action-styles ' + (!util.is.nil(searchPage.user) ? 'contact-action' : 'internalSignupAction') + '" data-ids="' + mechanics[i]._id + '">',
                            '<span class="fa fa-envelope-o" aria-hidden="true"></span>',
                            '<span class="favorite-label">Message</span>',
                        '</div>',
                        '<div class="favorite-action-styles ' + (!util.is.nil(searchPage.user) ? 'favorite-action' : 'internalSignupAction') + '" data-ids="' + mechanics[i]._id + '" data-role="mechanics">',
                            '<a class="fa ' + mstar + '" aria-hidden="true"></a>',
                            '<span class="favorite-label">Favorite</span>',
                        '</div>',
                    '</td>',
                 '</tr>'
                );
            }
        }

        this.currentPage += 1;

        if (index >= total) {
            $('#loadmore').slideUp();
        }

        more = moreArray.join("\n");
        var added = $(more).appendTo('.results-append-target');
        $(more).ready(function(e) {
            searchPage.initFavBtn();
            searchPage.initRowLinks();
            if(!util.is.nil(searchPage.user)) chat.conversation.initContactAction();
            else internal.nav.initLoginClicks();
        });

        if (total === 0) {
            $('.error-message').remove();   
            var errorText = '<tr class="error error-message"><td>We couldn\'t find any results. Try a broader search.</td></tr>';
            $(errorText).appendTo('.results-append-target');
            $('.search-result-row').remove();
            $('.search-result-header').remove();
        }

        var top = $(window).scrollTop();
        var height = added.outerHeight() * resultPage;
        $(window).scrollTop(top + height);
    },

    initRowLinks: function(){
        $(".search-result-row").off('click touchend touchmove').on('click touchend touchmove', function(e) {
            if(!searchPage.clicked) {
                searchPage.clicked = true;
                setTimeout(function() {
                    searchPage.clicked = false;
                }, 300);
                if (e.type === 'touchmove' || $(e.target).hasClass('fa')) {
                    return null;
                } else {
                    var url = $(this).data('href');
                    var itemId = util.url.pathAtIndex(2, url);
                    var type = util.url.pathAtIndex(1, url);
                    var repairType = searchPage.results[itemId].repair;
                    
                    if (searchPage.results[itemId].diagnosis) {
                        repairType = 'Diagnosis';
                    }

                    if (type === 'profile') {
                        mfMixpanel.track('Profile View from Search', {'Profile Id': itemId});
                    } else if (type === 'projects') {
                        mfMixpanel.track('Project View from Search', {
                            'Project': itemId,
                            'Repair Type': repairType
                        });
                    }
                    
                    window.document.location = url;
                }
            }
        });
    },

    formatRating: function(averageRating, role) {
        var ratingHtml ='';
        var faKind, offStr, rounded;
        if (averageRating > 0) {
            rounded = parseInt(Math.round(averageRating));
            if (role === 'seller') {
                faKind = 'wrench';
            } else {
                faKind = 'star';
            }
            for(var y = 0; y < 5; y++) {
                if (y < rounded) {
                    offStr = '';
                } else {
                    offStr = 'off';
                }
                ratingHtml += '<i class="fa fa-' + faKind + ' ' + offStr + '"></i>';
            }
        }
        if (ratingHtml === '') {
            ratingHtml = 'Not yet rated';
        }
        return ratingHtml;
    },

    initAdvToggle: function() {
        $('.advanced-search-toggle').click(function() {
            $('#vehicleMake option:first').text('All Makes');
            $('.advanced-search-options').slideToggle();

            if($('#advancedExpIcon').hasClass('fa-chevron-down')) {
                $('#advancedExpIcon').addClass('fa-chevron-up').removeClass('fa-chevron-down');
            } else {
                $('#advancedExpIcon').addClass('fa-chevron-down').removeClass('fa-chevron-up');
            }
        });
    },

    initSubmitBtn: function() {
        $('#search-button, .searchButton').click(function(e) {
            console.log('search button clicked');
            searchPage.validateForm(function(validData) {
                if (validData) {
                    searchPage.search.filter.index = 0;
                    $('.search-result-row').remove();
                    $('.search-result-header').remove();
                    searchPage.getMoreResults();
                    $('#loadmore').slideDown();
                    // $('.advanced-search-options').stop().slideUp(300);
                }
            });

            
        });

        $('#address').keydown(function(e) {
            if (e.keyCode == 13 || e.which === 13) {
                $('#search-button').click();
                e.preventDefault();
            }
        });
    },

    validateForm: function(next) {
        next = (typeof next === 'function') ? next : function(valid){console.log('Warning: no callback sent to validate form')};
        var valid = false;
        $('.error').removeClass('error');
        var preference = $('#customer_prefers').val();
        if (preference === 'Shop') {
            preference = 'shop';
        } else if (preference === 'Mobile mechanic') {
            preference = 'mobile';
        } else {
            preference = 'none';
        }
        searchPage.search.filter.preference = preference;

        var type = $('#business_type').val();
        if (type === 'Mechanic shop') {
            type = 'shop';
        } else if (type === 'Mobile mechanic') {
            type = 'mobile';
        } else {
            type = 'none';
        }
        searchPage.search.filter.type = type;

        var make = $('#vehicleMake').val();
        if (typeof make === "undefined" || make === null || make === '') {
            make = 'none';
        }
        var startingYear = $('#starting_year').val();
        if (typeof startingYear === "undefined" || startingYear === null || startingYear === '') {
            startingYear = String(1800);
        }
        var endingYear = $('#ending_year').val();
        if (typeof endingYear === "undefined" || endingYear === null || endingYear === '') {
            endingYear = String(new Date().getFullYear() + 1);
        }

        var errs = [];
        var errIds = [];
        var isValidStart = /^(?:18|19|20|30)\d{2}$/.test(startingYear);
        var isValidEnd = /^(?:18|19|20|30)\d{2}$/.test(endingYear);
        if(!isValidStart) {
            if(startingYear === null || startingYear === '') {
                searchPage.search.filter.make.startingYear = 1800;
            } else {
                errs.push('Invalid starting year.');
                errIds.push('starting_year');
                searchPage.search.filter.make.startingYear = 1800;
            }
        } else {
            searchPage.search.filter.make.startingYear = String(startingYear).substring(0,4);
        }
        if(!isValidEnd) {
            if(endingYear === null || endingYear === '') {
                searchPage.search.filter.make.endingYear = new Date().getFullYear() + 1;
            } else {
                errs.push('Invalid ending year.');
                errIds.push('ending_year');
                searchPage.search.filter.make.endingYear = new Date().getFullYear() + 1;
            }
        } else {
            searchPage.search.filter.make.endingYear = String(endingYear).substring(0,4);
        }
        searchPage.search.filter.make.name = make;

        var model = $('#vehicleModel').val();
        if (typeof endingYear === "undefined" || endingYear === null || model === '') {
            model = 'none';
        }
        searchPage.search.filter.model = model;

        var language = $('#language').val();
        if (language == 'Español') {
            language = 'Spanish';
        } else {
            language = 'none';
        }
        searchPage.search.filter.language = language;

        var repair = $('#specialization').val();
        if (typeof repair === "undefined" || repair === null || repair === 'Any') {
            repair = 'none';
        }
        searchPage.search.filter.repair = repair;

        var postedWithin = $('#posted_within').val();
        switch (postedWithin) {
            case 'Past 2 days':
                searchPage.search.filter.posted = 2;
                break;
            case 'Past 3 days':
                searchPage.search.filter.posted = 3;
                break;
            case 'Past 5 days':
                searchPage.search.filter.posted = 5;
                break;
            case 'Past week':
                searchPage.search.filter.posted = 7;
                break;
            case 'Past 2 weeks':
                searchPage.search.filter.posted = 14;
                break;
            case 'Past month':
                searchPage.search.filter.posted = 30;
                break;
            default:
                searchPage.search.filter.posted = 'none';
        }

        var certification = $('#certification').val();
        switch (certification) {
            case 'Certified':
                searchPage.search.filter.certification = 'certified';
                break;
            case 'Not certified':
                searchPage.search.filter.certification = 'not certified';
                break;
            default:
                searchPage.search.filter.certification = 'none';
        }

        var yearsExperience = $('#years_experience').val();
        switch (yearsExperience) {
            case '2+':
                searchPage.search.filter.yearsExperience = 2;
                break;
            case '5+':
                searchPage.search.filter.yearsExperience = 5;
                break;
            case '10+':
                searchPage.search.filter.yearsExperience = 10;
                break;
            case '15+':
                searchPage.search.filter.yearsExperience = 15;
                break;
            default:
                searchPage.search.filter.yearsExperience = 0;
        }

        var distance = $('#distance').val();
        switch (distance) {
            case '1 mile':
                searchPage.search.filter.distance = 1;
                break;
            case '5 miles':
                searchPage.search.filter.distance = 5;
                break;
            case '10 miles':
                searchPage.search.filter.distance = 10;
                break;
            case '15 miles':
                searchPage.search.filter.distance = 15;
                break;
            case '25 miles':
                searchPage.search.filter.distance = 25;
                break;
            case '50 miles':
                searchPage.search.filter.distance = 50;
                break;
            case '100 miles':
                searchPage.search.filter.distance = 100;
                break;
            default:
                searchPage.search.filter.distance = 250000;
        }

        var minRating = $('#minimum_rating').val();
        switch (minRating) {
            case '5':
                searchPage.search.filter.minRating = 5;
                break;
            case '4+':
                searchPage.search.filter.minRating = 4;
                break;
            case '3+':
                searchPage.search.filter.minRating = 3;
                break;
            case '2+':
                searchPage.search.filter.minRating = 2;
                break;
            case '1+':
                searchPage.search.filter.minRating = 1;
                break;
            default:
                searchPage.search.filter.minRating = 0;
                break;
        }

        searchPage.search.filter.showSeen = $('#show_seen_jobs').val() == '1';

        var address = $('#address').val();
        var resultCity = '';
        if(!util.is.nil(searchPage.geocoder) && !util.is.nil(address)) {
            var geocoded = {address: address};
            searchPage.geocoder.geocode(geocoded, function(results, status) {
                switch(status) {
                    case google.maps.GeocoderStatus.OK:
                        searchPage.search.filter.location.lat = results[0].geometry.location.lat();
                        searchPage.search.filter.location.lng = results[0].geometry.location.lng();
                        if (typeof results[0].address_components[3] !== 'undefined') {
                            resultCity = results[0].address_components[3].long_name;
                        }                        
                        break;
                    default:
                        errs.push('We were not able to find your location');
                        errIds.push('zip');
                        searchPage.search.filter.location.lat = 0;
                        searchPage.search.filter.location.lng = 0;
                        break;
                }

                var errCount = searchPage.highlightErrors(errs, errIds);
                return next(errCount == 0);
            });
        } else {
            searchPage.search.filter.lat = 0;
            searchPage.search.filter.lng = 0;
        
            var errCount = searchPage.highlightErrors(errs, errIds);
            return next(errCount == 0);
        }

        
    },

    highlightErrors: function(errs, errIds) {
        if (errs.length > 0 || errIds.length > 0) {
            for (i = 0; i < errIds.length; i++) {
                $('#' + errIds[i]).addClass('error');
            }
            if (errs.length > 1) {
                $('#status').text('Please correct the highlighted fields and then resubmit.').addClass('error');
            } else {
                $('#status').text(errs[0]).addClass('error');
            }
            return 1;
        } else {
            $('#status').text('');
            return 0;
        }
    },

    googleInit: function() {
        searchPage.geocoder = new google.maps.Geocoder();
    },

    initLoadmore: function() {
        $('#loadmore').click(function() {
            searchPage.getMoreResults();
        });
        
        searchPage.getMoreResults();
    },

    initFavBtn: function() {
        favoritesListener.init();
    },

    getMoreResults: function() {
        searchPage.validateForm(function(dataValid) {
            if(dataValid) {
                $('.error-message').remove();
                $('#loadmore').text('Loading Results');
                var searchType = searchPage.searchType;
                var apiUrl = '';
                if (searchType === 'project') {
                    apiUrl = '/api/findprojects';
                } else if (searchType === 'mechanic') {
                    apiUrl = '/api/findmechanics';
                }
                
                var request = $.ajax({
                    type: "POST",
                    url: apiUrl,
                    data: searchPage.search,
                    dataType: 'json'
                });

                request.done(function(results) {                    
                    trackSearch(searchType);

                    searchPage.displayResults(results, searchType);
                    $('#loadmore').text('Load More Results');                    
                });

                request.fail(function(err) {
                    modal.notify({
                        title: 'Error',
                        message: 'Something went wrong. Please refresh the page and try again.',
                        canOkay: true,
                        canExit: true
                    });
                });

                searchPage.search.filter.index += searchPage.search.filter.numberOfResults;

                var trackSearch = function(searchType) {
                    var searchData;
                    searchData = {};

                    if (searchPage.search.filter.preference !== 'none') {
                        searchData['Customer Mechanic Preference'] = searchPage.search.filter.preference;
                    }

                    if (searchPage.search.filter.make.name !== 'none') {
                        searchData['Vehicle Make'] = searchPage.search.filter.make.name;
                    }

                    if (searchPage.search.filter.model !== 'none') {
                        searchData['Vehicle Model'] = searchPage.search.filter.model;
                    }

                    if (searchPage.search.filter.language !== 'none') {
                        searchData['Language'] = searchPage.search.filter.language;
                    }

                    if (searchPage.search.filter.repair !== 'none') {
                        searchData['Repair Type'] = searchPage.search.filter.repair;
                    }

                    if (searchPage.search.filter.posted !== 'none') {
                        searchData['Posted Within'] = searchPage.search.filter.posted;
                    }

                    if (searchPage.search.filter.certification !== 'none') {
                        searchData['Certified'] = searchPage.search.filter.certification;
                    }

                    if (searchPage.search.filter.yearsExperience !== 0) {
                        searchData['Years of experience'] = searchPage.search.filter.yearsExperience;
                    }

                    if (searchPage.search.filter.type !== 'none') {
                        searchData['Mechanic Type'] = searchPage.search.filter.type;
                    }

                    if (searchPage.search.filter.distance !== 250000) {
                        searchData['Distance'] = searchPage.search.filter.distance;
                    }

                    if (searchPage.search.filter.minRating !== 0) {
                        searchData['Minimum Rating'] = searchPage.search.filter.minRating;
                    }
                    if (searchPage.search.filter.location.lat !== 0 && searchPage.search.filter.location.lng !== 0) {
                        searchData['Location'] = searchPage.search.filter.location.lat + ', ' + searchPage.search.filter.location.lng;
                    }

                    if ($('#address').val() !== '') {
                        searchData['Search Terms'] = $('#address').val();
                    }

                    searchData['Search Type'] = searchType;

                    mfMixpanel.track('Search', searchData);
                }
            }
        });
        
    },

    sendFavorites: function(id, type) {
        searchPage.data.favorites[type].push(id);

        $.ajax({
            type: "POST",
            url: '/api/profile/favorites',
            data: searchPage.data,
            dataType: 'json'
        })
            .done(function(results) {
                searchPage.data.favorites[type] = [];
            })
            .fail(function(err) {
                console.log(err);
            })
        ;
    }
}; // internal.searchPage {}
