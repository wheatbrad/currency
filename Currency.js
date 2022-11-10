function Currency() {}
var currencyUtilities = {
    convertStringToNumber: function (value) {
        return +value.replace(/[$,%]/g, '');
    },
    normalizeValue: function (value) {
        if (!value) return 0;
    
        var val = typeof value === 'string' ? this.convertStringToNumber(value) : value;
    
        return val * 100 || 0;
    },
    normalizeOperand: function (value) {
        var val = typeof value === 'string' ? this.convertStringToNumber(value) : value;
    
        return val >= 0 ? val : 1;
    },
    normalizePercent: function (value) {
        var pct = typeof value === 'string' ? this.convertStringToNumber(value) : value;
    
        return pct / 100;
    },
    formatMajorUnitString: function (value) {
        var result = value;

        if (value > 999) {
            var val = value.toString();
            var i = val.length - 1
            var j = i - 2;
            var result = '';
    
            do {
                result = ((i - j) % 3 === 0 && i !== 0)
                    ? ',' + val.charAt(i) + result
                    : val.charAt(i) + result;
            } while (i--);
        }

        return result;
    }
};

var currencyFactory = (function (utilities) {
    /**
     * 
     * @param {string|number} value Optional initial value.
     * @param {object} config Optional configuration object. Contains two properties, 
     *                        `displayMinorUnits` (enumerated) values include "alway", "never", "nonzero"
     *                        and `rounding` (enumerated) values include "nearest cent", "nearest dollar",
     *                        "cent down", "dollar down", "cent  up", dollar up.
     * @returns Instance of Currency
     */
    return function (value, config) {
        if (
            typeof config === 'undefined' ||
            Object.prototype.toString.call(config) !== '[object Object]'
        ) {
            config = {
                displayMinorUnits: 'always', // 'always' | 'never' | 'nonzero' 
                rounding: 'nearest' // 'cent nearest' | 'cent up' | 'cent down' | 'dollar nearest' | 'dollar down' | 'dollar up'
            };
        }

        var roundingFuncConfig = {
            'cent nearest': Math.round,
            'cent down': Math.floor,
            'cent up': Math.ceil,
            'dollar nearest': function(v) { return Math.round(v / 100) * 100 },
            'dollar down': function(v) { return Math.floor(v / 100) * 100 },
            'dollar up': function(v) { return Math.ceil(v / 100) * 100 }
            // TODO: banker's rule - more elaborate model for rounding
        };
        var roundingFunc = roundingFuncConfig[config.rounding] || roundingFuncConfig['cent nearest'];
        
        var currency = new Currency();
        var _currentValue = 0;

        currency.add = function (value) {
            _currentValue += value instanceof Currency ? value.raw() : utilities.normalizeValue(value);

            return this;
        };
        currency.subtract = function (value) {
            _currentValue -= value instanceof Currency ? value.raw() : utilities.normalizeValue(value);

            return this;
        };
        currency.multiply = function (value) {
            _currentValue *= value instanceof Currency ? value.raw() : utilities.normalizeOperand(value);

            return this;
        };
        currency.divide = function (value) {
            value = value instanceof Currency ? value.raw() : utilities.normalizeOperand(value);

            if (value === 0) return this;

            _currentValue /= value;

            return this;
        };
        currency.percentage = function (value) {
            if (typeof value === 'string' || typeof value === 'number') {
                _currentValue *=  utilities.normalizePercent(value);
            }

            return this;
        };
        currency.raw = function() {
            return _currentValue;
        };
        currency.print = function () {
            var value = roundingFunc(_currentValue);
            var sign = '';
            
            if (value < 0) {
                sign = '-';
                value = Math.abs(value);
            }
            
            var minorUnit = value % 100;
            var majorUnit = utilities.formatMajorUnitString((value - minorUnit) / 100);
            switch (config.displayMinorUnits) {
                case 'never':
                    minorUnit = '';
                    break;
                    
                case 'nonzero':
                    minorUnit = minorUnit === 0 ? '' : minorUnit < 10 ? '.0' + minorUnit : '.' + minorUnit;
                    break;
                        
                default:
                    // 'always' is default configuration
                    minorUnit = minorUnit < 10 ? '.0' + minorUnit : '.' + minorUnit;
            }

            return sign + '$' + majorUnit + minorUnit;
        };
        currency.destroy = function () {
            value              = null;
            config             = null;
            roundingFuncConfig = null;
            roundingFunc       = null;
            _currentValue      = null;
            delete this.add;
            delete this.subtract;
            delete this.multiply;
            delete this.divide;
            delete this.percentage;
            delete this.raw;
            delete this.print;
            delete this.destroy;
            delete this.toString;
            delete this.valueOf;
        };
        currency.toString = function () {
            return this.print();
        };
        currency.valueOf = function () {
            return this.print();
        };
    
        return currency.add(value);
    }
})(currencyUtilities);