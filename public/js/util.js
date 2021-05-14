var util = {
    is: {
        nil: function(obj, options) {
            options = (typeof(options) === 'object') ? options : {};

            var defaults = {
                checkObjects: true,
                checkSpaces: true,
                checkBlankStrings: true,
                checkNull: true,
                checkUndefined: true,
                checkHTMLSpaces: true,
                removeSpaces: true
            }

            var settings = $.extend({}, defaults, options);
            if(settings.removeSpaces && typeof(obj) === 'string') {
                obj = obj.replace(/\s/g, '');
            }

            var objArr;
            if($.isArray(obj)) {
                if(obj.length > 0) {
                    objArr = obj;
                } else {
                    return true;
                }
            } else {
                objArr = [obj];
            }

            var o;
            for(var i=0; i<objArr.length; i++) {
                o = objArr[i];
                if(settings.checkBlankStrings && o == '') return true;
                if(settings.checkNull && o == null) return true;
                if(settings.checkSpaces && o == ' ') return true;
                if(settings.checkObjects && typeof(o) === 'object' && $.isEmptyObject(o) && $.isPlainObject(o)) return true;
                if(settings.checkHTMLSpaces && typeof(o) === 'string' && o.toLowerCase() == '&nbsp;') return true;
            }
            return false;
        },

        array: function(obj) {
            return $.isArray(obj);
        },

        number: function(obj) {
            return !jQuery.isArray( obj ) && (obj - parseFloat( obj ) + 1) >= 0;
        },

        zip: function(str, formatting) {
            formatting = (typeof(formatting) === 'boolean') ? formatting : false;
            var zip = '';

            if(typeof(str) === 'number') zip = str.toString();
            else if(typeof(str) === 'string') zip = str;
            else return false;

            if(!formatting) {
                // strip everything from the string and make sure the num is 5 or 9 digits
                zip = zip.replace(/\D/g, '');
                if(zip.length != 5 && zip.length != 9) return false;
                return true;
            }

            var expression = /(^\d{5}$)|(^\d{5}-\d{4}$)/;
            return expression.test(zip);
        },

        creditCard: function(cc) {
            if (cc.length > 19) return false;

            var sum = 0;
            var mul = 1;
            var l = cc.length;
            var digit;
            var tproduct;

            for (var i=0; i<l; i++) {
                digit = cc.substring(l-i-1, l-i);
                tproduct = parseInt(digit, 10) * mul;

                if (tproduct >= 10) sum += (tproduct % 10) + 1;
                else sum += tproduct;

                if (mul == 1) mul++;
                else mul--;
            }

            return ((sum % 10) == 0)
        },
        
        email: function(email) {
            var emailRegexp = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i;
            return emailRegexp.test(email);
        }
    },

    estimate: {
        virtualize: function(estimate, discount) {
            estimate.partsAmount = 0;
            estimate.partsTaxAmount = 0;
            for(var i=0; i<estimate.parts.length; i++) {
                var part = estimate.parts[i];
                estimate.partsAmount += part.cost * part.quantity;
                estimate.partsTaxAmount += part.cost * part.quantity * estimate.taxRate.parts;
            }
            estimate.partsAmount = util.currency.roundCents(estimate.partsAmount);
            estimate.partsTaxAmount = util.currency.roundCents(estimate.partsTaxAmount);

            estimate.laborAmount = 0;
            estimate.laborTaxAmount = 0;
            for(var i=0; i<estimate.labor.length; i++) {
                var labor = estimate.labor[i];
                estimate.laborAmount += labor.rate * labor.hours;
                estimate.laborTaxAmount += labor.rate * labor.hours * estimate.taxRate.labor;
            }
            estimate.laborAmount = util.currency.roundCents(estimate.laborAmount);
            estimate.laborTaxAmount = util.currency.roundCents(estimate.laborTaxAmount);

            estimate.partsLaborAmount = util.currency.roundCents(estimate.partsAmount + estimate.laborAmount);
            estimate.subtotalAmount = util.currency.roundCents(estimate.partsLaborAmount - estimate.diagnosisWaiver);
            estimate.taxAmount = util.currency.roundCents(estimate.partsTaxAmount + estimate.laborTaxAmount);

            estimate.buyerDiscountAmount = 0;
            if(!util.is.nil(discount) && !util.is.nil(discount.buyer)) {
                if(discount.buyer.amount > 0) {
                    estimate.buyerDiscountAmount = util.currency.roundCents(discount.buyer.amount);
                } else {
                    estimate.buyerDiscountAmount = util.currency.roundCents(discount.buyer.rate * estimate.subtotalAmount);
                }
            } else if(!util.is.nil(estimate.discount) && !util.is.nil(estimate.discount.buyer)) {
                estimate.buyerDiscountAmount = util.currency.roundCents(estimate.discount.buyer * estimate.subtotalAmount);
            }

            estimate.sellerDiscountAmount = 0;
            if(!util.is.nil(discount) && !util.is.nil(discount.seller)) {
                if(discount.seller.amount > 0) {
                    estimate.sellerDiscountAmount = util.currency.roundCents(discount.seller.amount);
                } else {
                    estimate.sellerDiscountAmount = util.currency.roundCents(discount.seller.rate * estimate.subtotalAmount);
                }
            } else if(!util.is.nil(estimate.discount) && !util.is.nil(estimate.discount.seller)) {
                estimate.sellerDiscountAmount = util.currency.roundCents(estimate.discount.seller * estimate.subtotalAmount);
            } 

            estimate.sellerReferralAmount = util.currency.roundCents(Math.abs(estimate.referral.seller * estimate.subtotalAmount));
            estimate.buyerReferralAmount = util.currency.roundCents(Math.abs(estimate.referral.buyer * estimate.subtotalAmount));
            estimate.sellerTotal = util.currency.roundCents(estimate.subtotalAmount + estimate.taxAmount - estimate.sellerReferralAmount + estimate.sellerDiscountAmount);
            estimate.buyerTotal = util.currency.roundCents(estimate.subtotalAmount + estimate.taxAmount + estimate.buyerReferralAmount - estimate.buyerDiscountAmount);
            estimate.mfTotal = util.currency.roundCents(estimate.sellerReferralAmount + estimate.buyerReferralAmount);

            return estimate;
        },

        applicableDiscounts: function(project, estimate, discounts) {
            discounts = (util.is.nil(discounts)) ? [] : discounts;
            var allowed = [];
            estimate = util.estimate.virtualize(estimate);

            for(var i=0; i<discounts.length; i++) {
                var discount = discounts[i];

                var kindAllowed = false;
                kindAllowed = util.is.nil(discount.kind);
                if(project.diagnosis && discount.kind == 'diagnosis') kindAllowed = true;
                if(!project.diagnosis && discount.kind == 'workorder') kindAllowed = true;

                var expired = false;
                var now = new Date();
                now.setHours(0, 0, 0, 0);
                if(!util.is.nil(discount.expiration)) {
                    if(new Date(discount.expiration) < now) {
                        expired = true;
                    }
                }

                var usedUp = false;
                if(discount.uses > 0) {
                    usedUp = (discount.used.length >= discount.uses);
                }
                
                if(kindAllowed && !expired && !usedUp) {
                    if(discount.amount > 0) {
                        // it's a dollar-based discount
                        if(discount.amount <= estimate.buyerReferralAmount) {
                            // discount rate doesn't exceed the buyer's referral fee
                            allowed.push(discount);
                        }
                    } else {
                        // it's a rate-based discount
                        if(discount.rate <= estimate.referral.buyer) {
                            // discount rate doesn't exceed the buyer's referral fee
                            allowed.push(discount);
                        }
                    }
                }
            }

            // send back the allowed discounts for this estimate
            return allowed;
        }
    },    

    url: {
        paramsToObject: function(uri) {
            uri = (typeof uri == 'string') ? uri : window.location.search.substr(1);
            if(util.is.nil(uri)) return {};

            var params = {};
            var paramsArray = uri.split('&');
            for(var i=0; i<paramsArray.length; i++) {
                var tempArray = paramsArray[i].split('=');
                params[tempArray[0]] = tempArray[1];
            }
            return params;
        },

        pathAtIndex: function(index, url) {
            if (typeof url === 'undefined') {
                url = window.location.href;
            }

            return url.split('/')[index];
        }
    },

    sameArray: function(first, second, sequence) {
        // this will only work with most native js obj types
        sequence = (typeof(sequence) === 'boolean') ? sequence : false;

        // order-insensitive matching
        if(!sequence) return $(first).not(second).length === 0 && $(second).not(first).length === 0;

        // all order-sensitive matching here
        if(first === second) return true;
        if(util.is.nil(first) || util.is.nil(second)) return false;
        if(first.length != second.length) return false;

        for(var i=0; i<first.length; i++) {
            if(first[i] !== second[i]) return false;
        }

        return true;
    },

    within: function(array, value) {
        for(var i=0; i<array.length; i++) {
            if(array[i] == value) return true;
        }

        return false;
    },

    format: {
        zip: function(str) {
            if(!util.is.zip(str)) return '';

            var zip = str.replace(/\D/g, '');
            if(zip.length == 9) {
                zip = zip.substr(0, 5) + '-' + zip.substr(5, 4);
            }

            return zip;
        }
    },

    currency: {
        dollarsToCents: function(num) {
            if(typeof(num) === 'string') {
                num = num.replace(/\$/g, '').replace(/,/g, '');
            }

            var d = parseFloat(num);
            if(!util.is.number(d)) return null;
            return parseInt(Math.round(d * 100));
        },

        centsToDollars: function(num, sign, commas) {
            sign = (typeof(sign) === 'boolean') ? sign : true;
            commas = (typeof(commas) === 'boolean') ? commas : sign;

            var c = parseFloat(num);
            if(!util.is.number(c)) return null;
            fixedNumber = (Math.round((Math.round(c) / 100) * 100) / 100).toFixed(2);

            var dollarSign = (sign) ? '$' : '';
            var ret = dollarSign + fixedNumber;
            var r = (commas) ? ret.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ret;
            return r;
        },

        roundCents: function(cents) {
            return parseInt(Math.round(cents));
        }
    },

    percentage: {
        to: function(d, symbol, decimalPlaces) {
            symbol = (typeof symbol === 'boolean') ? symbol : true;
            decimalPlaces = (util.is.nil(decimalPlaces)) ? -1 : decimalPlaces;

            d *= 100;

            if(decimalPlaces > 0) {
                var power = Math.pow(10, decimalPlaces);
                rounded = Math.round(d * power) / power;
                d = rounded.toFixed(decimalPlaces); // javascript floating point error fix
            }

            symbolChar = (symbol) ? '%' : '';
            return d + symbolChar;
        },

        from: function(p) {
            if(typeof(p) == 'string') {
                if(typeof(p) === 'string') {
                    p = p.replace(/\%/g, '').replace(/,/g, '');
                }
            }

            console.log(p);
            // marc, update this
            var d = parseFloat(p);
            if(!util.is.number(d)) return null;
            return (d / 100);
        }
    },

    time: {
        // returns time of day (e.g. 7:04 PM)
        timeOfDay: function(time, military, meridiem) {
                time = (typeof(time) === 'string') ? new Date(time) : time;
                military = (typeof(military) === 'boolean') ? military : false;

                if(!military) {
                    meridiem = (typeof(meridiem) === 'boolean') ? meridiem : true;
                } else {
                    meridiem = false;
                }

                var hour = time.getHours();
                var minute = time.getMinutes();

                var marker = 'AM';

                if(hour >= 12 && !military) {
                        hour -= 12;
                        marker = 'PM';
                }

                if(hour == 0 && !military) hour = 12;

                if(minute < 10) {
                    minute = '0' + minute;
                }

                return hour + ':' + minute + (meridiem ? ' ' + marker : '');
        },

        monthName: function(date) {
            date = (util.is.number(date)) ? date : date.getMonth();

            var months = [
                'January',
                'February',
                'March',
                'April',
                'May',
                'June',
                'July',
                'August',
                'September',
                'October',
                'November',
                'December'
            ];

            return months[date];
        },

        daysInMonth: function(month, year) {
            var date = new Date(year, month+1, 0);
            return date.getDate();
        },

        sameDay: function(a, b) {
            a = (typeof(a) === 'string') ? new Date(a) : a;
            b = (typeof(b) === 'string') ? new Date(b) : b;
            if(a.getDate() != b.getDate()) return false;
            if(a.getMonth() != b.getMonth()) return false;
            if(a.getFullYear() != b.getFullYear()) return false;
            return true;
        },

        // example: util.time.format(new Date(), "MM/DD/YYYY HH:MM", false)
        // util.time.format(new Date(), "The Month Is: MM", true)
		format: function(time, format, zeroPad) {
            time = (typeof(time) === 'string') ? new Date(time) : time;
            zeroPad = (typeof(zeroPad) === 'boolean') ? zeroPad : true;

            year = time.getFullYear().toString();
            year2 = year.slice(-2);
            month = (time.getMonth() + 1).toString();
            day = time.getDate().toString();
            hour = time.getHours();
            minute = time.getMinutes();
            second = time.getSeconds();

            if(zeroPad) {
                if(month.length == 1) month = '0' + month;
                if(day.length == 1) day = '0' + day;
                if(hour.length == 1) hour = '0' + hour;
                if(minute.length == 1) minute = '0' + minute;
                if(second.length == 1) second = '0' + second;
            }

            format = (typeof(format) === 'string') ? format : 'YYYYMMDDHHNNSS';

			if(format.indexOf('YYYY') != -1) {
				format = format.replace('YYYY', year);
			} else if(format.indexOf('YY') != -1) {
				format = format.replace('YY', year2);
			}

			if(format.indexOf('MM') != -1) {
				format = format.replace('MM', month);
			}

			if(format.indexOf('DD') != -1) {
				format = format.replace('DD', day);
			}

			if(format.indexOf('HH') != -1) {
				format = format.replace('HH', hour);
			}

			if(format.indexOf('NN') != -1) {
				format = format.replace('NN', minute);
			}

			if(format.indexOf('SS') != -1) {
				format = format.replace('SS', second);
			}

			return format;
		}
	},
}
