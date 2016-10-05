(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.bcPhoneNumber = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
angular.module("bcPhoneNumberTemplates", []).run(["$templateCache", function($templateCache) {$templateCache.put("bc-phone-number/bc-phone-number.html","<section class=\"input-group\">\r\n  <div class=\"input-group-btn\" uib-dropdown uib-keyboard-nav>\r\n    <button type=\"button\" class=\"btn btn-default\" type=\"button\" uib-dropdown-toggle>\r\n      <span class=\"glyphicon iti-flag bc-phone-number-flag\" ng-class=\"selectedCountry.iso2Code\"></span><span class=\"caret\"></span>\r\n    </button>\r\n    <ul class=\"uib-dropdown-menu bc-phone-number-dropdown-menu dropdown-menu\" role=\"menu\">\r\n      <li ng-repeat=\"country in preferredCountries\" ng-click=\"selectCountry(country)\"\r\n          ng-class=\"{active: isCountrySelected(country)}\" role=\"menuitem\">\r\n        <a href=\"#\" ng-click=\"$event.preventDefault()\" class=\"bc-phone-number-country-anchor\">\r\n          <i class=\"glyphicon iti-flag bc-phone-number-country-icon\" ng-class=\"country.iso2Code\"></i>\r\n          <span ng-bind=\"country.name\"></span>\r\n        </a>\r\n      </li>\r\n      <li role=\"separator\" class=\"divider\" ng-show=\"preferredCountries && preferredCountries.length\"></li>\r\n      <li ng-repeat=\"country in allCountries\" ng-click=\"selectCountry(country)\"\r\n          ng-class=\"{active: isCountrySelected(country)}\" role=\"menuitem\">\r\n        <a href=\"#\" ng-click=\"$event.preventDefault()\" class=\"bc-phone-number-country-anchor\">\r\n          <i class=\"glyphicon iti-flag bc-phone-number-country-icon\" ng-class=\"country.iso2Code\"></i>\r\n          <span ng-bind=\"country.name\"></span>\r\n        </a>\r\n      </li>\r\n    </ul>\r\n  </div>\r\n  <input type=\"tel\" class=\"form-control\" ng-model=\"number\" ng-disabled=\"ngDisabled\" ng-change=\"changed()\"/>\r\n</section>\r\n");}]);
},{}],2:[function(require,module,exports){
(function (global){
'use strict';

var bcCountries = (typeof window !== "undefined" ? window['bcCountries'] : typeof global !== "undefined" ? global['bcCountries'] : null);
var angular = (typeof window !== "undefined" ? window['angular'] : typeof global !== "undefined" ? global['angular'] : null);

global.angular = angular;
require('../build/js/templates');

angular.module('bcPhoneNumber', ['bcPhoneNumberTemplates', 'ui.bootstrap'])
	.service('bcPhoneNumber', function () {

		this.isValid = bcCountries.isValidNumber;
		this.format = bcCountries.formatNumber;
		
	})
	.directive('bcPhoneNumber', function () {

		if (typeof (bcCountries) === 'undefined') {
			throw new ('bc-countries not found, did you forget to load the Javascript?');
		}


		return {
			templateUrl: function(e,attrs){
				return attrs.template ? attrs.template :'bc-phone-number/bc-phone-number.html'
			}, 
			require: 'ngModel',
			scope: {
				preferredCountriesCodes: '@preferredCountries',
				defaultCountryCode: '@defaultCountry',
				selectedCountry: '=',
				countryCodes:'=',
				isValid: '=',
				ngModel: '=',
				ngChange: '=',
				ngDisabled: '='
			},
			link: function (scope, element, attrs, ctrl) {
				scope.selectedCountry = bcCountries.getCountryByIso2Code(scope.defaultCountryCode || 'us');
				scope.allCountries = bcCountries.getAllCountries();
				scope.name = 'phoneNumber';
				scope.autoSetValidity = false;
				if (attrs.autoSetValidity) {
					scope.autoSetValidity = attrs.autoSetValidity;
				}
				if (attrs.name) {
					scope.name = attrs.name;
				}
				if (!attrs.allowFormatNumber) {
					scope.allowFormatNumber = false;
				} else {
					scope.allowFormatNumber = angular.copy(attrs.allowFormatNumber);
				}
				if (scope.countryCodes) {
					scope.allCountries = [];
					scope.countryCodes.forEach(function (code) {
						scope.allCountries.push(bcCountries.getCountryByIso2Code(code));
					});
				} else {
					scope.allCountries = bcCountries.getAllCountries();
				}
				scope.number = scope.ngModel;
				scope.changed = function () {
					if (typeof scope.ngChange == 'function') {
						scope.ngChange();
					}
				}

				if (scope.preferredCountriesCodes) {
					var preferredCodes = scope.preferredCountriesCodes.split(' ');
					scope.preferredCountries = getPreferredCountries(preferredCodes);
				}
				
				scope.selectCountry = function (country) {
					scope.selectedCountry = country;

					scope.number = scope.ngModel = changeDialCode(scope.number, scope.allowFormatNumber, country.dialCode);
				};

				scope.isCountrySelected = function (country) {
					return country.iso2Code == scope.selectedCountry.iso2Code;
				};

				scope.resetCountry = function () {
					var defaultCountryCode = scope.defaultCountryCode;

					if (defaultCountryCode) {
						var defaultCountry = bcCountries.getCountryByIso2Code(defaultCountryCode);
						var number = changeDialCode(scope.number, scope.allowFormatNumber, defaultCountry.dialCode);

						scope.selectedCountry = defaultCountry;
						scope.ngModel = number;
						scope.number = number;
					}
				};

				scope.resetCountry();

				scope.$watch('ngModel', function (newValue) {
					scope.number = newValue;
				});

				scope.$watch('number', function (newValue) {
					scope.isValid = bcCountries.isValidNumber(newValue);
					if (scope.isValid && scope.countryCodes) {
						var digits = bcCountries.getDigits(newValue);
						var countryCode = bcCountries.getIso2CodeByDigits(digits);
						scope.isValid = scope.countryCodes.indexOf(countryCode) >= 0;
					}
					if (scope.autoSetValidity) {
						ctrl.$setValidity('phoneNumber', scope.isValid);
					}
				});

				scope.$watch('number', function (newValue) {
					if (newValue === '') {
						scope.ngModel = '';
					}
					else if (newValue) {
						var digits = bcCountries.getDigits(newValue);
						var countryCode = bcCountries.getIso2CodeByDigits(digits);

						if (countryCode) {
							var dialCode = bcCountries.getDialCodeByDigits(digits);
							var number = formatNumber(newValue);
							if (dialCode !== scope.selectedCountry.dialCode && scope.selectedCountry.dialCode) {
								scope.selectedCountry = bcCountries.getCountryByIso2Code(countryCode);
							}

							scope.ngModel = number;
							scope.number = number;
						}
						else {
							scope.ngModel = newValue;
						}
					}
				});
			}
		};
	});

module.exports = 'bcPhoneNumber';
function getPreferredCountries(preferredCodes) {
	var preferredCountries = [];

	for (var i = 0; i < preferredCodes.length; i++) {
		var country = bcCountries.getCountryByIso2Code(preferredCodes[i]);
		if (country) {
			preferredCountries.push(country);
		}
	}

	return preferredCountries;
}
function prefixNumber(number) {
	if (number && !hasPrefix(number)) {
		return ('+' + number);
	}
	else {
		return number;
	}
}
function hasPrefix(number) {
	return (number[0] === '+');
}
function formatNumber(number) {
	if (!number) {
		return '';
	}
	else {
		var dialCode = bcCountries.getDialCodeByDigits(bcCountries.getDigits(number));

		if (dialCode) {
			return formatNumberHelper(prefixNumber(number));
		}
		else {
			return number;
		}
	}
}
function formatNumberHelper(val, countryCode, addSuffix, allowExtension, isAllowedKey) {
	try {
		var clean = val.replace(/\D/g, ""),
			// NOTE: we use AsYouTypeFormatter because the default format function can't handle incomplete numbers e.g. "+17024" formats to "+1 7024" as opposed to "+1 702-4"
			// if clean is empty, we still need this to be a string otherwise we get errors later
			result = "",
			next,
			extSuffix = " ext. ";
		if (val.substr(0, 1) == "+") {
			clean = "+" + clean;
		}
		result = clean;


		// for some reason libphonenumber formats "+44" to "+44 ", but doesn't do the same with "+1"
		if (result.charAt(result.length - 1) == " ") {
			result = result.substr(0, result.length - 1);
		}
		// check if there's a suffix to add (unless there's an ext)
		if (addSuffix && !val.split(extSuffix)[1]) {
			// hack to get formatting suffix
			var test = result;
			// again the "+44 " problem... (also affects "+45" apparently)
			if (test.charAt(test.length - 1) == " ") {
				test = test.substr(0, test.length - 1);
			}
			// if adding a '5' introduces a formatting char - check if the penultimate char is not-a-number
			var penultimate = test.substr(test.length - 2, 1);
			// Note: never use isNaN without parseFloat
			if (isNaN(parseFloat(penultimate))) {
				// return the new value (minus that last '5' we just added)
				return test.substr(0, test.length - 1);
			} else if (allowExtension && result && test.length <= result.length && test.indexOf(" ") == -1 && !isAllowedKey) {
				// else if the next digit would break the formating, and we're allowing extensions, AND this is not an allowed key: add the suffix
				// NOTE: we must check this is not an allowed key because if it was that means it was the last digit in a valid number and we dont want to add the "ext" suffix in that case. This whole condition is just here to catch the case that: after typing a valid number, they try to type "ext" - this will not automatically add it for them.
				return result + extSuffix;
			}
		}

		// if the clean number contains an extension we need to add it
		if (next == -1) {
			result += extSuffix + clean.substring(i, clean.length);
		}
		return result;
	} catch (e) {
		return val;
	}
}
function changeDialCode(number, allowFormat, newDialCode) {
	if (!number) {
		return ('+' + newDialCode);
	}
	else {
		var digits = bcCountries.getDigits(number);
		var oldDialCode = bcCountries.getDialCodeByDigits(digits);

		if (oldDialCode) {
			var numberWithNewDialCode = digits.replace(oldDialCode, newDialCode);
			if (allowFormat) {
				var formattedNumber = bcCountries.formatNumber(numberWithNewDialCode);
			} else {
				formattedNumber = formatNumber(numberWithNewDialCode);
			}
			return formattedNumber;
		}
		else {
			if (allowFormat) {
				return bcCountries.formatNumber('+' + newDialCode + digits);
			} else {
				return formatNumber('+' + newDialCode + digits);
			}
		}
	}
}
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../build/js/templates":1}]},{},[2])(2)
});