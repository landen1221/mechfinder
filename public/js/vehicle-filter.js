var vehicleFilter = {
    init: function() {
        // USER SELECTS MAKE
        $("select[name='vehicleMake']").on("change", function() {
            value = $(this).val();
            vehicleFilter.selector("make", value);

        });

        // USER SELECTS MODEL
        $("select[name='vehicleModel']").on("change", function() {
            value = $(this).val();
            vehicleFilter.selector("model", value);
        });

        $("select[name='vehicleYear']").on("change", function() {
            value = $(this).val();
            vehicleFilter.selector("year", value);
        });

        vehicleFilter.selector();
        if (typeof searchableDropdown != 'undefined') {
            vehicleFilter.searchBoxes.init();
        }
    },

    selector: function(stage, selectValue) {
        // does the vehicle form exists?
        if($(".vehicleSelector")[0]) {

            apiUrl = '/api/makes';
            var vehicleYearSelect = $("select[name='vehicleYear']");
            var vehicleModelSelect = $("select[name='vehicleModel']");
            var vehicleMakeSelect = $("select[name='vehicleMake']");
            var engineCylinders = $("input[name='engineCylinders']");
            // apiObject = {}


            // DEFINE API GET URL DEPENDENT ON STAGE
            switch (stage) {
                case "make":
                    makeValue = selectValue;
                    // apiObject["make"] = makeValue;
                    apiBase = apiUrl + '/' + selectValue;
                    break;

                case "model":
                    modelValue = selectValue;
                    // apiObject["make"] = makeValue;
                    // apiObject["model"] = modelValue;
                    apiBase = apiUrl + '/' + makeValue + '/' + selectValue;
                    break;

                case "year":
                    yearValue = selectValue;
                    apiBase = apiUrl + '/' + makeValue + '/' + modelValue + '/' + selectValue;
                    break;

                default:
                    apiBase = apiUrl;
            }
            // console.log(apiBase);

            // LOAD SELECTION DATA
            $.ajax({
                url: apiBase,
                type: "GET",
                // dataType: "json",
                // data: apiObject,
                success: function(make) {
                    // DATA HAS LOADED, APPEND TO SELECT BOX
                    if (stage === "make") {
                        // IF MAKE HAS BEEN SELECTED
                        // EMPTY AND DISABLE YEAR FIELD
                        vehicleYearSelect.empty().append('<option value="">Select Year</option>').prop("disabled", true);
                        engineCylinders.attr("value", "");

                        // EMPTY AND ENABLE MODEL FIELD
                        vehicleModelSelect.empty().append('<option value="">Select Model</option>').prop("disabled", false);


                        // APPEND MAKE MODELS TO MODEL LIST
                        $.each(make, function(index, makeValue) {
                            vehicleModelSelect.append("<option value='" + makeValue + "'>" + makeValue + "</option>");
                        });


                    } else if (stage === "model") {
                        // IF MODEL HAS BEEN SELECTED

                        // EMPTY AND ENABLE YEAR FIELD
                       vehicleYearSelect.empty().prop("disabled", false).append('<option value="">Select Year</option>');
                       engineCylinders.attr("value", "");

                        // APPEND YEARS TO LIST
                        $.each(make, function(index, makeValue) {
                            vehicleYearSelect.append("<option value='" + makeValue + "'>" + makeValue + "</option>");
                        });

                    } else if(stage === "year"){
                        // YEAR HAS BEEN SELECTED - LETS FILL IN THE CYLINDER AMOUNT

                        $.each(make, function(index, makeValue) {
                            engineCylinders.attr("value", makeValue);
                        });
                        // REPLACE THE TEXT IN THE CYLINDER FIELD

                    } else {
                        // DEFAULT STAGE IS ON LOAD - APPEND MAKES
                        vehicleMakeSelect.empty().append('<option value="">Select Make</option>');
                        $.each(make, function(index, makeValue) {
                            vehicleMakeSelect.append("<option value='" + makeValue + "'>" + makeValue + "</option>");
                        });
                    }
                },
                fail: function(jqXHR) {
                    console.log(jqXHR);
                    alert('There was an error while searching our database for your vehicle. If this issue persists, please contact us');
                }
            });
        } else {
            // FORM DOESN'T EXIST
            // console.log("Vehicle wrapper does not exist. Add class .vehicleSelector to enable");
        }
    },

    searchBoxes : {
        init: function() {
            vehicleFilter.searchBoxes.initMakeDropdown();
            vehicleFilter.searchBoxes.initModelDropdown();
            vehicleFilter.searchBoxes.initYearDropdown();
            vehicleFilter.searchBoxes.getMakes();     
            $('#inputModel').prop('disabled', true).prop('placeholder', 'Enter vehicle Make first');
            $('#inputYear').prop('disabled', true).prop('placeholder', 'Enter vehicle Model first');     
        },

        initMakeDropdown: function() {
            searchableDropdown.setup($('#inputMake'), $('#dropdownMake'), '#dropdownMake', vehicleFilter.searchBoxes.getModels);
            vehicleFilter.searchBoxes.registerEvents();
        },

        initModelDropdown: function() {
            searchableDropdown.setup($('#inputModel'), $('#dropdownModel'), '#dropdownModel', vehicleFilter.searchBoxes.getYears);
            vehicleFilter.searchBoxes.registerEvents();
        },

        initYearDropdown: function() {
            searchableDropdown.setup($('#inputYear'), $('#dropdownYear'), '#dropdownYear', function(){});  
            vehicleFilter.searchBoxes.registerEvents();
        },

        fetchMakeInfo: function(apiURL, callback) {
            var request = $.ajax({
                type: 'GET',
                url: apiURL
            });

            request.done(function(data) {
                callback(data, null);
            });

            request.fail(function(jqXHR) {
                console.log(jqXHR);
            });
        },

        getMakes: function() {
            var apiURL = '/api/makes/';
            vehicleFilter.searchBoxes.fillDropdown(apiURL, function(makeList) {
                $('#dropdownMake').html(makeList);
                vehicleFilter.searchBoxes.initMakeDropdown();
            });
        },

        getModels: function() {
            var make = $('#inputMake').val();
            if (!util.is.nil(make)) {
                var apiURL = '/api/makes/' + make;
                vehicleFilter.searchBoxes.fillDropdown(apiURL, function(modelList) {
                    $('#dropdownModel').html(modelList);
                    vehicleFilter.searchBoxes.initModelDropdown();
                });
                vehicleFilter.searchBoxes.getYears();
            }
        },

        getYears: function() {
            var make = $('#inputMake').val();
            var model = $('#inputModel').val();
            if (!util.is.nil(make) && !util.is.nil(model)) {
                var apiURL = '/api/makes/' + make + '/' + model;
                vehicleFilter.searchBoxes.fillDropdown(apiURL, function(yearList) {
                    $('#dropdownYear').html(yearList);
                    vehicleFilter.searchBoxes.initYearDropdown();
                });
            }
        },

        fillDropdown: function(apiURL, callback) {
            vehicleFilter.searchBoxes.fetchMakeInfo(apiURL, function(data, err) {
                if (err === null) {
                    var itemList = '';
                    for (var i = 0; i < data.length; i++) {
                        itemList += '<li>' + data[i] + '</li>';
                    }
                    callback(itemList);
                }
            });
        },

        registerEvents: function() {
            // This is called every time we init a dropdown because
            //    the searchable dropdown class will nuke the 'focus' event
            //    DO NOT USE .OFF() HERE OR YOU'LL BREAK THE WORLD
            $('#inputModel').on('focus', function() {
                vehicleFilter.searchBoxes.getModels();
            });

            $('#inputYear').on('focus', function(){
                vehicleFilter.searchBoxes.getYears();
            });

            $('#inputMake').change(function() {
                var isDisabled = true;
                var placeholder = 'Enter vehicle Make first';
                if ($(this).val() !== '') {
                    isDisabled = false;
                    placeholder = 'Enter vehicle Model';
                }
                $('#inputModel').prop('disabled', isDisabled).prop('placeholder', placeholder);
            });

            $('#inputModel').change(function() {
                var isDisabled = true;
                var placeholder = 'Enter vehicle Model first';
                if ($(this).val() !== '') {
                    isDisabled = false;
                    placeholder = 'Enter vehicle Year';
                }
                $('#inputYear').prop('disabled', isDisabled).prop('placeholder', placeholder);
            });
        }
    }
};

$(document).ready(function() {
    vehicleFilter.init();
});
